import express from 'express'
import { z } from 'zod'
import multer from 'multer'
import sharp from 'sharp'
import { userHasPermission } from './permissions.js'

const postSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  classId: z.string().uuid().nullable().optional()
})
const commentSchema = z.object({ body: z.string().trim().min(1).max(1500) })
const reactionSchema = z.object({ reaction: z.enum(['like', 'heart', 'support', 'laugh', 'idea']) })
const reportSchema = z.object({
  postId: z.string().uuid().optional(),
  commentId: z.string().uuid().optional(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'privacy', 'other']),
  details: z.string().trim().max(500).default('')
}).refine(value => Boolean(value.postId) !== Boolean(value.commentId))

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Перевір правильність заповнення полів.' })
    req.validatedBody = parsed.data
    next()
  }
}

export function createPostsRouter({ pool, requireAuth, contentLimiter, reportLimiter, photoUploadLimiter }) {
  const router = express.Router()
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024, files: 5, fields: 2, fieldSize: 20 * 1024, parts: 7 },
    fileFilter: (_req, file, callback) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      callback(allowed.includes(file.mimetype) ? null : new Error('Дозволені лише JPG, PNG та WebP.'), allowed.includes(file.mimetype))
    }
  })

  function photoUpload(req, res, next) {
    upload.array('photos', 5)(req, res, error => {
      if (error) {
        const message = error.code === 'LIMIT_FILE_SIZE'
          ? 'Кожне фото має бути розміром до 2 МБ.'
          : error.code === 'LIMIT_FILE_COUNT'
            ? 'В одному дописі можна додати не більше 5 фото.'
            : 'Дозволені лише JPG, PNG та WebP.'
        return res.status(400).json({ error: message })
      }
      next()
    })
  }

  async function visiblePost(postId, userId) {
    const result = await pool.query(
      'SELECT p.id, p.class_id, p.author_id FROM posts p WHERE p.id = $1 AND p.status = \'published\' AND (p.class_id IS NULL OR EXISTS (SELECT 1 FROM class_memberships cm WHERE cm.class_id = p.class_id AND cm.user_id = $2)) LIMIT 1',
      [postId, userId]
    )
    return result.rows[0] || null
  }

  router.post('/posts/with-photos', requireAuth, photoUploadLimiter, photoUpload, async (req, res, next) => {
    let client
    try {
      client = await pool.connect()
      const body = typeof req.body.body === 'string' ? req.body.body.trim() : ''
      const classId = req.body.classId ? String(req.body.classId) : null
      const files = req.files || []
      if (body.length > 5000) return res.status(400).json({ error: 'Текст допису має бути до 5000 символів.' })
      if (!body && files.length === 0) return res.status(400).json({ error: 'Додай текст або фото до допису.' })
      if (classId && !z.string().uuid().safeParse(classId).success) {
        return res.status(400).json({ error: 'Некоректний ідентифікатор класу.' })
      }
      if (classId) {
        const membership = await client.query(
          'SELECT 1 FROM class_memberships WHERE class_id = $1 AND user_id = $2',
          [classId, req.user.id]
        )
        if (!membership.rowCount) return res.status(403).json({ error: 'Публікувати в цьому класі можуть лише його учасники.' })
      }

      const processedPhotos = []
      for (const file of files) {
        let metadata
        let optimized
        try {
          metadata = await sharp(file.buffer, { limitInputPixels: 40000000, failOn: 'error' }).metadata()
          if (!['jpeg', 'png', 'webp'].includes(metadata.format || '') || !metadata.width || !metadata.height) {
            return res.status(400).json({ error: 'Файл не є підтримуваним зображенням.' })
          }
          optimized = await sharp(file.buffer, { limitInputPixels: 40000000, failOn: 'error' })
            .rotate()
            .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 82, effort: 4 })
            .toBuffer({ resolveWithObject: true })
        } catch {
          return res.status(400).json({ error: 'Не вдалося прочитати це зображення. Спробуй інший файл.' })
        }
        if (optimized.data.length > 2 * 1024 * 1024) {
          return res.status(400).json({ error: 'Після обробки фото все ще завелике. Спробуй інше зображення.' })
        }
        processedPhotos.push({
          data: optimized.data,
          size: optimized.data.length,
          width: optimized.info.width,
          height: optimized.info.height
        })
      }

      if (!(await userHasPermission(pool, req.user.id, 'posts.create', classId))) return res.status(403).json({ error: 'Недостатньо прав для публікації.' })

      await client.query('BEGIN')
      const postResult = await client.query(
        'INSERT INTO posts (author_id, class_id, body) VALUES ($1, $2, $3) RETURNING id, author_id, class_id, body, created_at',
        [req.user.id, classId, body]
      )
      const post = postResult.rows[0]
      const savedPhotos = []
      for (const photo of processedPhotos) {
        const saved = await client.query(
          'INSERT INTO post_photos (post_id, mime_type, size_bytes, width, height, image_data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, mime_type, size_bytes, width, height',
          [post.id, 'image/webp', photo.size, photo.width, photo.height, photo.data]
        )
        savedPhotos.push(saved.rows[0])
      }
      await client.query('COMMIT')
      res.status(201).json({ post, photos: savedPhotos })
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => undefined)
      next(error)
    } finally {
      client?.release()
    }
  })

  router.get('/photos/:photoId', requireAuth, async (req, res, next) => {
    try {
      const photoId = z.string().uuid().safeParse(req.params.photoId)
      if (!photoId.success) return res.status(400).json({ error: 'Некоректне фото.' })
      const result = await pool.query(
        'SELECT ph.image_data, ph.mime_type FROM post_photos ph JOIN posts p ON p.id = ph.post_id WHERE ph.id = $1 AND p.status = \'published\' AND (p.class_id IS NULL OR EXISTS (SELECT 1 FROM class_memberships cm WHERE cm.class_id = p.class_id AND cm.user_id = $2)) LIMIT 1',
        [photoId.data, req.user.id]
      )
      if (!result.rowCount || !result.rows[0].image_data) return res.status(404).json({ error: 'Фото не знайдено.' })
      res.setHeader('Content-Type', result.rows[0].mime_type)
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Cache-Control', 'private, no-store')
      res.send(result.rows[0].image_data)
    } catch (error) { next(error) }
  })

  router.get('/posts', requireAuth, async (req, res, next) => {
    try {
      const classId = req.query.classId ? String(req.query.classId) : null
      if (classId && !z.string().uuid().safeParse(classId).success) {
        return res.status(400).json({ error: 'Некоректний ідентифікатор класу.' })
      }
      if (classId) {
        const membership = await pool.query(
          'SELECT 1 FROM class_memberships WHERE class_id = $1 AND user_id = $2',
          [classId, req.user.id]
        )
        if (!membership.rowCount) return res.status(403).json({ error: 'Ця сторінка доступна лише учасникам класу.' })
      }
      const result = await pool.query(
        "SELECT p.id, p.body, p.class_id, p.created_at, u.id AS author_id, u.username AS author_username, u.display_name AS author_name, COALESCE(c.comment_count, 0)::int AS comment_count, COALESCE(r.reaction_count, 0)::int AS reaction_count, mine.reaction AS my_reaction, COALESCE((SELECT json_agg(json_build_object('id', ph.id, 'mime_type', ph.mime_type, 'width', ph.width, 'height', ph.height) ORDER BY ph.created_at ASC) FROM post_photos ph WHERE ph.post_id = p.id), '[]'::json) AS photos FROM posts p JOIN users u ON u.id = p.author_id LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM post_comments WHERE status = 'published' GROUP BY post_id) c ON c.post_id = p.id LEFT JOIN (SELECT post_id, COUNT(*) AS reaction_count FROM post_reactions GROUP BY post_id) r ON r.post_id = p.id LEFT JOIN post_reactions mine ON mine.post_id = p.id AND mine.user_id = $2 WHERE p.status = 'published' AND p.class_id IS NOT DISTINCT FROM $1 ORDER BY p.created_at DESC LIMIT 40",
        [classId, req.user.id]
      )
      res.json({ posts: result.rows })
    } catch (error) { next(error) }
  })

  router.post('/posts', requireAuth, contentLimiter, validate(postSchema), async (req, res, next) => {
    try {
      const { body, classId = null } = req.validatedBody
      if (!(await userHasPermission(pool, req.user.id, 'posts.create', classId))) return res.status(403).json({ error: 'Недостатньо прав для публікації.' })
      if (classId) {
        const membership = await pool.query(
          'SELECT 1 FROM class_memberships WHERE class_id = $1 AND user_id = $2',
          [classId, req.user.id]
        )
        if (!membership.rowCount) return res.status(403).json({ error: 'Публікувати в цьому класі можуть лише його учасники.' })
      }
      const result = await pool.query(
        'INSERT INTO posts (author_id, class_id, body) VALUES ($1, $2, $3) RETURNING id, author_id, class_id, body, created_at',
        [req.user.id, classId, body]
      )
      res.status(201).json({ post: result.rows[0] })
    } catch (error) { next(error) }
  })

  router.get('/posts/:postId/comments', requireAuth, async (req, res, next) => {
    try {
      const parsedId = z.string().uuid().safeParse(req.params.postId)
      if (!parsedId.success) return res.status(400).json({ error: 'Некоректний допис.' })
      if (!(await visiblePost(parsedId.data, req.user.id))) return res.status(404).json({ error: 'Допис не знайдено.' })
      const result = await pool.query(
        'SELECT c.id, c.body, c.created_at, u.id AS author_id, u.username AS author_username, u.display_name AS author_name FROM post_comments c JOIN users u ON u.id = c.author_id WHERE c.post_id = $1 AND c.status = \'published\' ORDER BY c.created_at ASC LIMIT 100',
        [parsedId.data]
      )
      res.json({ comments: result.rows })
    } catch (error) { next(error) }
  })

  router.post('/posts/:postId/comments', requireAuth, contentLimiter, validate(commentSchema), async (req, res, next) => {
    try {
      const parsedId = z.string().uuid().safeParse(req.params.postId)
      if (!parsedId.success) return res.status(400).json({ error: 'Некоректний допис.' })
      if (!(await visiblePost(parsedId.data, req.user.id))) return res.status(404).json({ error: 'Допис не знайдено.' })
      if (!(await userHasPermission(pool, req.user.id, 'comments.create'))) return res.status(403).json({ error: 'Недостатньо прав для коментування.' })
      const result = await pool.query(
        'INSERT INTO post_comments (post_id, author_id, body) VALUES ($1, $2, $3) RETURNING id, post_id, author_id, body, created_at',
        [parsedId.data, req.user.id, req.validatedBody.body]
      )
      res.status(201).json({ comment: result.rows[0] })
    } catch (error) { next(error) }
  })

  router.put('/posts/:postId/reaction', requireAuth, contentLimiter, validate(reactionSchema), async (req, res, next) => {
    try {
      const parsedId = z.string().uuid().safeParse(req.params.postId)
      if (!parsedId.success) return res.status(400).json({ error: 'Некоректний допис.' })
      if (!(await visiblePost(parsedId.data, req.user.id))) return res.status(404).json({ error: 'Допис не знайдено.' })
      if (!(await userHasPermission(pool, req.user.id, 'reactions.create'))) return res.status(403).json({ error: 'Недостатньо прав для реакцій.' })
      const result = await pool.query(
        'INSERT INTO post_reactions (post_id, user_id, reaction) VALUES ($1, $2, $3) ON CONFLICT (post_id, user_id) DO UPDATE SET reaction = EXCLUDED.reaction, created_at = NOW() RETURNING post_id, reaction',
        [parsedId.data, req.user.id, req.validatedBody.reaction]
      )
      res.json({ reaction: result.rows[0] })
    } catch (error) { next(error) }
  })

  router.delete('/posts/:postId/reaction', requireAuth, async (req, res, next) => {
    try {
      const parsedId = z.string().uuid().safeParse(req.params.postId)
      if (!parsedId.success) return res.status(400).json({ error: 'Некоректний допис.' })
      await pool.query('DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2', [parsedId.data, req.user.id])
      res.status(204).end()
    } catch (error) { next(error) }
  })

  router.post('/reports', requireAuth, reportLimiter, validate(reportSchema), async (req, res, next) => {
    try {
      const { postId = null, commentId = null, reason, details } = req.validatedBody
      if (!(await userHasPermission(pool, req.user.id, 'reports.create'))) return res.status(403).json({ error: 'Недостатньо прав для скарг.' })
      if (postId) {
        if (!(await visiblePost(postId, req.user.id))) return res.status(404).json({ error: 'Допис не знайдено.' })
      } else {
        const comment = await pool.query(
          'SELECT c.id FROM post_comments c JOIN posts p ON p.id = c.post_id WHERE c.id = $1 AND c.status = \'published\' AND (p.class_id IS NULL OR EXISTS (SELECT 1 FROM class_memberships cm WHERE cm.class_id = p.class_id AND cm.user_id = $2))',
          [commentId, req.user.id]
        )
        if (!comment.rowCount) return res.status(404).json({ error: 'Коментар не знайдено.' })
      }
      const result = await pool.query(
        'INSERT INTO content_reports (reporter_id, post_id, comment_id, reason, details) VALUES ($1, $2, $3, $4, $5) RETURNING id, status, created_at',
        [req.user.id, postId, commentId, reason, details]
      )
      res.status(201).json({ report: result.rows[0] })
    } catch (error) { next(error) }
  })

  return router
}

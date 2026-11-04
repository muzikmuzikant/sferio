import express from 'express'
import { z } from 'zod'

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

export function createPostsRouter({ pool, requireAuth, contentLimiter, reportLimiter }) {
  const router = express.Router()

  async function visiblePost(postId, userId) {
    const result = await pool.query(
      'SELECT p.id, p.class_id, p.author_id FROM posts p WHERE p.id = $1 AND p.status = \'published\' AND (p.class_id IS NULL OR EXISTS (SELECT 1 FROM class_memberships cm WHERE cm.class_id = p.class_id AND cm.user_id = $2)) LIMIT 1',
      [postId, userId]
    )
    return result.rows[0] || null
  }

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
        'SELECT p.id, p.body, p.class_id, p.created_at, u.id AS author_id, u.username AS author_username, u.display_name AS author_name, COALESCE(c.comment_count, 0)::int AS comment_count, COALESCE(r.reaction_count, 0)::int AS reaction_count, mine.reaction AS my_reaction FROM posts p JOIN users u ON u.id = p.author_id LEFT JOIN (SELECT post_id, COUNT(*) AS comment_count FROM post_comments WHERE status = \'published\' GROUP BY post_id) c ON c.post_id = p.id LEFT JOIN (SELECT post_id, COUNT(*) AS reaction_count FROM post_reactions GROUP BY post_id) r ON r.post_id = p.id LEFT JOIN post_reactions mine ON mine.post_id = p.id AND mine.user_id = $2 WHERE p.status = \'published\' AND p.class_id IS NOT DISTINCT FROM $1 ORDER BY p.created_at DESC LIMIT 40',
        [classId, req.user.id]
      )
      res.json({ posts: result.rows })
    } catch (error) { next(error) }
  })

  router.post('/posts', requireAuth, contentLimiter, validate(postSchema), async (req, res, next) => {
    try {
      const { body, classId = null } = req.validatedBody
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

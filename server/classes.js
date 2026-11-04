import express from 'express'
import { z } from 'zod'
import { userHasPermission } from './permissions.js'

const createClassSchema = z.object({
  grade: z.number().int().min(1).max(11),
  section: z.string().trim().min(1).max(3).regex(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ]+$/)
})
const addMemberSchema = z.object({
  username: z.string().trim().min(3).max(24),
  classRole: z.enum(['student', 'class_teacher', 'starosta', 'deputy']).default('student')
})

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Перевір правильність заповнення полів.' })
    req.validatedBody = parsed.data
    next()
  }
}

export function createClassesRouter({ pool, requireAuth }) {
  const router = express.Router()

  router.get('/classes', requireAuth, async (req, res, next) => {
    try {
      const result = await pool.query(
        'SELECT c.id, c.name, c.grade, c.section, cm.class_role FROM class_memberships cm JOIN school_classes c ON c.id = cm.class_id WHERE cm.user_id = $1 ORDER BY c.grade, c.section',
        [req.user.id]
      )
      res.json({ classes: result.rows })
    } catch (error) { next(error) }
  })

  router.get('/classes/:classId', requireAuth, async (req, res, next) => {
    try {
      const classId = z.string().uuid().safeParse(req.params.classId)
      if (!classId.success) return res.status(400).json({ error: 'Некоректний клас.' })
      const membership = await pool.query(
        'SELECT 1 FROM class_memberships WHERE class_id = $1 AND user_id = $2',
        [classId.data, req.user.id]
      )
      if (!membership.rowCount) return res.status(403).json({ error: 'Ця сторінка доступна лише учасникам класу.' })
      const classResult = await pool.query(
        'SELECT id, name, grade, section, created_at FROM school_classes WHERE id = $1 LIMIT 1',
        [classId.data]
      )
      if (!classResult.rowCount) return res.status(404).json({ error: 'Клас не знайдено.' })
      const members = await pool.query(
        'SELECT u.id, u.username, u.display_name, cm.class_role, cm.assigned_at FROM class_memberships cm JOIN users u ON u.id = cm.user_id WHERE cm.class_id = $1 ORDER BY CASE cm.class_role WHEN \'class_teacher\' THEN 0 WHEN \'starosta\' THEN 1 WHEN \'deputy\' THEN 2 ELSE 3 END, u.display_name',
        [classId.data]
      )
      res.json({ class: classResult.rows[0], members: members.rows })
    } catch (error) { next(error) }
  })

  router.post('/classes', requireAuth, validate(createClassSchema), async (req, res, next) => {
    try {
      if (!(await userHasPermission(pool, req.user.id, 'classes.manage'))) {
        return res.status(403).json({ error: 'Створювати класи може лише адміністрація.' })
      }
      const grade = req.validatedBody.grade
      const section = req.validatedBody.section.toUpperCase()
      const name = String(grade) + '-' + section
      const result = await pool.query(
        'INSERT INTO school_classes (name, grade, section, created_by) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING RETURNING id, name, grade, section, created_at',
        [name, grade, section, req.user.id]
      )
      if (!result.rowCount) return res.status(409).json({ error: 'Такий клас уже існує.' })
      await pool.query(
        "INSERT INTO audit_log (actor_id, action, target_type, target_id, details) VALUES ($1, 'class.created', 'class', $2, $3::jsonb)",
        [req.user.id, result.rows[0].id, JSON.stringify({ name })]
      )
      res.status(201).json({ class: result.rows[0] })
    } catch (error) { next(error) }
  })

  router.post('/classes/:classId/members', requireAuth, validate(addMemberSchema), async (req, res, next) => {
    const client = await pool.connect()
    try {
      const classId = z.string().uuid().safeParse(req.params.classId)
      if (!classId.success) return res.status(400).json({ error: 'Некоректний клас.' })
      if (!(await userHasPermission(pool, req.user.id, 'class.members.manage', classId.data))) {
        return res.status(403).json({ error: 'Керувати складом класу може класний керівник або адміністрація.' })
      }
      const { username, classRole } = req.validatedBody
      if (classRole === 'class_teacher' && !(await userHasPermission(pool, req.user.id, 'classes.manage'))) {
        return res.status(403).json({ error: 'Призначати класного керівника може лише адміністрація.' })
      }
      if (['starosta', 'deputy'].includes(classRole) &&
          !(await userHasPermission(pool, req.user.id, 'class.leadership.manage', classId.data))) {
        return res.status(403).json({ error: 'Призначати старосту та заступника може класний керівник або адміністрація.' })
      }
      const target = await client.query(
        'SELECT id FROM users WHERE username_normalized = $1 LIMIT 1',
        [username.toLowerCase()]
      )
      if (!target.rowCount) return res.status(404).json({ error: 'Користувача з таким логіном не знайдено.' })
      const classExists = await client.query('SELECT 1 FROM school_classes WHERE id = $1', [classId.data])
      if (!classExists.rowCount) return res.status(404).json({ error: 'Клас не знайдено.' })

      await client.query('BEGIN')
      if (classRole !== 'student') {
        const roleSlug = classRole
        await client.query(
          'UPDATE class_memberships SET class_role = \'student\' WHERE class_id = $1 AND class_role = $2',
          [classId.data, roleSlug]
        )
        await client.query(
          'DELETE FROM user_roles ur USING roles r WHERE ur.role_id = r.id AND ur.class_id = $1 AND r.slug = $2',
          [classId.data, roleSlug]
        )
      }
      await client.query(
        'INSERT INTO class_memberships (class_id, user_id, class_role) VALUES ($1, $2, $3) ON CONFLICT (class_id, user_id) DO UPDATE SET class_role = EXCLUDED.class_role',
        [classId.data, target.rows[0].id, classRole]
      )
      if (classRole !== 'student') {
        await client.query(
          'INSERT INTO user_roles (user_id, role_id, class_id, assigned_by) SELECT $1, id, $2, $3 FROM roles WHERE slug = $4 ON CONFLICT DO NOTHING',
          [target.rows[0].id, classId.data, req.user.id, classRole]
        )
      } else {
        await client.query(
          'DELETE FROM user_roles ur USING roles r WHERE ur.role_id = r.id AND ur.user_id = $1 AND ur.class_id = $2 AND r.slug IN (\'class_teacher\', \'starosta\', \'deputy\')',
          [target.rows[0].id, classId.data]
        )
      }
      await client.query(
        "INSERT INTO audit_log (actor_id, action, target_type, target_id, details) VALUES ($1, 'class.member.assigned', 'user', $2, $3::jsonb)",
        [req.user.id, target.rows[0].id, JSON.stringify({ classId: classId.data, classRole })]
      )
      await client.query('COMMIT')
      res.status(200).json({ ok: true })
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => undefined)
      next(error)
    } finally {
      client?.release()
    }
  })

  return router
}

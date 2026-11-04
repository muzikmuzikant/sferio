import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { timingSafeEqual } from 'node:crypto'
import { initializeDatabase, pool, closeDatabase } from './db.js'
import { createSession, getSessionUser, loginAccount, registerAccount, revokeSession } from './auth.js'
import { createPostsRouter } from './posts.js'
import { createClassesRouter } from './classes.js'

const app = express()
const port = Number(process.env.PORT || 8080)
const rootDir = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(rootDir, '../dist')

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}))
app.use(express.json({ limit: '32kb', strict: true }))
app.use(cookieParser())
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Pragma', 'no-cache')
  next()
})

// IP-based limits are deliberately generous because students may share a school Wi-Fi network.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Забагато спроб. Спробуй трохи пізніше.' }
})
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Забагато спроб реєстрації. Спробуй пізніше.' }
})
const contentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Забагато дій за короткий час. Спробуй пізніше.' }
})
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Забагато скарг. Спробуй пізніше.' }
})

const registrationSchema = z.object({
  username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_.-]+$/),
  displayName: z.string().trim().min(2).max(40),
  password: z.string().min(10).max(128),
  schoolCode: z.string().trim().min(1).max(128)
})
const bootstrapSchema = z.object({ token: z.string().min(32).max(256) })
const loginSchema = z.object({
  username: z.string().trim().min(1).max(24),
  password: z.string().min(1).max(128)
})

function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Перевір правильність заповнення полів.' })
    }
    req.validatedBody = parsed.data
    next()
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true, service: 'sferio-api' })
  } catch {
    res.status(503).json({ ok: false, error: 'database_unavailable' })
  }
})

app.post('/api/auth/register', registrationLimiter, validate(registrationSchema), async (req, res, next) => {
  try {
    const user = await registerAccount(req.validatedBody, res)
    res.status(201).json({ user })
  } catch (error) { next(error) }
})

app.post('/api/auth/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const user = await loginAccount(req.validatedBody, res)
    res.json({ user })
  } catch (error) { next(error) }
})

async function requireAuth(req, res, next) {
  try {
    const user = await getSessionUser(req)
    if (!user) return res.status(401).json({ error: 'Потрібно увійти до SFERIO.' })
    req.user = user
    next()
  } catch (error) { next(error) }
}

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }))

app.post('/api/admin/bootstrap', requireAuth, validate(bootstrapSchema), async (req, res, next) => {
  const expectedToken = process.env.SFERIO_ADMIN_BOOTSTRAP_TOKEN
  if (!expectedToken) return res.status(503).json({ error: 'Початкове налаштування адміністратора ще не ввімкнено.' })
  const provided = Buffer.from(req.validatedBody.token)
  const expected = Buffer.from(expectedToken)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return res.status(403).json({ error: 'Невірний код початкового налаштування.' })
  }

  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')
    const setting = await client.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'admin_bootstrap_claimed' FOR UPDATE"
    )
    if (setting.rows[0]?.setting_value === true) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Початковий доступ адміністратора вже використано.' })
    }
    const adminRole = await client.query("SELECT id FROM roles WHERE slug = 'admin' LIMIT 1")
    if (!adminRole.rowCount) throw new Error('Admin role missing from schema')
    await client.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, adminRole.rows[0].id]
    )
    await client.query("UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1", [req.user.id])
    await client.query(
      "UPDATE system_settings SET setting_value = 'true'::jsonb, updated_at = NOW() WHERE setting_key = 'admin_bootstrap_claimed'"
    )
    await client.query(
      "INSERT INTO audit_log (actor_id, action, target_type, target_id) VALUES ($1, 'admin.bootstrap.claimed', 'user', $1)",
      [req.user.id]
    )
    await client.query('COMMIT')
    res.json({ ok: true, message: 'Початкові права адміністратора активовано.' })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => undefined)
    next(error)
  } finally {
    client?.release()
  }
})

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    await revokeSession(req, res)
    res.status(204).end()
  } catch (error) { next(error) }
})

app.use('/api', createPostsRouter({ pool, requireAuth, contentLimiter, reportLimiter }))
app.use('/api', createClassesRouter({ pool, requireAuth }))
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }))
app.use(express.static(distDir, { index: false, maxAge: '1h' }))
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')))

app.use((error, _req, res, _next) => {
  const status = Number.isInteger(error.status) ? error.status : 500
  if (status >= 500) console.error('Request failed:', error.message)
  res.status(status).json({
    error: status >= 500 ? 'Сталася помилка. Спробуй пізніше.' : error.message
  })
})

await initializeDatabase()
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`SFERIO API listening on ${port}`)
})

async function shutdown() {
  server.close(async () => {
    await closeDatabase()
    process.exit(0)
  })
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeDatabase, pool, closeDatabase } from './db.js'
import { createSession, getSessionUser, loginAccount, registerAccount, revokeSession } from './auth.js'

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
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Забагато спроб. Спробуй трохи пізніше.' }
})
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Забагато спроб реєстрації. Спробуй пізніше.' }
})

const registrationSchema = z.object({
  username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_.-]+$/),
  displayName: z.string().trim().min(2).max(40),
  password: z.string().min(10).max(128),
  schoolCode: z.string().trim().min(1).max(128)
})
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

app.get('/api/auth/me', async (req, res, next) => {
  try {
    const user = await getSessionUser(req)
    if (!user) return res.status(401).json({ error: 'Потрібно увійти до SFERIO.' })
    res.json({ user })
  } catch (error) { next(error) }
})

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    await revokeSession(req, res)
    res.status(204).end()
  } catch (error) { next(error) }
})

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

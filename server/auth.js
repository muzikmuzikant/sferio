import { randomBytes, createHash } from 'node:crypto'
import { hash, verify } from '@node-rs/argon2'
import { pool } from './db.js'

const SESSION_DAYS = 30
const COOKIE_NAME = 'sferio_session'

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function matchesSchoolCode(candidate) {
  const expected = process.env.SCHOOL_ACCESS_CODE_HASH
  if (!expected || !expected.startsWith('$argon2')) return false
  try {
    return await verify(expected, candidate)
  } catch {
    return false
  }
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    role: user.role,
    createdAt: user.created_at
  }
}

export async function createSession(userId, res) {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = sha256(token)
  const expiresAt = new Date(Date.now() + cookieOptions.maxAge)

  // Remove expired sessions opportunistically so the session table stays small.
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()')
  await pool.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  )
  res.cookie(COOKIE_NAME, token, cookieOptions)
}

export async function getSessionUser(req) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return null

  const result = await pool.query(
    `SELECT u.id, u.username, u.display_name, u.role, u.created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [sha256(token)]
  )
  return result.rows[0] ? publicUser(result.rows[0]) : null
}

export async function registerAccount({ username, displayName, password, schoolCode }, res) {
  if (!(await matchesSchoolCode(schoolCode))) {
    const error = new Error('Невірний код доступу до ліцею.')
    error.status = 400
    throw error
  }

  const normalized = username.trim().toLowerCase()
  const passwordHash = await hash(password, {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1
  })

  const client = await pool.connect()
  let user
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `INSERT INTO users (username, username_normalized, display_name, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, role, created_at`,
      [username.trim(), normalized, displayName.trim(), passwordHash]
    )
    user = result.rows[0]
    await client.query('INSERT INTO user_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [user.id])
    await client.query(
      "INSERT INTO user_roles (user_id, role_id) SELECT $1, id FROM roles WHERE slug = 'student' ON CONFLICT DO NOTHING",
      [user.id]
    )
    await client.query(
      "INSERT INTO audit_log (actor_id, action, target_type, target_id) VALUES ($1, 'account.registered', 'user', $1)",
      [user.id]
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    if (error.code === '23505') {
      const conflict = new Error('Цей логін уже зайнятий.')
      conflict.status = 409
      throw conflict
    }
    throw error
  } finally {
    client.release()
  }

  await createSession(user.id, res)
  return publicUser(user)
}

export async function loginAccount({ username, password }, res) {
  const normalized = username.trim().toLowerCase()
  const result = await pool.query(
    `SELECT id, username, display_name, password_hash, role, created_at
     FROM users WHERE username_normalized = $1 LIMIT 1`,
    [normalized]
  )
  const user = result.rows[0]
  const valid = user ? await verify(user.password_hash, password) : false

  if (!valid) {
    const error = new Error('Неправильний логін або пароль.')
    error.status = 401
    throw error
  }

  await createSession(user.id, res)
  return publicUser(user)
}

export async function revokeSession(req, res) {
  const token = req.cookies?.[COOKIE_NAME]
  if (token) {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [sha256(token)])
  }
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined })
}

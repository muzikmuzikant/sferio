import pg from 'pg'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const { Pool } = pg
const schemaPath = fileURLToPath(new URL('./schema.sql', import.meta.url))

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
  ...(process.env.PGSSLMODE === 'require'
    ? { ssl: { rejectUnauthorized: false } }
    : {})
})

export async function initializeDatabase() {
  const schema = await readFile(schemaPath, 'utf8')
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto')
  await pool.query(schema)
}

export async function closeDatabase() {
  await pool.end()
}

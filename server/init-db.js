import { initializeDatabase, closeDatabase } from './db.js'

try {
  await initializeDatabase()
  console.log('SFERIO database schema is ready.')
} finally {
  await closeDatabase()
}

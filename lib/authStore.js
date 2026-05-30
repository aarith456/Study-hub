import { getDb } from './db.js'

export async function findUserByEmail(email) {
  const sql = getDb()
  const normalized = email.trim().toLowerCase()
  const rows = await sql`SELECT * FROM users WHERE email = ${normalized} LIMIT 1`
  return rows[0] ? dbToUser(rows[0]) : null
}

export async function findUserById(id) {
  const sql = getDb()
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`
  return rows[0] ? dbToUser(rows[0]) : null
}

export async function createUser({ id, email, name, passwordHash }) {
  const sql = getDb()
  const normalized = email.trim().toLowerCase()
  const rows = await sql`
    INSERT INTO users (id, email, name, password_hash)
    VALUES (${id}, ${normalized}, ${name.trim()}, ${passwordHash})
    RETURNING *
  `
  return dbToUser(rows[0])
}

export async function listAllUsers() {
  const sql = getDb()
  const rows = await sql`SELECT * FROM users ORDER BY created_at DESC`
  return rows.map(dbToUser).map(toPublicUser)
}

function dbToUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role || 'user',
    createdAt: row.created_at,
  }
}

export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
    createdAt: user.createdAt,
  }
}

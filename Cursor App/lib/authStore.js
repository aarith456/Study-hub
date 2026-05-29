import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const usersPath = join(dataDir, 'users.json')

function ensureStore() {
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
  if (!existsSync(usersPath)) {
    writeFileSync(usersPath, JSON.stringify({ users: [] }, null, 2), 'utf8')
  }
}

function readStore() {
  ensureStore()
  const raw = readFileSync(usersPath, 'utf8')
  const data = JSON.parse(raw)
  return { users: Array.isArray(data.users) ? data.users : [] }
}

function writeStore(data) {
  ensureStore()
  writeFileSync(usersPath, JSON.stringify(data, null, 2), 'utf8')
}

export function findUserByEmail(email) {
  const { users } = readStore()
  const normalized = email.trim().toLowerCase()
  return users.find((u) => u.email === normalized) ?? null
}

export function findUserById(id) {
  const { users } = readStore()
  return users.find((u) => u.id === id) ?? null
}

export function createUser({ id, email, name, passwordHash }) {
  const data = readStore()
  const user = {
    id,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  }
  data.users.push(user)
  writeStore(data)
  return user
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

export function listAllUsers() {
  const { users } = readStore()
  return users.map(toPublicUser)
}

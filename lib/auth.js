import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { createUser, findUserByEmail, findUserById, toPublicUser } from './authStore.js'
import { trackEvent, updateUserStats } from './analyticsStore.js'

const scryptAsync = promisify(scrypt)
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim()
  if (secret && secret.length >= 16) return secret
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error('JWT_SECRET must be set in .env (at least 16 characters)')
  }
  return 'studyhub-local-dev-secret'
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derived = await scryptAsync(password, salt, 64)
  return `${salt}:${derived.toString('hex')}`
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = await scryptAsync(password, salt, 64)
  const a = Buffer.from(hash, 'hex')
  const b = derived
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function signTokenPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', getJwtSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

function signToken(userId, role = 'user') {
  return signTokenPayload({ sub: userId, role, exp: Date.now() + TOKEN_TTL_MS })
}

function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
  }
}

export function verifyToken(token) {
  if (!token?.trim()) return null
  const parts = token.trim().split('.')
  if (parts.length !== 2) return null

  const [payload, sig] = parts
  const expected = createHmac('sha256', getJwtSecret()).update(payload).digest('base64url')
  if (sig !== expected) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (!data.sub || !data.exp || data.exp < Date.now()) return null

    if (data.role === 'admin' && data.sub === 'admin') {
      const { email } = getAdminCredentials()
      return { id: 'admin', email: email || 'admin', name: 'Admin', role: 'admin' }
    }

    const user = findUserById(data.sub)
    return user ? toPublicUser(user) : null
  } catch {
    return null
  }
}

export function getBearerUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null
  return verifyToken(authHeader.slice(7))
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export async function signUp({ email, password, name }) {
  if (!name?.trim()) throw new Error('Name is required')
  if (!validateEmail(email)) throw new Error('Enter a valid email address')
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }
  if (findUserByEmail(email)) throw new Error('An account with this email already exists')

  const passwordHash = await hashPassword(password)
  const user = createUser({
    id: crypto.randomUUID(),
    email,
    name,
    passwordHash,
  })

  const publicUser = toPublicUser(user)
  trackEvent('signup', { userId: user.id, email: user.email, meta: { name: user.name } })
  updateUserStats(user.id, { email: user.email, name: user.name, courseCount: 0, guideCount: 0, courses: [] })

  return { user: publicUser, token: signToken(user.id) }
}

export async function signIn({ email, password }) {
  if (!validateEmail(email)) throw new Error('Enter a valid email address')
  if (!password) throw new Error('Password is required')

  const user = findUserByEmail(email)
  if (!user) throw new Error('Invalid email or password')

  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw new Error('Invalid email or password')

  trackEvent('signin', { userId: user.id, email: user.email })
  updateUserStats(user.id, { email: user.email, name: user.name })

  return { user: toPublicUser(user), token: signToken(user.id) }
}

export async function adminSignIn({ email, password }) {
  const { email: adminEmail, password: adminPassword } = getAdminCredentials()
  if (!adminEmail || !adminPassword) {
    throw new Error('Admin login is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env')
  }
  if (email?.trim().toLowerCase() !== adminEmail || password !== adminPassword) {
    throw new Error('Invalid admin email or password')
  }

  trackEvent('admin_signin', { email: adminEmail })

  return {
    user: { id: 'admin', email: adminEmail, name: 'Admin', role: 'admin' },
    token: signToken('admin', 'admin'),
  }
}

const TOKEN_KEY = 'studyhub-token'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function authFetch(path, options = {}) {
  const token = getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export async function signUp({ email, password, name }) {
  return authFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
}

export async function signIn({ email, password }) {
  return authFetch('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchMe() {
  const token = getStoredToken()
  if (!token) return null
  try {
    const data = await authFetch('/api/auth/me')
    return data.user
  } catch {
    setStoredToken(null)
    return null
  }
}

export function authHeaders() {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function adminSignIn({ email, password }) {
  return authFetch('/api/admin/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function fetchAdminAnalytics() {
  return authFetch('/api/admin/analytics')
}

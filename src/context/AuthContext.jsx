import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  fetchMe,
  signIn as apiSignIn,
  signUp as apiSignUp,
  adminSignIn as apiAdminSignIn,
  setStoredToken,
  getStoredToken,
} from '../services/auth'
import { setCoursesUserId } from '../utils/coursesStorage'
import { syncUsage } from '../services/analytics'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const me = await fetchMe()
    setUser(me)
    return me
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      setCoursesUserId(null)
      return
    }
    setCoursesUserId(user?.id ?? null)
    if (user?.id) syncUsage(user.name).catch(() => {})
  }, [user])

  useEffect(() => {
    let cancelled = false
    async function init() {
      if (!getStoredToken()) {
        if (!cancelled) {
          setUser(null)
          setLoading(false)
        }
        return
      }
      const me = await fetchMe()
      if (!cancelled) {
        setUser(me)
        setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { user: u, token } = await apiSignIn({ email, password })
    setStoredToken(token)
    setUser(u)
    return u
  }, [])

  const signUp = useCallback(async (email, password, name) => {
    const { user: u, token } = await apiSignUp({ email, password, name })
    setStoredToken(token)
    setUser(u)
    return u
  }, [])

  const adminSignIn = useCallback(async (email, password) => {
    const { user: u, token } = await apiAdminSignIn({ email, password })
    setStoredToken(token)
    setUser(u)
    return u
  }, [])

  const signOut = useCallback(() => {
    setStoredToken(null)
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        adminSignIn,
        signOut,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

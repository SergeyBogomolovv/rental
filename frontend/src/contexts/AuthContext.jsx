import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('rental_token'))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      return
    }

    api
      .get('/auth/me/')
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem('rental_token')
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const authenticate = async (path, payload) => {
    const response = await api.post(path, payload)
    localStorage.setItem('rental_token', response.data.token)
    setToken(response.data.token)
    setUser(response.data.user)
    return response.data.user
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      login: (payload) => authenticate('/auth/token/', payload),
      register: (payload) => authenticate('/auth/register/', payload),
      logout: () => {
        localStorage.removeItem('rental_token')
        setToken(null)
        setUser(null)
      },
      refreshMe: async () => {
        const response = await api.get('/auth/me/')
        setUser(response.data)
        return response.data
      },
    }),
    [token, user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

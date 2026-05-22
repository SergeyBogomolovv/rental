import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => localStorage.getItem('rental_token'))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      return
    }

    let isCurrent = true
    api
      .get('/auth/me/')
      .then((response) => {
        if (isCurrent) {
          setUser(response.data)
        }
      })
      .catch(() => {
        if (!isCurrent) {
          return
        }
        localStorage.removeItem('rental_token')
        queryClient.removeQueries()
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [token, queryClient])

  const authenticate = useCallback(async (path, payload) => {
    const response = await api.post(path, payload)
    queryClient.removeQueries()
    localStorage.setItem('rental_token', response.data.token)
    setToken(response.data.token)
    setUser(response.data.user)
    setIsLoading(false)
    return response.data.user
  }, [queryClient])

  const logout = useCallback(() => {
    localStorage.removeItem('rental_token')
    queryClient.removeQueries()
    setToken(null)
    setUser(null)
    setIsLoading(false)
  }, [queryClient])

  const refreshMe = useCallback(async () => {
    const response = await api.get('/auth/me/')
    setUser(response.data)
    return response.data
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin' && user?.account_status === 'active',
      login: (payload) => authenticate('/auth/token/', payload),
      register: (payload) => authenticate('/auth/register/', payload),
      logout,
      refreshMe,
    }),
    [token, user, isLoading, authenticate, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

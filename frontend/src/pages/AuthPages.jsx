import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../contexts/useAuth'

function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '', password_confirm: '', name: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      isRegister
        ? auth.register(form)
        : auth.login({
            email: form.email,
            password: form.password,
          }),
    onSuccess: () => navigate(location.state?.from?.pathname || '/', { replace: true }),
    onError: (requestError) => setError(getErrorMessage(requestError)),
  })

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  return (
    <section className="auth-page">
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          setError('')
          mutation.mutate()
        }}
      >
        <h1>{isRegister ? 'Регистрация' : 'Вход'}</h1>
        {isRegister && (
          <label>
            Имя
            <input name="name" value={form.name} onChange={update} />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={update} required />
        </label>
        <label>
          Пароль
          <input name="password" type="password" value={form.password} onChange={update} required minLength={6} />
        </label>
        {isRegister && (
          <label>
            Подтверждение пароля
            <input
              name="password_confirm"
              type="password"
              value={form.password_confirm}
              onChange={update}
              required
              minLength={6}
            />
          </label>
        )}
        {error && <p className="error-text">{error}</p>}
        <button className="button primary" type="submit" disabled={mutation.isPending}>
          {isRegister ? 'Создать аккаунт' : 'Войти'}
        </button>
        <p className="muted">
          {isRegister ? (
            <>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </>
          ) : (
            <>
              Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </>
          )}
        </p>
      </form>
    </section>
  )
}

export function LoginPage() {
  return <AuthForm mode="login" />
}

export function RegisterPage() {
  return <AuthForm mode="register" />
}

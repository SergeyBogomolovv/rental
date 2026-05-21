import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rental_token')

  if (token) {
    config.headers.Authorization = `Token ${token}`
  }

  return config
})

export function getErrorMessage(error) {
  const data = error.response?.data

  if (!data) {
    return 'Сервер недоступен'
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.detail) {
    return Array.isArray(data.detail) ? data.detail.map((item) => String(item)).join(' ') : String(data.detail)
  }

  const messages = collectErrorMessages(data)

  if (messages.length) {
    return messages.join(' ')
  }

  return 'Проверьте данные формы'
}

const fieldLabels = {
  email: 'Email',
  password: 'Пароль',
  password_confirm: 'Подтверждение пароля',
  name: 'Имя',
  title: 'Название',
  address: 'Адрес',
  price_per_month: 'Цена',
  area: 'Площадь',
  property: 'Объект',
  message: 'Сообщение',
  desired_move_in_date: 'Дата заезда',
  photo_url: 'URL фото',
  latitude: 'Широта',
  longitude: 'Долгота',
}

function collectErrorMessages(data) {
  if (Array.isArray(data)) {
    return data.map((item) => String(item))
  }

  if (!data || typeof data !== 'object') {
    return []
  }

  return Object.entries(data).flatMap(([field, value]) => {
    const label = fieldLabels[field]
    const rawMessages = Array.isArray(value) ? value : [value]

    return rawMessages.flatMap((message) => {
      if (message && typeof message === 'object') {
        return collectErrorMessages(message)
      }

      const text = String(message)
      return label && field !== 'non_field_errors' ? `${label}: ${text}` : text
    })
  })
}

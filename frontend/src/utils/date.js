export function formatDate(value) {
  if (!value) {
    return 'Дата не указана'
  }

  const [year, month, day] = String(value).split('-').map(Number)
  if (year && month && day) {
    return new Intl.DateTimeFormat('ru-RU').format(new Date(year, month - 1, day))
  }

  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

export function formatDateTime(value) {
  if (!value) {
    return 'Дата не указана'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

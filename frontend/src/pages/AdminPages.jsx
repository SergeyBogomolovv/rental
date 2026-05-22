import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  CalendarDays,
  DoorOpen,
  Mail,
  MapPin,
  MessageSquare,
  Ruler,
  UserRound,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client'
import { useAuth } from '../contexts/useAuth'
import { formatDate, formatDateTime } from '../utils/date'
import {
  accountStatusLabels,
  activeRequestStatuses,
  propertyTypeLabels,
  propertyStatusLabels,
  requestStatusLabels,
  roleLabels,
} from '../utils/labels'

const emptyProperty = {
  title: '',
  description: '',
  property_type: 'apartment',
  city: 'Москва',
  district: '',
  address: '',
  price_per_month: 50000,
  rooms: 1,
  area: 30,
  floor: 1,
  total_floors: 9,
  has_furniture: true,
  has_parking: false,
  pets_allowed: false,
  latitude: '',
  longitude: '',
  photo_url: '',
  status: 'available',
}

function AdminShell({ children }) {
  return (
    <section className="page-grid admin-shell">
      <div className="page-heading admin-heading">
        <div>
          <h1>Админ-панель</h1>
          <p>Объекты, заявки и пользователи в одном рабочем контуре.</p>
        </div>
      </div>
      <nav className="admin-tabs" aria-label="Разделы админки">
        <NavLink to="/admin" end>
          Обзор
        </NavLink>
        <NavLink to="/admin/properties">Объекты</NavLink>
        <NavLink to="/admin/requests">Заявки</NavLink>
        <NavLink to="/admin/users">Пользователи</NavLink>
      </nav>
      {children}
    </section>
  )
}

export function AdminOverviewPage() {
  const { data: properties = [] } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: async () => (await api.get('/admin/properties/')).data,
  })
  const { data: requests = [] } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => (await api.get('/admin/requests/')).data,
  })
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users/')).data,
  })

  const metrics = useMemo(
    () => [
      ['Всего объектов', properties.length],
      ['Свободно', properties.filter((item) => item.status === 'available').length],
      ['Заявки в работе', requests.filter((item) => activeRequestStatuses.includes(item.status)).length],
      ['Пользователи', users.length],
    ],
    [properties, requests, users],
  )

  return (
    <AdminShell>
      <div className="admin-metrics">
        {metrics.map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}

export function AdminPropertiesPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyProperty)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: async () => (await api.get('/admin/properties/')).data,
  })
  const { data: requests = [] } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => (await api.get('/admin/requests/')).data,
  })

  const approvedRequestByProperty = useMemo(() => {
    return new Map(
      requests
        .filter((request) => request.status === 'approved')
        .map((request) => [request.property, request]),
    )
  }, [requests])

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId
        ? api.patch(`/admin/properties/${editingId}/`, normalizeProperty(form))
        : api.post('/admin/properties/', normalizeProperty(form)),
    onSuccess: () => {
      setForm(emptyProperty)
      setEditingId(null)
      setError('')
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  })

  const patchMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/admin/properties/${id}/`, payload),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/properties/${id}/`),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  })

  const update = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const startEdit = (property) => {
    setEditingId(property.id)
    setForm(propertyToForm(property))
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyProperty)
    setError('')
  }

  return (
    <AdminShell>
      <form
        className="admin-create-panel"
        onSubmit={(event) => {
          event.preventDefault()
          saveMutation.mutate()
        }}
      >
        <div className="admin-form-header">
          <div>
            <h2>{editingId ? 'Редактирование объекта' : 'Новый объект'}</h2>
            <p>
              {editingId
                ? 'Обновите параметры объекта и сохраните изменения.'
                : 'Заполните карточку сразу с координатами, чтобы объект появился на карте.'}
            </p>
          </div>
          <div className="admin-form-actions">
            {editingId && (
              <button className="button ghost" type="button" onClick={cancelEdit}>
                Отменить
              </button>
            )}
            <button className="button primary" type="submit" disabled={saveMutation.isPending}>
              {editingId ? 'Сохранить объект' : 'Создать объект'}
            </button>
          </div>
        </div>

        <div className="admin-form-grid">
          <section className="admin-form-section span-2">
            <h3>Основное</h3>
            <div className="admin-fields two-columns">
              <label>
                Название
                <input name="title" value={form.title} onChange={update} required />
              </label>
              <label>
                Тип
                <select name="property_type" value={form.property_type} onChange={update}>
                  <option value="apartment">Квартира</option>
                  <option value="house">Дом</option>
                  <option value="room">Комната</option>
                  <option value="studio">Студия</option>
                </select>
              </label>
              <label>
                Город
                <input name="city" value={form.city} onChange={update} required />
              </label>
              <label>
                Район
                <input name="district" value={form.district} onChange={update} />
              </label>
              <label className="span-2">
                Адрес
                <input name="address" value={form.address} onChange={update} required />
              </label>
            </div>
          </section>

          <section className="admin-form-section">
            <h3>Параметры</h3>
            <div className="admin-fields two-columns">
              <label>
                Цена, ₽/мес.
                <input name="price_per_month" type="number" min="0" value={form.price_per_month} onChange={update} />
              </label>
              <label>
                Площадь, м²
                <input name="area" type="number" min="1" step="0.01" value={form.area} onChange={update} />
              </label>
              <label>
                Комнаты
                <input name="rooms" type="number" min="1" value={form.rooms} onChange={update} />
              </label>
              <label>
                Статус
                <select name="status" value={form.status} onChange={update}>
                  <option value="available">Свободно</option>
                  <option value="hidden">Скрыто</option>
                  {form.status === 'booked' && <option value="booked">Забронировано</option>}
                </select>
              </label>
              <label>
                Этаж
                <input name="floor" type="number" min="1" value={form.floor} onChange={update} />
              </label>
              <label>
                Этажей в доме
                <input name="total_floors" type="number" min="1" value={form.total_floors} onChange={update} />
              </label>
            </div>
          </section>

          <section className="admin-form-section">
            <h3>Карта и фото</h3>
            <div className="admin-fields">
              <label>
                Широта
                <input name="latitude" type="number" step="any" value={form.latitude} onChange={update} />
              </label>
              <label>
                Долгота
                <input name="longitude" type="number" step="any" value={form.longitude} onChange={update} />
              </label>
              <label>
                URL фото
                <input name="photo_url" value={form.photo_url} onChange={update} placeholder="https://..." />
              </label>
            </div>
          </section>

          <section className="admin-form-section span-2">
            <h3>Описание и удобства</h3>
            <div className="admin-fields">
              <label>
                Описание
                <textarea name="description" value={form.description} onChange={update} rows="4" />
              </label>
              <div className="admin-switches">
                <label className="check">
                  <input name="has_furniture" type="checkbox" checked={form.has_furniture} onChange={update} />
                  Мебель
                </label>
                <label className="check">
                  <input name="has_parking" type="checkbox" checked={form.has_parking} onChange={update} />
                  Парковка
                </label>
                <label className="check">
                  <input name="pets_allowed" type="checkbox" checked={form.pets_allowed} onChange={update} />
                  Можно с животными
                </label>
              </div>
            </div>
          </section>
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>

      {isLoading && <div className="state">Загрузка объектов...</div>}
      <div className="admin-section-title">
        <h2>Объекты</h2>
        <span>{properties.length}</span>
      </div>
      <div className="admin-property-grid">
        {properties.map((property) => {
          const isBooked = property.status === 'booked'
          const canOpenProperty = property.status !== 'hidden'
          const approvedRequest = approvedRequestByProperty.get(property.id)

          return (
            <article className="admin-property-card" key={property.id}>
              {canOpenProperty ? (
                <Link className="admin-property-image" to={`/properties/${property.id}`} aria-label="Открыть объект">
                  <img src={property.image || '/favicon.svg'} alt="" />
                </Link>
              ) : (
                <div className="admin-property-image disabled">
                  <img src={property.image || '/favicon.svg'} alt="" />
                </div>
              )}
              <div className="admin-property-content">
                <div className="admin-card-kicker">
                  <span className={`badge ${property.status}`}>{propertyStatusLabels[property.status] || property.status}</span>
                  <span>{propertyTypeLabels[property.property_type] || property.property_type}</span>
                </div>
                <div>
                  <h3>{canOpenProperty ? <Link to={`/properties/${property.id}`}>{property.title}</Link> : property.title}</h3>
                  <p className="admin-list-meta">
                    <MapPin size={16} />
                    {property.city}, {property.address}
                  </p>
                </div>
                <div className="admin-property-facts">
                  <span>
                    <DoorOpen size={15} />
                    {property.rooms} комн.
                  </span>
                  <span>
                    <Ruler size={15} />
                    {property.area} м²
                  </span>
                  <span>
                    <Building2 size={15} />
                    {property.floor}/{property.total_floors} этаж
                  </span>
                </div>
              </div>
              <div className="admin-card-actions">
                <strong>{formatMoney(property.price_per_month)} ₽/мес.</strong>
                <button className="button ghost" type="button" onClick={() => startEdit(property)}>
                  Редактировать
                </button>
                {isBooked ? (
                  <span className="property-lock-note">
                    Объект забронирован
                    {approvedRequest?.user_email && (
                      <small>Одобрена заявка: {approvedRequest.user_email}</small>
                    )}
                  </span>
                ) : (
                  <>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() =>
                        patchMutation.mutate({
                          id: property.id,
                          payload: { status: property.status === 'hidden' ? 'available' : 'hidden' },
                        })
                      }
                      disabled={patchMutation.isPending}
                    >
                      {property.status === 'hidden' ? 'Показать' : 'Скрыть'}
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => {
                        if (confirmPropertyDelete(property)) {
                          deleteMutation.mutate(property.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Удалить
                    </button>
                  </>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </AdminShell>
  )
}

export function AdminRequestsPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-requests'],
    queryFn: async () => (await api.get('/admin/requests/')).data,
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => api.post(`/admin/requests/${id}/${action}/`),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['admin-requests'] })
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] })
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  })

  return (
    <AdminShell>
      {isLoading && <div className="state">Загрузка заявок...</div>}
      {error && <p className="error-text">{error}</p>}
      <div className="admin-section-title">
        <h2>Заявки</h2>
        <span>{requests.length}</span>
      </div>
      <div className="admin-request-table">
        <div className="admin-request-head">
          <span>Статус</span>
          <span>Объект и клиент</span>
          <span>Заявка</span>
          <span>Действия</span>
        </div>
        {requests.map((request) => {
          const canChangeStatus = activeRequestStatuses.includes(request.status)
          const message = request.message?.trim() || 'Сообщение не указано'

          return (
            <article className={`admin-request-row ${canChangeStatus ? '' : 'terminal'}`} key={request.id}>
              <div className="admin-request-cell status-cell">
                <span className={`badge ${request.status}`}>{requestStatusLabels[request.status]}</span>
              </div>
              <div className="admin-request-cell request-object-cell">
                <h3>{request.property_detail?.title}</h3>
                <span>
                  <Mail size={16} />
                  {request.user_email}
                </span>
              </div>
              <div className="admin-request-cell request-info-cell">
                <span>
                  <CalendarDays size={16} />
                  Создана: {formatDateTime(request.created_at)}
                </span>
                <span>
                  <CalendarDays size={16} />
                  Заезд: {formatDate(request.desired_move_in_date)}
                </span>
                <span>
                  <MessageSquare size={16} />
                  {message}
                </span>
              </div>
              <div className="admin-request-cell admin-request-actions">
                {canChangeStatus ? (
                  <>
                    {request.status === 'new' && (
                      <button
                        className="button ghost"
                        type="button"
                        onClick={() => actionMutation.mutate({ id: request.id, action: 'review' })}
                        disabled={actionMutation.isPending}
                      >
                        В работу
                      </button>
                    )}
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => actionMutation.mutate({ id: request.id, action: 'approve' })}
                      disabled={actionMutation.isPending}
                    >
                      Одобрить
                    </button>
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => actionMutation.mutate({ id: request.id, action: 'reject' })}
                      disabled={actionMutation.isPending}
                    >
                      Отклонить
                    </button>
                  </>
                ) : (
                  <span className={`admin-terminal-note ${request.status}`}>{getTerminalRequestText(request.status)}</span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </AdminShell>
  )
}

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [error, setError] = useState('')
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/users/')).data,
  })

  const patchMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/admin/users/${id}/`, payload),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  })

  return (
    <AdminShell>
      {isLoading && <div className="state">Загрузка пользователей...</div>}
      {error && <p className="error-text">{error}</p>}
      <div className="admin-section-title">
        <h2>Пользователи</h2>
        <span>{users.length}</span>
      </div>
      <div className="admin-user-list">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUser?.id

          return (
            <article className="admin-user-card" key={user.id}>
              <div className="admin-user-avatar">
                <UserRound size={22} />
              </div>
              <div className="admin-user-main">
                <div className="admin-card-kicker">
                  <span className={`badge ${user.account_status}`}>
                    {accountStatusLabels[user.account_status] || user.account_status}
                  </span>
                  <span>{roleLabels[user.role] || user.role}</span>
                </div>
                <h3>{user.email}</h3>
                {isCurrentUser && <p className="muted">Текущий администратор</p>}
                <p className="muted">Заявок: {user.request_count ?? 0}</p>
                <p className="muted">Зарегистрирован: {formatDateTime(user.date_joined)}</p>
              </div>
              <div className="admin-user-actions">
                <button
                  className="button ghost"
                  type="button"
                  onClick={() =>
                    patchMutation.mutate({
                      id: user.id,
                      payload: { role: user.role === 'admin' ? 'user' : 'admin' },
                    })
                  }
                  disabled={isCurrentUser || patchMutation.isPending}
                >
                  {user.role === 'admin' ? 'Сделать пользователем' : 'Сделать администратором'}
                </button>
                <button
                  className="button danger"
                  type="button"
                  onClick={() =>
                    patchMutation.mutate({
                      id: user.id,
                      payload: { account_status: user.account_status === 'blocked' ? 'active' : 'blocked' },
                    })
                  }
                  disabled={isCurrentUser || patchMutation.isPending}
                >
                  {user.account_status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </AdminShell>
  )
}

function normalizeProperty(form) {
  return {
    ...form,
    price_per_month: Number(form.price_per_month),
    rooms: Number(form.rooms),
    area: String(form.area),
    floor: Number(form.floor),
    total_floors: Number(form.total_floors),
    latitude: form.latitude || null,
    longitude: form.longitude || null,
  }
}

function propertyToForm(property) {
  return {
    title: property.title || '',
    description: property.description || '',
    property_type: property.property_type || 'apartment',
    city: property.city || '',
    district: property.district || '',
    address: property.address || '',
    price_per_month: property.price_per_month || '',
    rooms: property.rooms || 1,
    area: property.area || '',
    floor: property.floor || 1,
    total_floors: property.total_floors || 1,
    has_furniture: Boolean(property.has_furniture),
    has_parking: Boolean(property.has_parking),
    pets_allowed: Boolean(property.pets_allowed),
    latitude: property.latitude || '',
    longitude: property.longitude || '',
    photo_url: property.photo_url || '',
    status: property.status || 'available',
  }
}

function formatMoney(value) {
  return Number(value).toLocaleString('ru-RU')
}

function getTerminalRequestText(status) {
  const labels = {
    approved: 'Заявка одобрена',
    rejected: 'Заявка отклонена',
    cancelled: 'Пользователь отменил заявку',
  }

  return labels[status] || 'Заявка закрыта'
}

function confirmPropertyDelete(property) {
  return window.confirm(`Удалить объект "${property.title}"? Это действие нельзя отменить.`)
}

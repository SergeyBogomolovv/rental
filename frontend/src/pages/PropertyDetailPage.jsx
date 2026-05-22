import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client'
import { PropertyMap } from '../components/PropertyMap'
import { useAuth } from '../contexts/useAuth'
import { activeRequestStatuses, propertyStatusLabels, propertyTypeLabels } from '../utils/labels'

export function PropertyDetailPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [desiredDate, setDesiredDate] = useState('')
  const [notice, setNotice] = useState('')

  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const response = await api.get(`/properties/${id}/`)
      return response.data
    },
  })

  const { data: requests = [] } = useQuery({
    queryKey: ['my-requests'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await api.get('/requests/')
      return response.data.results || response.data
    },
  })

  const requestMutation = useMutation({
    mutationFn: async () =>
      api.post('/requests/', {
        property: Number(id),
        message: message.trim(),
        desired_move_in_date: desiredDate,
      }),
    onSuccess: () => {
      setMessage('')
      setDesiredDate('')
      setNotice('Заявка создана')
      queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
    onError: (error) => setNotice(getErrorMessage(error)),
  })

  if (isLoading) {
    return <div className="state">Загрузка объекта...</div>
  }

  if (isError || !property) {
    return <div className="state error">Объект не найден</div>
  }

  const canRequest = property.status === 'available'
  const hasActiveRequest = requests.some(
    (request) => request.property === Number(id) && activeRequestStatuses.includes(request.status),
  )
  const requestBlocked = !canRequest || hasActiveRequest
  const requestDisabled = requestBlocked || requestMutation.isPending

  return (
    <section className="detail">
      <img className="detail-image" src={property.image || '/favicon.svg'} alt="" />
      <div className="detail-content">
        <div className="detail-header">
          <div>
            <span className={`badge ${property.status}`}>{propertyStatusLabels[property.status] || property.status}</span>
            <h1>{property.title}</h1>
            <p className="muted">
              <MapPin size={16} />
              {property.city}, {property.district}, {property.address}
            </p>
          </div>
          <strong className="price">{Number(property.price_per_month).toLocaleString('ru-RU')} ₽/мес.</strong>
        </div>

        <div className="facts large">
          <span>{propertyTypeLabels[property.property_type]}</span>
          <span>{property.rooms} комн.</span>
          <span>{property.area} м²</span>
          <span>
            {property.floor}/{property.total_floors} этаж
          </span>
        </div>

        <p className="description">{property.description}</p>

        <div className="flags">
          <span>{property.has_furniture ? 'Есть мебель' : 'Без мебели'}</span>
          <span>{property.has_parking ? 'Есть парковка' : 'Без парковки'}</span>
          <span>{property.pets_allowed ? 'Можно с питомцами' : 'Без питомцев'}</span>
        </div>

        {property.latitude && property.longitude && (
          <div className="detail-map">
            <PropertyMap properties={[property]} />
          </div>
        )}

        <div className="request-panel">
          <h2>Заявка на аренду</h2>
          {!isAuthenticated ? (
            <p>
              Для отправки заявки нужно <Link to="/login">войти</Link>.
            </p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (requestBlocked) {
                  return
                }
                requestMutation.mutate()
              }}
            >
              <label>
                Дата заезда
                <input
                  type="date"
                  value={desiredDate}
                  onChange={(event) => setDesiredDate(event.target.value)}
                  disabled={requestDisabled}
                  required
                />
              </label>
              <label>
                Сообщение владельцу
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows="4"
                  disabled={requestDisabled}
                  required
                />
              </label>
              <button className="button primary" type="submit" disabled={requestDisabled}>
                <CalendarDays size={17} />
                Отправить заявку
              </button>
              {!canRequest && <p className="muted">На занятый объект нельзя создать новую заявку.</p>}
              {hasActiveRequest && <p className="muted">У вас уже есть активная заявка на этот объект.</p>}
              {notice && <p className={notice === 'Заявка создана' ? 'success' : 'error-text'}>{notice}</p>}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

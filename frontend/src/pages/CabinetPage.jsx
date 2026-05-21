import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CalendarDays, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client'
import { activeRequestStatuses, requestStatusLabels } from '../utils/labels'

export function CabinetPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await api.get('/requests/')
      return response.data.results || response.data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => api.post(`/requests/${id}/cancel/`),
    onSuccess: () => {
      setError('')
      queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
    onError: (requestError) => setError(getErrorMessage(requestError)),
  })

  return (
    <section className="page-grid">
      <div className="page-heading">
        <div>
          <h1>Личный кабинет</h1>
          <p>История заявок и возможность отменить активную заявку.</p>
        </div>
      </div>

      {isLoading && <div className="state">Загрузка заявок...</div>}
      {error && <p className="error-text">{error}</p>}
      {!isLoading && !requests.length && <div className="state">Пока нет заявок</div>}

      <div className="table-list">
        {requests.map((request) => (
          <article className="request-card" key={request.id}>
            <Link className="request-card-image" to={`/properties/${request.property}`} aria-label="Открыть объект">
              <img src={request.property_detail?.image || '/favicon.svg'} alt="" />
            </Link>
            <div className="request-card-body">
              <div className="request-card-title">
                <span className={`badge ${request.status}`}>{requestStatusLabels[request.status]}</span>
                <h3>
                  <Link to={`/properties/${request.property}`}>{request.property_detail?.title}</Link>
                </h3>
              </div>
              <p className="request-message">
                <MessageSquare size={16} />
                {request.message || 'Сообщение не указано'}
              </p>
            </div>
            <div className="request-card-meta">
              <span className="request-date">
                <CalendarDays size={16} />
                {formatDate(request.desired_move_in_date)}
              </span>
              {activeRequestStatuses.includes(request.status) && (
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => cancelMutation.mutate(request.id)}
                  disabled={cancelMutation.isPending}
                >
                  Отменить
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function formatDate(value) {
  if (!value) {
    return 'Дата не указана'
  }

  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

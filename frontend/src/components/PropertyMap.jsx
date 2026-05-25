import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MOSCOW_CENTER = [55.751244, 37.618423]
const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY
const YANDEX_MAPS_URL = 'https://api-maps.yandex.ru/2.1/'

let yandexMapsPromise

export function PropertyMap({ properties }) {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const placemarksRef = useRef([])
  const [initialPoints] = useState(() => getValidMapPoints(properties))
  const [loadState, setLoadState] = useState(YANDEX_MAPS_API_KEY ? 'loading' : 'missing-key')
  const [loadError, setLoadError] = useState('')

  const points = useMemo(() => getValidMapPoints(properties), [properties])

  useEffect(() => {
    if (!YANDEX_MAPS_API_KEY) {
      return undefined
    }

    let cancelled = false

    loadYandexMaps(YANDEX_MAPS_API_KEY)
      .then((ymaps) => {
        if (cancelled || !containerRef.current || mapRef.current) {
          return
        }

        mapRef.current = new ymaps.Map(containerRef.current, {
          center: getMapCenter(initialPoints),
          zoom: initialPoints.length === 1 ? 13 : 10,
          controls: ['zoomControl'],
        })
        setLoadState('ready')
      })
      .catch((error) => {
        console.error('Yandex Maps load failed:', error)
        if (!cancelled) {
          setLoadError(getReadableMapError(error))
          setLoadState('error')
        }
      })

    return () => {
      cancelled = true
      clearPlacemarks()
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
    }
  }, [initialPoints])

  useEffect(() => {
    if (loadState !== 'ready' || !mapRef.current || !window.ymaps) {
      return
    }

    clearPlacemarks()

    points.forEach((property) => {
      const placemark = new window.ymaps.Placemark(
        [Number(property.latitude), Number(property.longitude)],
        {
          balloonContent: getBalloonContent(property),
          hintContent: escapeHtml(property.title),
        },
        {
          preset: 'islands#darkGreenHomeIcon',
        },
      )

      mapRef.current.geoObjects.add(placemark)
      placemarksRef.current.push(placemark)
    })

    if (!points.length) {
      mapRef.current.setCenter(MOSCOW_CENTER, 10)
      return
    }

    if (points.length === 1) {
      mapRef.current.setCenter([Number(points[0].latitude), Number(points[0].longitude)], 13)
      return
    }

    mapRef.current.setBounds(mapRef.current.geoObjects.getBounds(), {
      checkZoomRange: true,
      zoomMargin: 28,
    })
  }, [loadState, points])

  useEffect(() => {
    const handleMapLinkClick = (event) => {
      const link = event.target.closest('[data-map-property-link]')
      if (!link) {
        return
      }

      event.preventDefault()
      navigate(`/properties/${link.dataset.propertyId}`)
    }

    document.addEventListener('click', handleMapLinkClick)
    return () => document.removeEventListener('click', handleMapLinkClick)
  }, [navigate])

  return (
    <div className="map yandex-map">
      <div ref={containerRef} className="yandex-map-surface" />
      {loadState === 'loading' && <div className="map-state">Загрузка карты...</div>}
      {loadState === 'missing-key' && (
        <div className="map-state error">Укажите VITE_YANDEX_MAPS_API_KEY для подключения Яндекс Карт</div>
      )}
      {loadState === 'error' && (
        <div className="map-state error">
          Не удалось загрузить Яндекс Карты
          {loadError && <span>{loadError}</span>}
          <span>Проверьте, что в кабинете Яндекса разрешен host: {window.location.hostname}</span>
        </div>
      )}
    </div>
  )

  function clearPlacemarks() {
    placemarksRef.current.forEach((placemark) => {
      mapRef.current?.geoObjects.remove(placemark)
    })
    placemarksRef.current = []
  }
}

function loadYandexMaps(apiKey) {
  if (window.ymaps) {
    return waitForYandexReady(window.ymaps)
  }

  if (!yandexMapsPromise) {
    yandexMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-rental-map-yandex]')
      if (existingScript) {
        existingScript.addEventListener('load', () => waitForYandexReady(window.ymaps).then(resolve, reject), {
          once: true,
        })
        existingScript.addEventListener('error', () => reject(new Error('Скрипт Яндекс Карт не загрузился')), {
          once: true,
        })
        return
      }

      const script = document.createElement('script')
      script.src = `${YANDEX_MAPS_URL}?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`
      script.async = true
      script.dataset.rentalMapYandex = 'true'
      script.onerror = () => {
        reject(
          new Error(
            `Скрипт Яндекс Карт не загрузился. Разрешите ${window.location.hostname} в настройках HTTP Referer ключа или откройте ${YANDEX_MAPS_URL} вручную.`,
          ),
        )
      }
      script.onload = () => waitForYandexReady(window.ymaps).then(resolve, reject)
      document.head.appendChild(script)
    })
  }

  return yandexMapsPromise
}

function waitForYandexReady(ymaps) {
  if (!ymaps?.ready) {
    return Promise.reject(new Error('window.ymaps не появился после загрузки скрипта'))
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error('Истекло время ожидания ymaps.ready')), 10000)

    ymaps.ready(() => {
      window.clearTimeout(timeoutId)
      resolve(ymaps)
    })
  })
}

function getMapCenter(points) {
  if (!points.length) {
    return MOSCOW_CENTER
  }

  return [Number(points[0].latitude), Number(points[0].longitude)]
}

function getValidMapPoints(properties) {
  return properties.filter((property) => {
    if (property.latitude === null || property.latitude === undefined || property.latitude === '') {
      return false
    }

    if (property.longitude === null || property.longitude === undefined || property.longitude === '') {
      return false
    }

    const latitude = Number(property.latitude)
    const longitude = Number(property.longitude)
    return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  })
}

function getBalloonContent(property) {
  const price = Number(property.price_per_month).toLocaleString('ru-RU')

  return `
    <div class="map-balloon">
      <strong>${escapeHtml(property.title)}</strong>
      <span>${price} ₽/мес.</span>
      <span>${escapeHtml(property.address || '')}</span>
      <a href="/properties/${property.id}" data-map-property-link data-property-id="${property.id}">Подробнее</a>
    </div>
  `
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getReadableMapError(error) {
  if (!error) {
    return ''
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return String(error)
}

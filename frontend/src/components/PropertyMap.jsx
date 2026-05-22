import 'leaflet/dist/leaflet.css'

import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'

const propertyIcon = L.divIcon({
  className: 'property-marker',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

export function PropertyMap({ properties }) {
  const points = useMemo(
    () => properties.filter((property) => property.latitude && property.longitude),
    [properties],
  )
  const center = useMemo(
    () => (points.length ? [Number(points[0].latitude), Number(points[0].longitude)] : [55.751244, 37.618423]),
    [points],
  )

  return (
    <MapContainer center={center} zoom={10} className="map" scrollWheelZoom={false}>
      <MapViewport points={points} center={center} />
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((property) => (
        <Marker key={property.id} icon={propertyIcon} position={[Number(property.latitude), Number(property.longitude)]}>
          <Popup>
            <strong>{property.title}</strong>
            <br />
            {Number(property.price_per_month).toLocaleString('ru-RU')} ₽/мес.
            <br />
            {property.address}
            <br />
            <Link to={`/properties/${property.id}`}>Подробнее</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

function MapViewport({ points, center }) {
  const map = useMap()
  const pointsKey = useMemo(
    () => points.map((property) => `${property.id}:${property.latitude}:${property.longitude}`).join('|'),
    [points],
  )

  useEffect(() => {
    if (!points.length) {
      map.setView(center, 10)
      return
    }

    if (points.length === 1) {
      map.setView(center, 13)
      return
    }

    const bounds = L.latLngBounds(
      points.map((property) => [Number(property.latitude), Number(property.longitude)]),
    )
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 })
  }, [center, map, points, pointsKey])

  return null
}

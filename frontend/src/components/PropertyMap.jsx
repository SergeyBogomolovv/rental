import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'

const propertyIcon = L.divIcon({
  className: 'property-marker',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

export function PropertyMap({ properties }) {
  const points = properties.filter((property) => property.latitude && property.longitude)
  const center = points.length
    ? [Number(points[0].latitude), Number(points[0].longitude)]
    : [55.751244, 37.618423]

  return (
    <MapContainer center={center} zoom={10} className="map" scrollWheelZoom={false}>
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

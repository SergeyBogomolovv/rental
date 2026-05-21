import { MapPin, ParkingCircle, PawPrint, Sofa } from 'lucide-react'
import { Link } from 'react-router-dom'
import { propertyStatusLabels, propertyTypeLabels } from '../utils/labels'

export function PropertyCard({ property }) {
  return (
    <article className="property-card">
      <img src={property.image || '/favicon.svg'} alt="" />
      <div className="property-card-body">
        <div>
          <span className={`badge ${property.status}`}>{propertyStatusLabels[property.status] || property.status}</span>
          <h3>{property.title}</h3>
          <p className="muted">
            <MapPin size={16} />
            {property.city}, {property.district || property.address}
          </p>
        </div>

        <div className="facts">
          <span>{propertyTypeLabels[property.property_type]}</span>
          <span>{property.rooms} комн.</span>
          <span>{property.area} м²</span>
        </div>

        <div className="feature-row">
          {property.has_furniture && <Sofa size={17} title="Есть мебель" />}
          {property.has_parking && <ParkingCircle size={17} title="Есть парковка" />}
          {property.pets_allowed && <PawPrint size={17} title="Можно с питомцами" />}
        </div>

        <div className="card-bottom">
          <strong>{Number(property.price_per_month).toLocaleString('ru-RU')} ₽/мес.</strong>
          <Link className="button primary" to={`/properties/${property.id}`}>
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  )
}

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '../api/client'
import { PropertyCard } from '../components/PropertyCard'
import { PropertyMap } from '../components/PropertyMap'

const defaultFilters = {
  city: '',
  property_type: '',
  min_price: '',
  max_price: '',
  rooms: '',
  has_furniture: '',
  has_parking: '',
  pets_allowed: '',
}

export function CatalogPage() {
  const [filters, setFilters] = useState(defaultFilters)

  const params = useMemo(() => {
    return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
  }, [filters])

  const {
    data: properties = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['properties', params],
    queryFn: async () => {
      const response = await api.get('/properties/', { params })
      return response.data.results || response.data
    },
  })

  const updateFilter = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  return (
    <section className='page-grid'>
      <div className='page-heading'>
        <div>
          <h1>Каталог аренды</h1>
          <p>Подберите подходящий объект по району, цене, типу жилья и условиям аренды.</p>
        </div>
        <button className='button ghost' type='button' onClick={() => setFilters(defaultFilters)}>
          Сбросить
        </button>
      </div>

      <form className='filters'>
        <label>
          Город
          <input name='city' value={filters.city} onChange={updateFilter} placeholder='Москва' />
        </label>
        <label>
          Тип
          <select name='property_type' value={filters.property_type} onChange={updateFilter}>
            <option value=''>Любой</option>
            <option value='apartment'>Квартира</option>
            <option value='house'>Дом</option>
            <option value='room'>Комната</option>
            <option value='studio'>Студия</option>
          </select>
        </label>
        <label>
          Мин. цена
          <input name='min_price' type='number' value={filters.min_price} onChange={updateFilter} />
        </label>
        <label>
          Макс. цена
          <input name='max_price' type='number' value={filters.max_price} onChange={updateFilter} />
        </label>
        <label>
          Комнат
          <input name='rooms' type='number' value={filters.rooms} onChange={updateFilter} />
        </label>
        <label>
          Мебель
          <select name='has_furniture' value={filters.has_furniture} onChange={updateFilter}>
            <option value=''>Не важно</option>
            <option value='true'>Да</option>
            <option value='false'>Нет</option>
          </select>
        </label>
      </form>

      <div className='content-split'>
        <div className='list-column'>
          {isLoading && <div className='state'>Загрузка объектов...</div>}
          {isError && <div className='state error'>Не удалось загрузить каталог</div>}
          {!isLoading && !properties.length && (
            <div className='state'>
              <Search size={22} />
              По выбранным фильтрам ничего не найдено
            </div>
          )}
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        <aside className='map-column'>
          <PropertyMap properties={properties} />
        </aside>
      </div>
    </section>
  )
}

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import { api } from '../api/client'
import { PropertyCard } from '../components/PropertyCard'
import { PropertyMap } from '../components/PropertyMap'

const defaultFilters = {
  city: '',
  district: '',
  property_type: '',
  min_price: '',
  max_price: '',
  min_area: '',
  rooms: '',
  has_furniture: '',
  has_parking: '',
  pets_allowed: '',
  status: '',
}

export function CatalogPage() {
  const [filters, setFilters] = useState(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const params = useMemo(() => {
    return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))
  }, [filters])

  const activeFiltersCount = Object.values(filters).filter((value) => value !== '').length

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

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  return (
    <section className='page-grid'>
      <div className='page-heading'>
        <div>
          <h1>Каталог аренды</h1>
          <p>Подберите подходящий объект по району, цене, типу жилья и условиям аренды.</p>
        </div>
        <button className='button ghost reset-filters' type='button' onClick={resetFilters}>
          Сбросить
        </button>
      </div>

      <div className='filter-summary'>
        <button
          className='button ghost filter-toggle'
          type='button'
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
          aria-controls='catalog-filters'
        >
          <SlidersHorizontal size={17} />
          Фильтры{activeFiltersCount ? `: ${activeFiltersCount}` : ''}
          <ChevronDown className={filtersOpen ? 'rotated' : ''} size={18} />
        </button>
        {activeFiltersCount > 0 && (
          <button className='button ghost compact' type='button' onClick={resetFilters}>
            Сбросить
          </button>
        )}
      </div>

      <form className={`filters ${filtersOpen ? 'open' : ''}`} id='catalog-filters'>
        <label>
          Город
          <input name='city' value={filters.city} onChange={updateFilter} placeholder='Москва' />
        </label>
        <label>
          Район
          <input name='district' value={filters.district} onChange={updateFilter} placeholder='Сокольники' />
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
          Мин. площадь
          <input name='min_area' type='number' value={filters.min_area} onChange={updateFilter} />
        </label>
        <label>
          Мебель
          <select name='has_furniture' value={filters.has_furniture} onChange={updateFilter}>
            <option value=''>Не важно</option>
            <option value='true'>Да</option>
            <option value='false'>Нет</option>
          </select>
        </label>
        <label>
          Парковка
          <select name='has_parking' value={filters.has_parking} onChange={updateFilter}>
            <option value=''>Не важно</option>
            <option value='true'>Да</option>
            <option value='false'>Нет</option>
          </select>
        </label>
        <label>
          Животные
          <select name='pets_allowed' value={filters.pets_allowed} onChange={updateFilter}>
            <option value=''>Не важно</option>
            <option value='true'>Можно</option>
            <option value='false'>Нельзя</option>
          </select>
        </label>
        <label>
          Статус
          <select name='status' value={filters.status} onChange={updateFilter}>
            <option value=''>Любой</option>
            <option value='available'>Свободно</option>
            <option value='booked'>Забронировано</option>
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
              По вашему запросу ничего не найдено
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

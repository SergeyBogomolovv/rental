import { Building2, LogOut, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

export function AppLayout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  return (
    <div className='app'>
      <header className='topbar'>
        <NavLink className='brand' to='/'>
          <Building2 size={24} />
          Rental Map
        </NavLink>

        <nav className='nav'>
          <NavLink to='/'>Каталог</NavLink>
          {isAuthenticated && <NavLink to='/cabinet'>Кабинет</NavLink>}
          {isAdmin && <NavLink to='/admin'>Админка</NavLink>}
        </nav>

        <div className='account'>
          {isAuthenticated ? (
            <>
              <span className='account-name'>
                <UserRound size={16} />
                {user?.name || user?.email}
              </span>
              <button className='icon-button' type='button' onClick={logout} title='Выйти'>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <NavLink className='button ghost' to='/login'>
                Войти
              </NavLink>
              <NavLink className='button primary' to='/register'>
                Регистрация
              </NavLink>
            </>
          )}
        </div>
      </header>

      <main className='main'>
        <Outlet />
      </main>
    </div>
  )
}

import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/Button"
import { LogOut, LayoutDashboard, CalendarDays, User, Menu, X } from "lucide-react"
import { useState } from "react"
import "./Header.css"

function Header() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="header" role="banner">
      <div className="header__container">
        <div className="container header__inner">
          <Link to="/" className="header__brand" aria-label="F5 Turnos - Inicio">
            <div className="header__logo" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="32" height="32">
                <rect width="32" height="32" rx="8" fill="url(#headerGradient)"/>
                <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
                      font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="14" fill="white">
                  F5
                </text>
                <defs>
                  <linearGradient id="headerGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#22c55e"/>
                    <stop offset="100%" stopColor="#3b82f6"/>
                  </linearGradient>
                </defs>
              </svg>
          </div>
          <div className="header__brand-text">
            <span className="header__name">F5 TURNOS</span>
            <span className="header__tagline">Fútbol 5 · Pádel</span>
          </div>
        </Link>

        <nav className="header__nav" role="navigation" aria-label="Navegación principal">
          <Link to="/" className="header__link">Canchas</Link>
          {user && <Link to="/mis-reservas" className="header__link">Mis reservas</Link>}
          {isAdmin() && <Link to="/admin" className="header__link header__link--admin">Panel de administración</Link>}
        </nav>

        <div className="header__actions">
          {user ? (
            <span className="header__actions-inner">
              <span className="header__user">
                <span className="header__avatar" aria-hidden="true">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="header__username">{user.name}</span>
              </span>
              {isAdmin() && (
                <Button variant="ghost" size="sm" onClick={() => { navigate("/admin"); closeMobileMenu(); }}>
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span>Administración</span>
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => { navigate("/mis-reservas"); closeMobileMenu(); }}>
                <CalendarDays size={16} aria-hidden="true" />
                <span>Mis reservas</span>
              </Button>
              <button 
                className="header__logout" 
                onClick={handleLogout} 
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={18} aria-hidden="true" />
              </button>
            </span>
          ) : (
            <span>
              <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); closeMobileMenu(); }}>
                Iniciar sesión
              </Button>
              <Button variant="primary" size="sm" onClick={() => { navigate("/login"); closeMobileMenu(); }}>
                <span>Reservar</span>
              </Button>
            </span>
          )}
        </div>

        <button 
          className="header__mobile-toggle" 
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      <div className="header__mobile-wrapper">
        <div 
          className="header__mobile-overlay" 
          onClick={closeMobileMenu}
          aria-hidden="true"
          style={{ display: mobileMenuOpen ? 'block' : 'none' }}
        />
        <aside 
          id="mobile-menu" 
          className={`header__mobile-panel ${mobileMenuOpen ? 'is-open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          style={{ display: mobileMenuOpen ? 'block' : 'none' }}
        >
          <div className="header__mobile-header">
            <span className="header__mobile-title">Menú</span>
            <button 
              className="header__mobile-close" 
              onClick={closeMobileMenu}
              aria-label="Cerrar menú"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <nav className="header__mobile-nav" role="navigation">
            <Link to="/" className="header__mobile-link" onClick={closeMobileMenu}>Canchas</Link>
            {user && <Link to="/mis-reservas" className="header__mobile-link" onClick={closeMobileMenu}>Mis reservas</Link>}
            {isAdmin() && <Link to="/admin" className="header__mobile-link header__mobile-link--admin" onClick={closeMobileMenu}>Panel de administración</Link>}
          </nav>
          {user ? (
            <div className="header__mobile-user">
              <div className="header__mobile-user-info">
                <span className="header__avatar">{user.name.charAt(0).toUpperCase()}</span>
                <div>
                  <span className="header__mobile-username">{user.name}</span>
                  <span className="header__mobile-role">{isAdmin() ? "Administrador" : "Usuario"}</span>
                </div>
              </div>
              <div className="header__mobile-actions">
                {isAdmin() && (
                  <Button variant="ghost" className="header__mobile-btn" onClick={() => { navigate("/admin"); closeMobileMenu(); }} block>
                    <LayoutDashboard size={18} aria-hidden="true" />
                    Administración
                  </Button>
                )}
              <Button variant="secondary" className="header__mobile-btn" onClick={() => { navigate("/mis-reservas"); closeMobileMenu(); }} block>
                <CalendarDays size={18} aria-hidden="true" />
                Mis reservas
              </Button>
              <Button variant="ghost" className="header__mobile-btn header__mobile-btn--danger" onClick={handleLogout} block>
                <LogOut size={18} aria-hidden="true" />
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <div className="header__mobile-auth">
              <Button variant="ghost" className="header__mobile-btn" onClick={() => { navigate("/login"); closeMobileMenu(); }} block>
                Iniciar sesión
              </Button>
              <Button variant="primary" className="header__mobile-btn" onClick={() => { navigate("/login"); closeMobileMenu(); }} block>
                Reservar
              </Button>
            </div>
          )}
        </aside>
      </header>
    )
  }
}

export default Header
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { useTheme } from "../../hooks/useTheme"
import { Button } from "../ui/Button"
import { LogOut, LayoutDashboard, CalendarDays, Menu, X, ChevronDown, Sun, Moon } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import "./Header.css"

function Header() {
  const { user, logout, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [userMenuOpen])

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const closeMenus = () => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }

  const openMobileMenu = () => setMobileMenuOpen(true)
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen)

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
              <div className="header__user-menu" ref={userMenuRef}>
                <button 
                  className="header__user-trigger"
                  onClick={toggleUserMenu}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menú de usuario"
                >
                  <span className="header__avatar" aria-hidden="true">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="header__username">{user.name}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {userMenuOpen && (
                  <div className="header__user-dropdown">
                    <div className="header__user-info">
                      <span className="header__avatar-large">{user.name.charAt(0).toUpperCase()}</span>
                      <div>
                        <span className="header__mobile-username">{user.name}</span>
                        <span className="header__mobile-role">{isAdmin() ? "Administrador" : "Usuario"}</span>
                      </div>
                    </div>
                    <div className="header__dropdown-divider" />
                    <Link to="/mis-reservas" className="header__dropdown-item" onClick={closeMenus}>
                      <CalendarDays size={18} aria-hidden="true" />
                      <span>Mis reservas</span>
                    </Link>
                    {isAdmin() && (
                      <Link to="/admin" className="header__dropdown-item" onClick={closeMenus}>
                        <LayoutDashboard size={18} aria-hidden="true" />
                        <span>Administración</span>
                      </Link>
                    )}
                    <button 
                      className="header__dropdown-item header__dropdown-item--danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} aria-hidden="true" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="header__auth-buttons">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  Iniciar sesión
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate("/login")}>
                  <span>Reservar</span>
                </Button>
              </div>
            )}

            <button
              className="header__theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>
          </div>

          <button 
            className="header__mobile-toggle" 
            onClick={openMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Abrir menú"
          >
            <Menu size={24} aria-hidden="true" />
          </button>
        </div>

        <div className={`header__mobile-wrapper${mobileMenuOpen ? ' is-open' : ''}`}>
          <div className="header__mobile-overlay" onClick={closeMenus} />
          <aside 
            id="mobile-menu" 
            className="header__mobile-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="header__mobile-header">
              <span className="header__mobile-title">Menú</span>
              <button 
                className="header__mobile-close" 
                onClick={closeMenus}
                aria-label="Cerrar menú"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>
            <nav className="header__mobile-nav" role="navigation">
              <Link to="/" className="header__mobile-link" onClick={closeMenus}>Canchas</Link>
              {user && <Link to="/mis-reservas" className="header__mobile-link" onClick={closeMenus}>Mis reservas</Link>}
              {isAdmin() && <Link to="/admin" className="header__mobile-link header__mobile-link--admin" onClick={closeMenus}>Panel de administración</Link>}
            </nav>

            {user ? (
              <div className="header__mobile-user">
                <div className="header__mobile-user-info">
                  <span className="header__avatar" aria-hidden="true">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <span className="header__mobile-username">{user.name}</span>
                    <span className="header__mobile-role">{isAdmin() ? "Administrador" : "Usuario"}</span>
                  </div>
                </div>
                <div className="header__mobile-actions">
                  <Button variant="secondary" className="header__mobile-btn" block onClick={() => { closeMenus(); navigate("/mis-reservas") }}>
                    <CalendarDays size={18} aria-hidden="true" />
                    Mis reservas
                  </Button>
                  {isAdmin() && (
                    <Button variant="secondary" className="header__mobile-btn" block onClick={() => { closeMenus(); navigate("/admin") }}>
                      <LayoutDashboard size={18} aria-hidden="true" />
                      Administración
                    </Button>
                  )}
                  <Button variant="ghost" className="header__mobile-btn header__mobile-btn--danger" block onClick={handleLogout}>
                    <LogOut size={18} aria-hidden="true" />
                    Cerrar sesión
                  </Button>
                </div>
              </div>
            ) : (
              <div className="header__mobile-auth">
                <Button variant="primary" block onClick={() => { closeMenus(); navigate("/login") }}>
                  Iniciar sesión
                </Button>
                <Button variant="secondary" block onClick={() => { closeMenus(); navigate("/login") }}>
                  Reservar
                </Button>
              </div>
            )}

            <button className="header__mobile-theme" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </button>
          </aside>
        </div>
      </div>
    </header>
  )
}

export default Header

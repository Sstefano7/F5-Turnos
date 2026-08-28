import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "../ui/Button"
import { LogOut, LayoutDashboard, CalendarDays, User } from "lucide-react"
import "./Header.css"

export function Header() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="header__brand">
          <div className="header__logo">F5</div>
          <div className="header__brand-text">
            <span className="header__name">F5 TURNOS</span>
            <span className="header__tagline">Fútbol 5 · Pádel</span>
          </div>
        </Link>

        <nav className="header__nav">
          <Link to="/" className="header__link">Canchas</Link>
          {user && <Link to="/mis-reservas" className="header__link">Mis reservas</Link>}
          {isAdmin() && <Link to="/admin" className="header__link header__link--admin">Panel admin</Link>}
        </nav>

        <div className="header__actions">
          {user ? (
            <>
              <span className="header__user">
                <span className="header__avatar"><User size={16} /></span>
                {user.name}
              </span>
              {isAdmin() && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                  <LayoutDashboard size={16} /> Admin
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => navigate("/mis-reservas")}>
                <CalendarDays size={16} /> Reservas
              </Button>
              <button className="header__logout" onClick={handleLogout} aria-label="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Iniciar sesión</Button>
              <Button variant="primary" size="sm" onClick={() => navigate("/login")}>Reservar</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

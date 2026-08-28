import { useNavigate } from "react-router-dom"
import { Button } from "../ui/Button"
import { ArrowRight, MapPin, Clock3, ShieldCheck } from "lucide-react"
import "./Hero.css"

export function Hero({ onExplore }) {
  const navigate = useNavigate()
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__copy">
          <div className="hero__eyebrow">
            <span className="hero__dot" />
            Reservas en tiempo real · Fútbol 5 y Pádel
          </div>
          <h1 className="hero__title">
            Reservá tu<br />
            <span className="hero__title-accent">cancha en segundos</span>
          </h1>
          <p className="hero__desc">
            Elegí fecha, horario y cancha. Confirmación por el administrador y pago 100% en el local. Sin seña, sin complicaciones.
          </p>
          <div className="hero__ctas">
            <Button variant="primary" size="lg" onClick={() => (onExplore ? onExplore() : document.getElementById("canchas")?.scrollIntoView({ behavior: "smooth" }))}>
              Explorar canchas <ArrowRight size={18} />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/mis-reservas")}>
              Mis reservas
            </Button>
          </div>
          <div className="hero__trust">
            <span><MapPin size={14} /> 4 canchas</span>
            <span><Clock3 size={14} /> 08:00–23:00</span>
            <span><ShieldCheck size={14} /> Confirmación admin</span>
          </div>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero__diagonal">
            <div className="hero__pane hero__pane--football">
              <div className="hero__pane-label">
                <span className="hero__pane-icon">⚽</span>
                <div><strong>FÚTBOL 5</strong><span>Césped sintético · Arco blanco</span></div>
              </div>
            </div>
            <div className="hero__pane hero__pane--padel">
              <div className="hero__pane-label hero__pane-label--right">
                <div><strong>PÁDEL</strong><span>Superficie azul · Vidrio panorámico</span></div>
                <span className="hero__pane-icon">🎾</span>
              </div>
            </div>
            <div className="hero__diagonal-line" />
          </div>
          <div className="hero__stats">
            <div className="hero__stat"><strong>420</strong><span>horarios/sem</span></div>
            <div className="hero__stat"><strong>15</strong><span>slots/día</span></div>
            <div className="hero__stat"><strong>24h</strong><span>confirmación</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
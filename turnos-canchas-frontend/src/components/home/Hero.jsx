import { useNavigate } from "react-router-dom"
import { Button } from "../ui/Button"
import { MapPin, Clock3, ShieldCheck, Goal, Volleyball } from "lucide-react"
import "./Hero.css"

export function Hero({ onExplore }) {
  const navigate = useNavigate()
  return (
    <section className="hero">
      {/* Visual section — split diagonal */}
      <div className="hero__visual" aria-hidden="true">
        <div className="hero__diagonal">
          <div className="hero__pane hero__pane--football">
            <div className="hero__pane-label">
              <span className="hero__pane-icon">
                <Goal size={16} />
              </span>
              <div>
                <strong>Fútbol 5</strong>
                <span>Césped sintético</span>
              </div>
            </div>
          </div>
          <div className="hero__pane hero__pane--padel">
            <div className="hero__pane-label hero__pane-label--right">
              <div>
                <strong>Pádel</strong>
                <span>Vidrio panorámico</span>
              </div>
              <span className="hero__pane-icon">
                <Volleyball size={16} />
              </span>
            </div>
          </div>
          <div className="hero__diagonal-line" />
        </div>

        <div className="hero__stats">
          <div className="hero__stat"><strong>420</strong><span>horarios por semana</span></div>
          <div className="hero__stat"><strong>15</strong><span>slots por día</span></div>
          <div className="hero__stat"><strong>24h</strong><span>confirmación</span></div>
        </div>
      </div>

      {/* Copy */}
      <div className="container hero__content">
        <div className="hero__copy">
          {/* Live indicator — reemplaza el eyebrow genérico */}
          <div className="hero__live">
            <span className="hero__live-dot" />
            Reservas en tiempo real
          </div>

          <h1 className="hero__title">
            Reservá tu<br />cancha en segundos
          </h1>

          <p className="hero__desc">
            Elegí fecha, horario y cancha. Confirmación directa y pago en el local. Sin seña, sin complicaciones.
          </p>

          <div className="hero__ctas">
            <Button
              variant="primary"
              size="lg"
              onClick={() => (onExplore ? onExplore() : document.getElementById("canchas")?.scrollIntoView({ behavior: "smooth" }))}
            >
              Explorar canchas
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/mis-reservas")}>
              Mis reservas
            </Button>
          </div>

          <div className="hero__trust">
            <span><MapPin size={13} /> 4 canchas disponibles</span>
            <span><Clock3 size={13} /> 08:00 a 23:00</span>
            <span><ShieldCheck size={13} /> Confirmación por admin</span>
          </div>
        </div>
      </div>
    </section>
  )
}

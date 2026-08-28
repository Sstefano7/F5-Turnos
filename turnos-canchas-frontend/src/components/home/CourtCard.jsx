import { Badge } from "../ui/Badge"
import { Button } from "../ui/Button"
import { Clock3, MapPin, Waves, Sun, Users, Zap } from "lucide-react"
import "./CourtCard.css"

const amenitiesByType = {
  futbol5: [
    { icon: Waves, label: "Césped sintético" },
    { icon: Zap, label: "Iluminación LED" },
    { icon: Users, label: "Vestuarios" },
  ],
  padel: [
    { icon: Sun, label: "Panorámica / Techada" },
    { icon: Zap, label: "Iluminación LED" },
    { icon: MapPin, label: "Vidrio templado" },
  ],
}

const thumbByType = {
  futbol5: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80&auto=format&fit=crop",
  padel: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80&auto=format&fit=crop",
}

const fmtARS = (v) => new Intl.NumberFormat("es-AR").format(Number(v))

export function CourtCard({ court, onReserve }) {
  const isFutbol = court.tipo === "futbol5"
  const amenities = amenitiesByType[court.tipo] || amenitiesByType.padel
  const thumb = court.imagen || thumbByType[court.tipo]
  const price = fmtARS(court.precio_hora)

  return (
    <article className="court-card">
      <div className="court-card__media">
        <img src={thumb} alt={court.nombre} loading="lazy" />
        <div className="court-card__media-top">
          <Badge tone={isFutbol ? "green" : "blue"}>{isFutbol ? "Fútbol 5" : "Pádel"}</Badge>
          {!court.activa && <Badge tone="gray">Inactiva</Badge>}
        </div>
        <div className="court-card__media-gradient" />
      </div>

      <div className="court-card__body">
        <h3 className="court-card__title">{court.nombre}</h3>
        <p className="court-card__desc">{court.descripcion || (isFutbol ? "Cancha profesional 5 vs 5" : "Cancha profesional con superficie azul")}</p>

        <div className="court-card__amenities">
          {amenities.map(({ icon: Icon, label }) => (
            <span key={label} className="court-card__amenity">
              <Icon size={14} /> {label}
            </span>
          ))}
        </div>
      </div>

      <div className="court-card__footer">
        <div className="court-card__price">
          <span className="court-card__price-value">${price}</span>
          <span className="court-card__price-suffix">/hora</span>
        </div>
        <Button
          variant={isFutbol ? "primary" : "blue"}
          size="md"
          onClick={() => onReserve?.(court)}
          disabled={!court.activa}
        >
          Reservar
        </Button>
      </div>
    </article>
  )
}

export function CourtCardSkeleton() {
  return <div className="court-card court-card--skeleton"><div className="skeleton shimmer" /></div>
}
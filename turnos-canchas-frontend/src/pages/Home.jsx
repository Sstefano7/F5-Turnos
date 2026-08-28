import { useState, useEffect } from "react"
import { canchaService } from "../services/canchaService"
import { Header } from "../components/layout/Header"
import { Hero } from "../components/home/Hero"
import { CourtCard } from "../components/home/CourtCard"
import { WeeklyCalendar } from "../components/home/WeeklyCalendar"
import { BookingModal } from "../components/home/BookingModal"
import "./Home.css"

export default function Home() {
  const [canchas, setCanchas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState({ open: false, court: null, date: null, hour: null })

  useEffect(() => {
    canchaService.getAll()
      .then(data => setCanchas(data.data || data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleReserve = (court) => {
    setBooking({ open: true, court, date: null, hour: null })
  }

  const handleSlotSelect = (date, hour) => {
    setBooking({ open: true, court: null, date, hour })
  }

  // Mock data for the 3 featured courts as per design spec
  const featuredCourts = [
    {
      id: "featured-1",
      nombre: "Cancha A - Fútbol 5",
      tipo: "futbol5",
      descripcion: "Cancha de fútbol 5 con césped sintético de última generación y arco blanco profesional.",
      precio_hora: 8000,
      activa: true,
      imagen: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80&auto=format&fit=crop"
    },
    {
      id: "featured-2",
      nombre: "Cancha B - Pádel",
      tipo: "padel",
      descripcion: "Cancha de pádel panorámica con superficie azul y paredes de vidrio templado.",
      precio_hora: 8000,
      activa: true,
      imagen: "https://images.unsplash.com/photo-1611105979754-02a9e8b5e1b0?w=800&q=80&auto=format&fit=crop"
    },
    {
      id: "featured-3",
      nombre: "Cancha C - Pádel",
      tipo: "padel",
      descripcion: "Cancha de pádel profesional con superficie azul y paredes de vidrio.",
      precio_hora: 6500,
      activa: true,
      imagen: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80&auto=format&fit=crop"
    }
  ]

  return (
    <div className="home">
      <Header />
      <Hero onExplore={() => document.getElementById("canchas")?.scrollIntoView({ behavior: "smooth" })} />

      <main className="home__main">
        <section id="canchas" className="home__section">
          <div className="container">
            <div className="home__section-head">
              <h2 className="home__section-title">Canchas disponibles</h2>
              <p className="home__section-desc">Elegí tu cancha favorita y reservá en segundos. Todas con iluminación LED y vestuarios.</p>
            </div>

            {loading ? (
              <div className="home__grid">
                {[1, 2, 3].map(i => (
                  <div key={i} className="court-card court-card--skeleton"><div className="skeleton shimmer" style={{ height: "340px" }} /></div>
                ))}
              </div>
            ) : error ? (
              <div className="home__error">Error: {error}</div>
            ) : (
              <>
                <div className="home__grid">
                  {featuredCourts.map(court => (
                    <CourtCard key={court.id} court={court} onReserve={handleReserve} />
                  ))}
                </div>
                {canchas.length > 3 && (
                  <div className="home__grid home__grid--secondary">
                    {canchas.slice(3).map(court => (
                      <CourtCard key={court.id} court={court} onReserve={handleReserve} />
                    ))}
                  </div>
                )}
                {canchas.length === 0 && (
                  <p className="home__empty">No hay canchas disponibles en este momento.</p>
                )}
              </>
            )}
          </div>
        </section>

        <section className="home__section home__section--calendar">
          <div className="container">
            <div className="home__section-head">
              <h2 className="home__section-title">Disponibilidad semanal</h2>
              <p className="home__section-desc">Tocá un horario verde para reservar al instante. Ves en cada slot cuántas canchas quedan libres.</p>
            </div>
            <WeeklyCalendar canchas={canchas} onSelectSlot={handleSlotSelect} />
          </div>
        </section>
      </main>

      <BookingModal
        open={booking.open}
        onClose={() => setBooking({ open: false, court: null, date: null, hour: null })}
        initialCourt={booking.court}
        initialDate={booking.date}
        initialHour={booking.hour}
        canchas={canchas}
      />
    </div>
  )
}
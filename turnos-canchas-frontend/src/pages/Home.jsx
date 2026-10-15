import { useState, useEffect } from "react"
import { canchaService } from "../services/canchaService"
import Header from "../components/layout/Header"
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

  const displayCourts = error ? [] : canchas

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
            ) : (
              <>
                {error && (
                  <div className="home__error" style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                    <div>
                      <strong>No se pudo conectar con el servidor.</strong>
                      <br />
                       <span style={{ fontSize: 'var(--text-sm)', opacity: 0.85 }}>La disponibilidad no puede verificarse en este momento. Intentá de nuevo más tarde.</span>
                    </div>
                  </div>
                )}
                <div className="home__grid">
                  {displayCourts.map(court => (
                    <CourtCard key={court.id} court={court} onReserve={handleReserve} />
                  ))}
                </div>
                {!error && displayCourts.length === 0 && (
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
            <WeeklyCalendar canchas={displayCourts} onSelectSlot={handleSlotSelect} />
          </div>
        </section>
      </main>

      <BookingModal
        open={booking.open}
        onClose={() => setBooking({ open: false, court: null, date: null, hour: null })}
        initialCourt={booking.court}
        initialDate={booking.date}
        initialHour={booking.hour}
        canchas={displayCourts}
      />
    </div>
  )
}

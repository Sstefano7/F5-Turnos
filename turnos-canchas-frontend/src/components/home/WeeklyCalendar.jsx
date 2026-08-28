import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { canchaService } from "../../services/canchaService"
import "./WeeklyCalendar.css"

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = 8 + i
  return `${String(h).padStart(2, "0")}:00`
})
const DAYS_ES = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"]
const DAYS_FULL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 dom
  const diff = day === 0 ? -6 : 1 - day // lunes como inicio
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}
function toISO(date) { return date.toISOString().slice(0, 10) }
function isSameDay(a, b) { return toISO(a) === toISO(b) }

export function WeeklyCalendar({ canchas = [], onSelectSlot }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [counts, setCounts] = useState({}) // { "2026-08-28": { "08:00": 2, ... } }
  const [loading, setLoading] = useState(false)

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  useEffect(() => {
    if (!canchas.length) return
    let cancelled = false
    setLoading(true)
    const fetchWeek = async () => {
      const result = {}
      for (const day of days) {
        const iso = toISO(day)
        const perHour = {}
        // Para cada cancha, traer horarios disponibles de ese día y contar por hora
        await Promise.all(
          canchas.map(async (cancha) => {
            try {
              const horarios = await canchaService.getHorariosDisponibles(cancha.id, iso)
              for (const h of horarios) {
                const key = h.hora_inicio.slice(0, 5)
                perHour[key] = (perHour[key] || 0) + 1
              }
            } catch {}
          })
        )
        result[iso] = perHour
      }
      if (!cancelled) {
        setCounts(result)
        setLoading(false)
      }
    }
    fetchWeek()
    return () => { cancelled = true }
  }, [days, canchas])

  const today = new Date()
  const weekLabel = `${days[0].toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} — ${days[6].toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}`

  return (
    <section className="weekly-calendar">
      <div className="weekly-calendar__header">
        <div className="weekly-calendar__title">
          <Calendar size={18} />
          <h3>Disponibilidad semanal</h3>
          <span className="weekly-calendar__subtitle">{weekLabel}</span>
        </div>
        <div className="weekly-calendar__nav">
          <button className="weekly-calendar__nav-btn" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button className="weekly-calendar__today" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoy</button>
          <button className="weekly-calendar__nav-btn" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="weekly-calendar__scroll">
        <div className="weekly-calendar__grid">
          {days.map((day, idx) => {
            const iso = toISO(day)
            const isToday = isSameDay(day, today)
            const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
            return (
              <div key={iso} className={`weekly-calendar__col ${isToday ? "is-today" : ""} ${isPast ? "is-past" : ""}`}>
                <div className="weekly-calendar__col-head">
                  <span className="weekly-calendar__dow">{DAYS_ES[idx]}</span>
                  <span className="weekly-calendar__date">{day.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
                  <span className="weekly-calendar__day-num">{day.getDate()}</span>
                </div>
                <div className="weekly-calendar__slots">
                  {HOURS.map((hour) => {
                    const count = counts[iso]?.[hour] ?? 0
                    const has = count > 0 && !isPast
                    return (
                      <button
                        key={hour}
                        className={`slot-btn ${has ? "slot-btn--available" : "slot-btn--empty"}`}
                        disabled={!has}
                        onClick={() => has && onSelectSlot?.(iso, hour)}
                        title={has ? `${count} cancha(s) disponible(s) a las ${hour}` : "Sin disponibilidad"}
                      >
                        <span className="slot-btn__hour">{hour}</span>
                        <span className="slot-btn__count">{loading ? "·" : has ? count : "—"}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="weekly-calendar__legend">
        <span className="legend-dot legend-dot--green" /> Disponible
        <span className="legend-dot legend-dot--gray" /> Sin disponibilidad
        <span className="weekly-calendar__hint">· Clic en un horario verde para reservar</span>
      </p>
    </section>
  )
}

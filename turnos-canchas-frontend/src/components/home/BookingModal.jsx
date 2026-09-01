import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Modal } from "../ui/Modal"
import { Button } from "../ui/Button"
import { useAuth } from "../../context/AuthContext"
import { canchaService } from "../../services/canchaService"
import { turnoService } from "../../services/turnoService"
import { clienteService } from "../../services/clienteService"
import "./BookingModal.css"

const fmtARS = (v) => new Intl.NumberFormat("es-AR").format(Number(v || 0))

export function BookingModal({ open, onClose, initialCourt = null, initialDate = null, initialHour = null, canchas = [] }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [selectedCourt, setSelectedCourt] = useState(initialCourt)
  const [selectedDate, setSelectedDate] = useState(initialDate || "")
  const [horarios, setHorarios] = useState([])
  const [selectedHorario, setSelectedHorario] = useState(null)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [availableCanchasForSlot, setAvailableCanchasForSlot] = useState([])

  const [clienteData, setClienteData] = useState({
    nombre: "", apellido: "", email: user?.email || "", telefono: "", dni: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Reset when open changes
  useEffect(() => {
    if (open) {
      setSelectedCourt(initialCourt)
      setSelectedDate(initialDate || "")
      setSelectedHorario(initialHour ? { hora_inicio: initialHour, hora_fin: addHour(initialHour) } : null)
      setStep(1)
      setError("")
      setSuccess(false)
      setAvailableCanchasForSlot([])
      // Si viene de calendario con fecha+hora, buscar canchas disponibles para ese slot
      if (initialDate && initialHour && !initialCourt) {
        findCanchasForSlot(initialDate, initialHour)
      }
    }
  }, [open, initialCourt, initialDate, initialHour])

  // Fetch horarios whenever court + date are both set
  useEffect(() => {
    if (selectedCourt?.id && selectedDate) {
      fetchHorarios(selectedCourt.id, selectedDate)
    } else {
      setHorarios([])
      setSelectedHorario(null)
    }
  }, [selectedCourt?.id, selectedDate])


  const findCanchasForSlot = async (date, hour) => {
    const available = []
    for (const cancha of canchas) {
      try {
        const horarios = await canchaService.getHorariosDisponibles(cancha.id, date)
        if (horarios.some(h => h.hora_inicio.slice(0, 5) === hour)) available.push(cancha)
      } catch {}
    }
    setAvailableCanchasForSlot(available)
    if (available.length === 1) setSelectedCourt(available[0])
  }

  const fetchHorarios = async (canchaId, fecha) => {
    setLoadingHorarios(true)
    setSelectedHorario(null)
    try {
      const data = await canchaService.getHorariosDisponibles(canchaId, fecha)
      setHorarios(data)
      // Si initialHour viene, preseleccionar
      if (initialHour) {
        const match = data.find(h => h.hora_inicio.slice(0, 5) === initialHour)
        if (match) setSelectedHorario(match)
      }
    } catch { setHorarios([]) } finally { setLoadingHorarios(false) }
  }

  const handleSubmit = async () => {
    setError("")
    if (!clienteData.nombre.trim() || !clienteData.apellido.trim() || !clienteData.email.trim() || !clienteData.telefono.trim()) {
      setError("Completá todos los campos obligatorios")
      return
    }
    if (!selectedCourt || !selectedDate || !selectedHorario) {
      setError("Faltan datos de la reserva")
      return
    }
    if (!user) {
      navigate("/login")
      return
    }
    setSubmitting(true)
    try {
      let clienteId
      const res = await clienteService.getAll()
      const lista = Array.isArray(res) ? res : res.data
      const existente = lista?.find(c => c.email === clienteData.email)
      if (existente) clienteId = existente.id
      else {
        const cliente = await clienteService.create(clienteData)
        clienteId = cliente.id
      }
      await turnoService.create({
        cancha_id: selectedCourt.id,
        cliente_id: clienteId,
        fecha: selectedDate,
        hora_inicio: selectedHorario.hora_inicio,
        hora_fin: selectedHorario.hora_fin,
        observaciones: "",
      })
      setSuccess(true)
      setStep(4)
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la reserva")
    } finally { setSubmitting(false) }
  }

  const canGoNext = () => {
    if (step === 1) return !!(selectedCourt && selectedDate && selectedHorario)
    if (step === 2) return !!(clienteData.nombre && clienteData.apellido && clienteData.email && clienteData.telefono)
    return true
  }

  const minDate = new Date().toISOString().slice(0, 10)

  return (
    <Modal open={open} onClose={onClose} title={success ? "¡Reserva confirmada!" : "Reservar cancha"}>
      {!success ? (
        <>
          <div className="booking-steps">
            <span className={`booking-step ${step >= 1 ? "is-active" : ""}`}>1. Cancha y horario</span>
            <span className="booking-step__sep">→</span>
            <span className={`booking-step ${step >= 2 ? "is-active" : ""}`}>2. Tus datos</span>
            <span className="booking-step__sep">→</span>
            <span className={`booking-step ${step >= 3 ? "is-active" : ""}`}>3. Confirmar</span>
          </div>

          {error && <div className="booking-error">{error}</div>}

          {step === 1 && (
            <div className="booking-step-content">
              {/* Si vino de calendario y hay múltiples canchas, elegir */}
              {!selectedCourt && availableCanchasForSlot.length > 0 ? (
                <>
                  <h4 className="booking-label">Elegí la cancha para {initialDate} a las {initialHour}</h4>
                  <div className="booking-canchas-list">
                    {availableCanchasForSlot.map(c => (
                      <button key={c.id} className="booking-cancha-option" onClick={() => setSelectedCourt(c)}>
                        <strong>{c.nombre}</strong> <span>{c.tipo === "futbol5" ? "Fútbol 5" : "Pádel"} · ${fmtARS(c.precio_hora)}/hora</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label className="booking-label">Cancha</label>
                  <div className="booking-canchas-grid">
                    {canchas.map(c => (
                      <button
                        key={c.id}
                        className={`booking-cancha-card ${selectedCourt?.id === c.id ? "is-selected" : ""}`}
                        onClick={() => setSelectedCourt(c)}
                      >
                        <strong>{c.nombre}</strong>
                        <span>{c.tipo === "futbol5" ? "Fútbol 5" : "Pádel"} · ${fmtARS(c.precio_hora)}</span>
                      </button>
                    ))}
                  </div>

                  <label className="booking-label">Fecha</label>
                  <input type="date" className="booking-input" value={selectedDate} min={minDate} onChange={e => setSelectedDate(e.target.value)} />

                  {selectedDate && (
                    <>
                      <label className="booking-label">Horario</label>
                      {loadingHorarios ? (
                        <p className="booking-hint">Cargando horarios...</p>
                      ) : horarios.length ? (
                        <div className="booking-horarios">
                          {horarios.map(h => (
                            <button
                              key={h.id}
                              className={`booking-horario ${selectedHorario?.id === h.id ? "is-selected" : ""}`}
                              onClick={() => setSelectedHorario(h)}
                            >
                              {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="booking-hint">Sin horarios disponibles para esta fecha</p>
                      )}
                    </>
                  )}
                </>
              )}

              <div className="booking-actions">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button variant="primary" disabled={!canGoNext()} onClick={() => setStep(2)}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="booking-step-content">
              <div className="booking-summary">
                <strong>{selectedCourt?.nombre}</strong> · {selectedDate} · {selectedHorario?.hora_inicio.slice(0, 5)}-{selectedHorario?.hora_fin.slice(0, 5)} · ${fmtARS(selectedCourt?.precio_hora)}
              </div>
              <div className="booking-form-grid">
                {[
                  ["DNI", "dni", "text", "Ingresá DNI"],
                  ["Nombre *", "nombre", "text", ""],
                  ["Apellido *", "apellido", "text", ""],
                  ["Email *", "email", "email", ""],
                  ["Teléfono *", "telefono", "tel", ""],
                ].map(([label, name, type, placeholder]) => (
                  <label key={name} className="booking-field">
                    <span>{label}</span>
                    <input
                      type={type}
                      value={clienteData[name]}
                      onChange={e => setClienteData({ ...clienteData, [name]: e.target.value })}
                      placeholder={placeholder}
                      className="booking-input"
                    />
                  </label>
                ))}
              </div>
              <div className="booking-actions">
                <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
                <Button variant="primary" disabled={!canGoNext()} onClick={() => setStep(3)}>Siguiente</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="booking-step-content">
              <div className="booking-confirm-box">
                <h4>{selectedCourt?.nombre}</h4>
                <p>📅 {selectedDate} · 🕐 {selectedHorario?.hora_inicio.slice(0, 5)}-{selectedHorario?.hora_fin.slice(0, 5)}</p>
                <p><strong>Pago total en el local:</strong> ${fmtARS(selectedCourt?.precio_hora)}</p>
                <p className="booking-confirm-hint">Sin seña · Se paga todo el día del turno</p>
                <hr />
                <p><strong>{clienteData.nombre} {clienteData.apellido}</strong></p>
                <p>{clienteData.email} · {clienteData.telefono} {clienteData.dni && `· DNI ${clienteData.dni}`}</p>
              </div>
              <div className="booking-actions">
                <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Confirmando..." : "Confirmar reserva"}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="booking-success">
          <div className="booking-success__icon">✅</div>
          <h3>¡Reserva solicitada!</h3>
          <p>Quedó <strong>pendiente de confirmación</strong> por el administrador.<br />Te avisaremos cuando sea confirmada. Pago 100% en el local.</p>
          <div className="booking-actions">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            <Button variant="primary" onClick={() => { onClose(); navigate("/mis-reservas") }}>Ver mis reservas</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function addHour(h) {
  const [hh, mm] = h.split(":").map(Number)
  return `${String(hh + 1).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

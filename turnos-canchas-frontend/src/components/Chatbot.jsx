import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { canchaService } from '../services/canchaService';
import '../styles/Chatbot.css';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '¡Hola! Soy el asistente virtual de la Cancha. ¿En qué puedo ayudarte?',
      isBot: true,
      options: [
        { id: 'ver_canchas', label: '🏟️ Ver canchas y precios' },
        { id: 'ver_horarios', label: '🕒 Ver horarios para hoy' },
        { id: 'mis_reservas', label: '📋 Ver mis reservas' },
        { id: 'contacto', label: '📞 Contacto / Soporte' }
      ]
    }
  ]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleOptionClick = async (option) => {
    // 1. Agregar el mensaje del usuario
    const userMessage = {
      id: Date.now(),
      text: option.label.replace(/🏟️|📅|📋|📞/g, '').trim(),
      isBot: false
    };
    
    setMessages(prev => {
      // Limpiar opciones de mensajes anteriores para evitar spam
      const clearedPrev = prev.map(m => ({ ...m, options: [] }));
      return [...clearedPrev, userMessage];
    });

    // 2. Mostrar estado de carga temporal
    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: loadingId, text: 'Buscando información...', isBot: true }]);

    // 3. Procesar respuesta
    let botResponse = {
      id: Date.now() + 2,
      text: '',
      isBot: true,
      options: []
    };

    try {
      if (option.id === 'ver_canchas') {
        let canchas = [];
        try {
          const res = await canchaService.getAll(false);
          canchas = Array.isArray(res) ? res : res?.data || [];
        } catch (e) {
          console.warn("Chatbot canchas fetch error:", e);
        }

        if (!canchas || canchas.length === 0) {
          canchas = [
            { id: 1, nombre: 'Cancha Fútbol 5 - Principal', tipo: 'futbol5', precio_hora: 15000 },
            { id: 2, nombre: 'Cancha Fútbol 5 - Secundaria', tipo: 'futbol5', precio_hora: 12000 },
            { id: 3, nombre: 'Cancha Pádel 1', tipo: 'padel', precio_hora: 8000 },
            { id: 4, nombre: 'Cancha Pádel 2', tipo: 'padel', precio_hora: 8000 },
          ];
        }

        const listado = canchas.map(c => `• ${c.nombre} (${c.tipo === 'futbol5' ? 'Fútbol 5' : 'Pádel'}) - $${Number(c.precio_hora).toLocaleString('es-AR')}/hr`).join('\n');
        botResponse.text = `Actualmente tenemos estas canchas disponibles:\n\n${listado}`;
        botResponse.options = [
          { id: 'ver_horarios', label: '🕒 Ver horarios para hoy' },
          { id: 'ver_horarios_manana', label: '📅 Ver horarios para mañana' },
          { id: 'ir_inicio', label: '⚡ Reservar ahora' },
          { id: 'volver_menu', label: '⬅️ Volver al menú principal' }
        ];

      } else if (option.id === 'ver_horarios' || option.id === 'ver_horarios_manana') {
        const esManana = option.id === 'ver_horarios_manana';
        const targetDate = new Date();
        if (esManana) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        const fechaStr = `${y}-${m}-${d}`;
        const fechaLegible = `${d}/${m}/${y}`;

        let canchas = [];
        try {
          const res = await canchaService.getAll(false);
          canchas = Array.isArray(res) ? res : res?.data || [];
        } catch {}

        if (!canchas || canchas.length === 0) {
          canchas = [
            { id: 1, nombre: 'Cancha Fútbol 5 - Principal' },
            { id: 2, nombre: 'Cancha Fútbol 5 - Secundaria' },
            { id: 3, nombre: 'Cancha Pádel 1' },
            { id: 4, nombre: 'Cancha Pádel 2' },
          ];
        }

        let horariosDisponiblesMsj = `Horarios disponibles para ${esManana ? 'mañana' : 'hoy'} (${fechaLegible}):\n\n`;

        for (const cancha of canchas) {
          let slotsText = '';
          try {
            let horarios = [];
            if (typeof cancha.id === 'number') {
              horarios = await canchaService.getHorariosDisponibles(cancha.id, fechaStr);
            }
            if (Array.isArray(horarios) && horarios.length > 0) {
              slotsText = horarios.map(h => h.hora_inicio.slice(0, 5)).join(' | ');
            } else {
              slotsText = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].join(' | ');
            }
          } catch (e) {
            slotsText = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].join(' | ');
          }
          horariosDisponiblesMsj += `🏟️ ${cancha.nombre}:\n${slotsText}\n\n`;
        }

        botResponse.text = horariosDisponiblesMsj;
        botResponse.options = [
          !esManana ? { id: 'ver_horarios_manana', label: '📅 Ver horarios de mañana' } : { id: 'ver_horarios', label: '🕒 Ver horarios de hoy' },
          { id: 'ir_inicio', label: '⚡ Ir a Reservar' },
          { id: 'volver_menu', label: '⬅️ Volver al menú principal' }
        ];

      } else if (option.id === 'mis_reservas') {
        botResponse.text = 'Te llevaré a tu panel personal para que puedas ver y gestionar tus reservas actuales.';
        botResponse.options = [
          { id: 'ir_mis_reservas', label: '📋 Ir a Mis Reservas' },
          { id: 'volver_menu', label: '⬅️ Volver al menú principal' }
        ];

      } else if (option.id === 'contacto') {
        botResponse.text = 'Puedes escribirnos a nuestro WhatsApp:\n📱 +54 9 11 1234-5678\n\nO enviarnos un email a:\n✉️ soporte@canchas.com';
        botResponse.options = [
          { id: 'volver_menu', label: '⬅️ Volver al menú principal' }
        ];

      } else if (option.id === 'ir_inicio') {
        navigate('/');
        setIsOpen(false);
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        return;

      } else if (option.id === 'ir_mis_reservas') {
        navigate('/mis-reservas');
        setIsOpen(false);
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        return;

      } else if (option.id === 'volver_menu') {
        botResponse.text = '¿En qué más te puedo ayudar?';
        botResponse.options = [
          { id: 'ver_canchas', label: '🏟️ Ver canchas y precios' },
          { id: 'ver_horarios', label: '🕒 Ver horarios para hoy' },
          { id: 'mis_reservas', label: '📋 Ver mis reservas' },
          { id: 'contacto', label: '📞 Contacto / Soporte' }
        ];
      } else {
        botResponse.text = 'Lo siento, no entendí esa opción.';
        botResponse.options = [{ id: 'volver_menu', label: '⬅️ Volver al menú principal' }];
      }
    } catch (error) {
      botResponse.text = 'Hubo un error al intentar conectarme con el servidor. Por favor, intenta de nuevo más tarde.';
      botResponse.options = [{ id: 'volver_menu', label: '⬅️ Volver al menú principal' }];
    }

    // 4. Reemplazar mensaje de carga con la respuesta real
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== loadingId);
      return [...filtered, botResponse];
    });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="chatbot-wrapper">
      {!isOpen && (
        <button className="chatbot-btn" onClick={toggleChat} title="Asistencia Virtual">
          💬
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>🤖 Asistente Virtual</h3>
            <button className="chatbot-close" onClick={toggleChat}>×</button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div className={`chat-bubble ${msg.isBot ? 'bot' : 'user'}`}>
                  {msg.text}
                </div>
                
                {msg.isBot && msg.options && msg.options.length > 0 && (
                  <div className="chatbot-options">
                    {msg.options.map(opt => (
                      <button 
                        key={opt.id} 
                        className="chat-option-btn"
                        onClick={() => handleOptionClick(opt)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;

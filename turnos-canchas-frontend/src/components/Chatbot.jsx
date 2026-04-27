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
        const canchas = await canchaService.getAll(false);
        if (canchas && canchas.length > 0) {
          const listado = canchas.map(c => `• ${c.nombre} (${c.tipo === 'futbol5' ? 'Fútbol 5' : 'Pádel'}) - $${c.precio_hora}/hr`).join('\n');
          botResponse.text = `Actualmente tenemos estas canchas activas:\n\n${listado}`;
        } else {
          botResponse.text = 'En este momento no hay canchas activas registradas en el sistema.';
        }
        botResponse.options = [
          { id: 'ver_horarios', label: '🕒 Ver horarios para hoy' },
          { id: 'volver_menu', label: '⬅️ Volver al menú principal' }
        ];

      } else if (option.id === 'ver_horarios') {
        const canchas = await canchaService.getAll(false);
        const hoy = new Date().toISOString().split('T')[0];
        
        let horariosDisponiblesMsj = `Horarios disponibles para hoy (${hoy.split('-').reverse().join('/')}):\n\n`;
        let hayHorarios = false;

        for (const cancha of canchas) {
          try {
            const horarios = await canchaService.getHorariosDisponibles(cancha.id, hoy);
            if (horarios && horarios.length > 0) {
              const horariosFormateados = horarios.map(h => h.hora_inicio.slice(0, 5));
              horariosDisponiblesMsj += `${cancha.nombre}:\n${horariosFormateados.join(' | ')}\n\n`;
              hayHorarios = true;
            } else {
              horariosDisponiblesMsj += `${cancha.nombre}: Sin disponibilidad.\n\n`;
            }
          } catch (e) {
            horariosDisponiblesMsj += `${cancha.nombre}: Error al cargar horarios.\n\n`;
          }
        }

        if (!hayHorarios) {
          botResponse.text = 'Lo siento, no quedan horarios disponibles para ninguna cancha el día de hoy.';
        } else {
          botResponse.text = horariosDisponiblesMsj;
        }

        botResponse.options = [
          { id: 'ir_inicio', label: '📅 Ir a Reservar' },
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

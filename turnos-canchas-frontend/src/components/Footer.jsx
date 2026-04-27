import React from 'react';
import ReportBugButton from './ReportBugButton';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Sobre Nosotros</h3>
          <p>
            Somos la plataforma líder para la gestión y reserva de canchas deportivas. 
            Nuestro objetivo es facilitar la conexión entre jugadores y complejos deportivos de manera rápida y segura.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Ayuda</h3>
          <ul className="footer-links">
            <li><a href="#">Cómo funciona</a></li>
            <li><a href="#">Preguntas Frecuentes</a></li>
            <li><a href="#">Soporte Técnico</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Síguenos</h3>
          <div className="social-links">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram">
              📸 Instagram
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook">
              📘 Facebook
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="Twitter">
              🐦 Twitter
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Sistema de Reservas. Todos los derechos reservados.</p>
        <div className="footer-bug-report">
          <ReportBugButton />
        </div>
      </div>
    </footer>
  );
}

export default Footer;

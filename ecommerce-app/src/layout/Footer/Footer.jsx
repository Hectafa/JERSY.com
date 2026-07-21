import { Link, useLocation } from "react-router-dom";
import Icon from "../../components/common/Icon/Icon";
import "./Footer.css";

export default function Footer() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <footer className="footer">
      {/* Main Footer */}
      {isHome && (
        <section className="footer-main">
          <div className="container">
            <div className="footer-content">
              {/* Company Info */}
              <div className="footer-section">
                <div className="footer-logo">
                  <Link to="/" className="logo">
                    JERSY
                  </Link>
                </div>
                <div className="social-links">
                  <h4>Síguenos</h4>
                  <div className="social-icons">
                    <Link to="#" aria-label="Facebook">
                      <Icon name="facebook" size={20} />
                    </Link>
                    <Link to="#" aria-label="Instagram">
                      <Icon name="instagram" size={20} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="footer-section">
                <h3>Categorías</h3>
                <ul>
                  <li>
                    <Link to="#">Clubes</Link>
                  </li>
                  <li>
                    <Link to="#">Selecciones</Link>
                  </li>
                  <li>
                    <Link to="#">Clásicos</Link>
                  </li>
                </ul>
              </div>

              {/* Customer Service */}
              <div className="footer-section">
                <h3>Atención al Cliente</h3>
                <div className="contact-details">
                  <span>
                    <Icon name="phone" size={16} />
                    4492908399
                  </span>
                  <span>
                    <Icon name="mail" size={16} />
                    jersyhelp@jersy.com
                  </span>
                  <span>
                    <Icon name="clock" size={16} />
                    Lun-Vie
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust Section */}
      {isHome && (
        <section className="footer-trust">
          <div className="container">
            <div className="trust-content">
              <div className="trust-item">
                <Icon name="shield" size={24} />
                <div>
                  <strong>Compra Segura</strong>
                  <span>Protección SSL</span>
                </div>
              </div>
              <div className="trust-item">
                <Icon name="truck" size={24} />
                <div>
                  <strong>Envío Gratis</strong>
                  <span>En pedidos +$799</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Payment Methods */}
      {isHome && (
        <section className="footer-payment">
          <div className="container">
            <div className="payment-content">
              <div className="payment-section">
                <h4>Métodos de Pago</h4>
                <div className="payment-icons">
                  <Icon name="visa" size={32} />
                  <Icon name="mastercard" size={32} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Bottom */}
      <section className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {new Date().getFullYear()} JERSY. Todos los derechos
              reservados.
            </p>
            <nav className="legal-links">
              <Link to="#">Política de Privacidad</Link>
              <Link to="#">Términos y Condiciones</Link>
              <Link to="#">Política de Cookies</Link>
              <Link to="#">Accesibilidad</Link>
              <Link to="#">Mapa del Sitio</Link>
            </nav>
          </div>
        </div>
      </section>
    </footer>
  );
}

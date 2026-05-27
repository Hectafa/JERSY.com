import React, { useState } from "react";
import "./Newsletter.css";

export default function Newsletter() {
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    console.log("Newsletter signup:", email);
    setEmail("");
  };

  return (
    <section className="footer-newsletter">
      <div className="container">
        <div className="newsletter-content">
          <div className="newsletter-text">
            <h3>¡Suscríbete a nuestro newsletter!</h3>
            <p>
              Recibe ofertas exclusivas y novedades directamente en tu email
            </p>
          </div>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <div className="newsletter-input-group">
              <input
                type="email"
                className="newsletter-input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="newsletter-btn">
                Suscribirse
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

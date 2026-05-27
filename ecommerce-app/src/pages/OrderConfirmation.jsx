import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/common/Icon/Icon";
import "./OrderConfirmation.css";

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};

  useEffect(() => {
    if (!order) {
      navigate("/");
      return;
    }
  }, [order, navigate]);

  const address = order.shippingAddress || {};
  const subtotal = order.subtotal || 0;
  const tax = order.tax || 0;
  const shipping = order.shipping || 0;
  const total = order.total || 0;
  const orderDate = order.date
    ? new Date(order.date).toLocaleDateString()
    : "No disponible";

  // Utilidad para formatear moneda (MXN)
  const formatMoney = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v);

  return (
    <div className="order-confirmation">
      <div className="confirmation-content">
        <div className="confirmation-icon">
          <Icon name="checkCircle" size={64} className="success"></Icon>
        </div>
        <h1>¡Gracias por tu compra!</h1>
        <p className="confirmation-message">
          Tu pedido <strong>#{order.id || "N/A"}</strong> ha sido confirmado y
          está siendo procesado
        </p>
        <div className="confirmation-details">
          <h2>Detalles de tu pedido</h2>
          <div className="order-info">
            <p>
              <strong>Fecha: </strong>
              {orderDate}
            </p>
            <h3>Productos</h3>
            <ul className="order-items">
              {(order.items || []).map((item) => (
                <li key={item._id}>
                  {item.name} x {item.quantity} - {formatMoney(item.price)}
                  <span>{formatMoney(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="order-totals">
              <p>
                <strong>Subtotal: </strong>
                {formatMoney(subtotal)}
              </p>
              <p>
                <strong>IVA: </strong>
                {formatMoney(tax)}
              </p>
              <p>
                <strong>Envío: </strong>
                {formatMoney(shipping)}
              </p>
              <p>
                <strong>Total:</strong> {formatMoney(total)}
              </p>

              <p>
                <strong>Dirección de envío:</strong>
              </p>
              <address>
                {address.name || "No disponible"}
                <br />
                {address.address1 || ""}
                {address.address1 && <br />}
                {address.address2 || ""}
                {address.address2 && <br />}
                {address.city && address.postalCode
                  ? `${address.city}, ${address.postalCode}`
                  : "Ciudad y código postal no disponibles"}
                <br />
                {address.country || "País no especificado"}
              </address>
            </div>
          </div>
          <p>
            Hemos enviado un correo electrónico con los detalles de tu compra.
            También puedes ver el estado de tu pedido en cualquier momento desde
            tu perfil.
          </p>
        </div>
        <div className="confirmation-actions">
          <Link to="/" className="button primary">
            <Icon name="home" size={20} />
            <span>Volver al inicio</span>
          </Link>
          <Link to="/orders" className="button secondary">
            <Icon name="package" size={20} />
            <span>Ver mis pedidos</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

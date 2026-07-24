import { useNavigate } from "react-router-dom";
import CartView from "../components/Cart/CartView";
import Button from "../components/common/Button";
import Icon from "../components/common/Icon/Icon";
import { useCart } from "../context/CartContext";
import { freeShipping } from "../constants/shipping";
import "./Cart.css";

export default function Cart() {
  const { items, total, clearCart } = useCart();

  const navigate = useNavigate();

  const remainingForFreeShipping = Math.max(0, freeShipping - total);
  const freeShippingProgress = Math.min(100, (total / freeShipping) * 100);

  if (items?.length === 0) {
    return (
      <div className="cart-empty" data-testid="cart-empty">
        <Icon name="cart" size={100}></Icon>
        <h2>Tu carrito está vacío</h2>
        <p>Agrega algunos productos para empezar a comprar</p>
        <Button variant="primary" onClick={() => navigate("/")}>
          <span>Continuar Comprando</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart-header">
        <div className="cart-header-title">
          <Icon name="cart" size={32} />
          <h1>Carrito de Compras</h1>
        </div>
        <div className="cart-header-info">
          <Button
            variant="ghost"
            className="danger clear-cart-btn"
            onClick={clearCart}
            title="Vaciar carrito"
            size="sm"
          >
            <Icon name="trash" size={18} />
            <span>Vaciar carrito</span>
          </Button>
        </div>
      </div>

      <div className="free-shipping-bar"
      data-testid="free-shipping-bar">
        <div className="free-shipping-bar-track">
          <div
          className="free-shipping-bar-fill"
          style={{width: `${freeShippingProgress}%` }}
          />
        </div>
        <div className="free-shipping-bar-footer">
        <p className="free-shipping-bar-text">
          {remainingForFreeShipping > 0
          ? `Te faltan $${remainingForFreeShipping.toFixed
          (2)} para conseguir el envío gratis`
          : "¡Envío gratis!"}
        </p>
        <Button
            variant="secondary"
            onClick={() => navigate("/")}
            title="Seguir comprando"
            size="sm"
            data-testid="cart-continue-shopping-button">
            <Icon name="arrowLeft" size={16} />
            <span>Seguir comprando</span>
        </Button>
        </div>
      </div>

      <div className="cart-items">
        <CartView />
        <div className="cart-summary">
          <div className="cart-total">
            <span className="cart-total-subtitle">Total a pagar</span>
            <h2 data-testid="cart-subtotal">${total.toFixed(2)}</h2>
          </div>
          <div className="cart-actions">
            <Button
              variant="primary"
              onClick={() => navigate("/checkout")}
              size="lg"
              disabled={!items || items.length === 0}
              title={
                !items || items.length === 0
                  ? "Agrega productos al carrito para continuar"
                  : "Proceder al pago"
              }
              data-testid="cart-checkout-button"
            >
              <Icon name="creditCard" size={20} />
              <span>Proceder al pago</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

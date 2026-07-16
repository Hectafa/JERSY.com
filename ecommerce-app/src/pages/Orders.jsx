import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Icon from "../components/common/Icon/Icon";
import Loading from "../components/common/Loading/Loading";
import { useAuth } from "../context/AuthContext";
import { getOrdersByUser } from "../services/orderService";
import "./Orders.css";

const formatMoney = (value = 0) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

const formatDate = (isoString) => {
  if (!isoString) return "Fecha desconocida";
  try {
    return new Date(isoString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "Fecha inválida";
  }
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrdersByUser(user.id);
        if (cancelled) return;
        setOrders(data || []);
        setSelectedOrderId((current) => current ?? data?.[0]?._id ?? null);
      } catch (err) {
        if (!cancelled) setError("No se pudieron cargar tus pedidos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order._id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const detailStatusToken = (selectedOrder?.status || "pending").toLowerCase();
  const detailStatusLabel = selectedOrder?.status || "Pendiente";

  if (loading) {
    return (
      <div className="orders-page">
        <Loading message="Cargando pedidos..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <ErrorMessage>{error}</ErrorMessage>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="orders-page orders-empty">
        <Icon name="package" size={48} />
        <h1>No tienes pedidos todavía</h1>
        <p>Cada vez que confirmes una compra en el checkout, podrás verla aquí.</p>
        <Link to="/" className="orders-link">
          <Button>Descubrir productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <p className="eyebrow">Historial de compras</p>
          <h1>Mis pedidos</h1>
          <p className="muted">
            {orders.length === 1
              ? "Tienes 1 pedido"
              : `Tienes ${orders.length} pedidos`}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setSelectedOrderId(orders[0]?._id ?? null)}
        >
          Ver más reciente
        </Button>
      </div>

      <div className="orders-content">
        <div className="orders-list card">
          <div className="orders-list-header">
            <h2>Pedidos</h2>
            <span>{orders.length}</span>
          </div>
          <div className="orders-list-body">
            {orders.map((order) => {
              const itemCount = order.products?.length || 0;
              const statusToken = (order.status || "pending").toLowerCase();
              const isActive = selectedOrderId === order._id;
              return (
                <button
                  key={order._id}
                  className={`order-card${isActive ? " active" : ""}`}
                  onClick={() => setSelectedOrderId(order._id)}
                >
                  <div className="order-card-head">
                    <span className="order-id">#{order._id}</span>
                    <span className={`order-status order-status-${statusToken}`}>
                      {order.status || "pending"}
                    </span>
                  </div>
                  <p className="order-date">{formatDate(order.createdAt)}</p>
                  <div className="order-card-meta">
                    <span>{itemCount} artículos</span>
                    <strong>{formatMoney(order.totalPrice || 0)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="orders-detail card">
          {selectedOrder ? (
            <>
              <div className="order-detail-header">
                <div>
                  <p className="eyebrow">Pedido #{selectedOrder._id}</p>
                  <h2>{formatMoney(selectedOrder.totalPrice || 0)}</h2>
                  <p className="muted">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <span className={`order-status order-status-${detailStatusToken}`}>
                  {detailStatusLabel}
                </span>
              </div>

              <div className="order-section">
                <h3>Resumen del pago</h3>
                <ul className="order-summary-list">
                  <li>
                    <span>Subtotal</span>
                    <strong>
                      {formatMoney(
                        (selectedOrder.totalPrice || 0) -
                          (selectedOrder.tax || 0) -
                          (selectedOrder.shippingCost || 0)
                      )}
                    </strong>
                  </li>
                  <li>
                    <span>IVA</span>
                    <strong>{formatMoney(selectedOrder.tax || 0)}</strong>
                  </li>
                  <li>
                    <span>Envío</span>
                    <strong>
                      {selectedOrder.shippingCost === 0
                        ? "Gratis"
                        : formatMoney(selectedOrder.shippingCost || 0)}
                    </strong>
                  </li>
                  <li className="order-summary-total">
                    <span>Total</span>
                    <strong>{formatMoney(selectedOrder.totalPrice || 0)}</strong>
                  </li>
                </ul>
              </div>

              <div className="order-section">
                <h3>Dirección de envío</h3>
                {selectedOrder.address ? (
                  <address className="order-address">
                    <strong>{selectedOrder.address.name}</strong>
                    <p>{selectedOrder.address.address}</p>
                    <p>
                      {selectedOrder.address.city}, {selectedOrder.address.postalCode}
                    </p>
                    <p>{selectedOrder.address.country}</p>
                  </address>
                ) : (
                  <p className="muted">Sin dirección registrada.</p>
                )}
              </div>

              <div className="order-section">
                <h3>Método de pago</h3>
                {selectedOrder.paymentMethod ? (
                  <div>
                    <p>{selectedOrder.paymentMethod.cardHolderName}</p>
                    <p>
                      ****{" "}
                      {selectedOrder.paymentMethod.cardNumber?.slice(-4) || "----"}
                    </p>
                  </div>
                ) : (
                  <p className="muted">Sin método de pago registrado.</p>
                )}
              </div>

              <div className="order-section">
                <h3>Productos</h3>
                <ul className="order-items">
                  {selectedOrder.products?.map((item, index) => (
                    <li key={item.productId?._id || index}>
                      <div>
                        <p>{item.productId?.name || "Producto"}</p>
                        <span>
                          Cantidad: {item.quantity || 1} · Precio:{" "}
                          {formatMoney(item.price || 0)}
                        </span>
                      </div>
                      <strong>
                        {formatMoney((item.price || 0) * (item.quantity || 1))}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="orders-empty">
              <h3>Selecciona un pedido de la lista</h3>
              <p className="muted">
                Aquí verás el detalle completo: productos, dirección y método de
                pago utilizados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

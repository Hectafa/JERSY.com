import { Fragment, useEffect, useState } from "react";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { getAllOrders, updateOrderStatus, deleteOrder } from "../services/orderService";
import "./Orders.css";

const statusOptions = ["pending", "delivered"];
const DELETABLE_STATUSES = ["delivered"];

const tabs = [
    { key: "all", label: "Todos", status: undefined },
    { key: "pending", label: "Pendientes", status: "pending"},
    { key: "delivered", label: "Entregados", status: "delivered"},
];

const formatMoney = (value = 0) =>
    new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(value);

    const formatDate = (isoString) => {
        if (!isoString) return "Fecha desconocida"
        try {
            return new Date(isoString).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch (error) {
            return "Fecha invalida";
        }
    };

    export default function AdminOrders() {
        const [activeTab, setActiveTab] = useState("all");
        const [orders, setOrders] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [updatingId, setUpdatingId] = useState(null);
        const [deletingId, setDeletingId] = useState(null);
        const [expandedId, setExpandedId] = useState(null);

        useEffect(() => {
            let cancelled = false;
            const status = tabs.find((tab) => tab.key === activeTab)?.status;

            async function loadOrders() {
                try {
                    setLoading(true);
                    setError(null);
                    const results = await getAllOrders(status);
                    if (!cancelled) setOrders(results || []);
                } catch (error) {
                    if (!cancelled) setError("No se pudieron cargar los pedidos.");
                } finally {
                    if (!cancelled) setLoading(false);
                }
            }

            loadOrders();
            return () => {
                cancelled = true;
            };
        }, [activeTab]);

        const handleStatusChange = async (orderId, status) => {
            setUpdatingId(orderId);
            try {
                const updated = await updateOrderStatus(orderId, { status });
                setOrders((prev) => 
                prev.map((order) => (order._id === orderId ? {...order, status: updated.status } : order)),
            );
            } catch (err) {
                setError("No se pudo actualizar el estado del pedido.")
            } finally {
                setUpdatingId(null);
            }
        };

        const toggleExpand = (orderId) => {
            setExpandedId((prev) => (prev === orderId ? null : orderId));
        };

        const handleDelete = async (order) => {
            const confirmed = window.confirm(`¿Eliminar el pedido #${order._id}? Esta acción no se puede deshacer.`);
            if (!confirmed) return;

            setDeletingId(order._id);
            try {
                await deleteOrder(order._id);
                setOrders((prev) => prev.filter((o) => o._id !== order._id));
            } catch (err) {
                setError("No se pudo eliminar el pedido.");
            } finally {
                setDeletingId(null);
            }
        };

        return (
            <div className="admin-order-container" style={{padding: "24px"}}>
                <h1 className="h1" style={{ marginBottom: "16px" }}>
                    Administrar pedidos
                </h1>

                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    {tabs.map((tab) => (
                        <Button
                        key={tab.key}
                        variant={activeTab === tab.key ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </Button>
                    ))}
                </div>

                {loading && <Loading>Cargando pedidos...</Loading>}
                {error && <ErrorMessage>{error}</ErrorMessage>}

                {!loading && !error && (
                    <table className="admin-orders-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left" }}>Pedido</th>
                                <th style={{ textAlign: "left" }}>Cliente</th>
                                <th style={{ textAlign: "left" }}>Fecha</th>
                                <th style={{ textAlign: "left" }}>Total</th>
                                <th style={{ textAlign: "left" }}>Estado</th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                const statusToken = (order.status || "pending").toLowerCase();
                                const canDelete = DELETABLE_STATUSES.includes(statusToken);
                                const isExpanded = expandedId === order._id;
                                return (
                                    < Fragment key={order._id}>
                                        <tr>
                                            <td>
                                                <button
                                                type="button"
                                                className="order-expand-toggle"
                                                onClick={() => toggleExpand(order._id)}
                                                >
                                                    {isExpanded ? "▼" : "▶"} #{order._id}
                                                </button>
                                            </td>
                                            <td>
                                                {order.user?.name || "Sin nombre"}
                                                <br />
                                                <span className="muted">{order.user?.email}</span>
                                            </td>
                                            <td>{formatDate(order.createdAt)}</td>
                                            <td style={{ textAlign: "right" }}>{formatMoney(order.totalPrice || 0)}</td>
                                            <td>
                                                <span className={`order-status order-status-${statusToken}`}>
                                                    {order.status || "pending"}
                                                </span>
                                            </td>
                                            <td>
                                            <select
                                            value={order.status || "pending"}
                                            disabled={updatingId === order._id}
                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            >
                                                {statusOptions.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            {canDelete && (
                                                <Button
                                                variant="ghost"
                                                className="danger"
                                                size="sm"
                                                disabled={deletingId === order._id}
                                                onClick={() => handleDelete(order)}
                                                title="Eliminar pedido"
                                                >
                                                    Eliminar
                                                </Button>
                                            )}
                                        </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="order-details-row">
                                                <td colSpan={7}>
                                                    <div className="order-detail-panel">
                                                        <div>
                                                            <h4>Productos</h4>
                                                            <ul className="order-detail-items">
                                                                {order.products?.map((item, idx) => (
                                                                    <li key={idx}>
                                                                        {item.productId?.name || "Producto eliminado"}
                                                                        {item.size ? ` . Talla ${item.size}` : ""}
                                                                        {` . Cantidad: ${item.quantity}`}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                        <div>
                                                            <h4>Dirección de envío</h4>
                                                            {order.address ? (
                                                                <p className="order-detail-address">
                                                                    {order.address.address}, {order.address.city}, {order.address.state}, {order.address.postalCode}, {order.address.country}
                                                                    <br />
                                                                    Tel: {order.address.phone}
                                                                </p>
                                                            ) : (
                                                                <p className="order-detail-address">Sin dirección registrada</p>
                                                            )}
                                                        </div>
                                                        <span className="order-detail-id">Pedido: #{order._id}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        );
    }

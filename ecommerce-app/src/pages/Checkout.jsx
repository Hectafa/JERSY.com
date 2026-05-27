import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartView from "../components/Cart/CartView";
import AddressForm from "../components/Checkout/Address/AddressForm";
import AddressList from "../components/Checkout/Address/AddressList";
import PaymentForm from "../components/Checkout/Payment/PaymentForm";
import PaymentList from "../components/Checkout/Payment/PaymentList";
import SummarySection from "../components/Checkout/shared/SummarySection";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { useCart } from "../context/CartContext";
import {
  getDefaultPaymentMethod,
  getPaymentMethods,
} from "../services/paymentService";
import {
  getDefaultShippingAddress,
  getShippingAddresses,
} from "../services/shippingService";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, total, clearCart } = useCart();

  // --- LÓGICA DE NEGOCIO FINANCIERA ---
  // Cálculos derivados del estado del carrito.
  // Se realizan en cada render para asegurar consistencia.
  const subtotal = typeof total === "number" ? total : 0;
  const TAX_RATE = 0.16; // IVA 16%
  const SHIPPING_RATE = 350; // Costo de envío estándar
  const FREE_SHIPPING_THRESHOLD = 1000; // Envío gratis si subtotal >= 1000

  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_RATE;
  const grandTotal = parseFloat(
    (subtotal + taxAmount + shippingCost).toFixed(2)
  );
  debugger;
  const [isOrderFinished, setIsOrderFinished] = useState(false);

  // Utilidad para formatear moneda (MXN)
  const formatMoney = (v) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(v);

  // --- EFECTOS Y REFERENCIAS ---

  // Efecto de protección de ruta:
  // Si el carrito está vacío y no estamos en proceso de confirmación, redirigir al carrito.
  useEffect(() => {
    debugger;
    if (!cartItems || cartItems.length === 0) {
      if (!isOrderFinished) {
        navigate("/cart");
      }
    }
  }, [cartItems, navigate]);

  // --- ESTADOS LOCALES (Gestión de UI y Datos) ---

  // Datos principales (Direcciones y Pagos)
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);

  // Estados de carga y error para la obtención inicial de datos
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [localError, setLocalError] = useState(null);

  // Control de visibilidad de formularios (Modo Edición/Creación)
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Elementos que se están editando actualmente (null si es creación)
  const [editingAddress, setEditingAddress] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  // Control de acordeones/secciones expandidas
  const [addressSectionOpen, setAddressSectionOpen] = useState(false);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(false);

  // Selección actual del usuario
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // --- CARGA DE DATOS INICIAL ---
  useEffect(() => {
    /**
     * Función asíncrona para cargar datos iniciales.
     * Obtiene direcciones y métodos de pago en paralelo.
     * Establece los valores por defecto si existen.
     */
    async function loadData() {
      setLoadingLocal(true);
      setLocalError(null);
      try {
        // Carga paralela de datos para mejorar performance
        const [addrList, firstAddress, payList, firstPayment] =
          await Promise.all([
            getShippingAddresses(),
            getDefaultShippingAddress(),
            getPaymentMethods(),
            getDefaultPaymentMethod(),
          ]);

        setAddresses(addrList || []);
        setPayments(payList || []);

        // Pre-seleccionar valores por defecto
        setSelectedAddress(firstAddress);
        setSelectedPayment(firstPayment);

        // Abrir secciones si no hay datos seleccionados
        setAddressSectionOpen(!firstAddress);
        setPaymentSectionOpen(!firstPayment);
      } catch (err) {
        setLocalError("No se pudo cargar direcciones o métodos de pago.");
      } finally {
        setLoadingLocal(false);
      }
    }

    loadData();
  }, []);

  // --- HANDLERS PARA DIRECCIONES (CRUD Local) ---

  /**
   * Alterna la visibilidad de la sección de direcciones.
   * Cierra el formulario si estaba abierto.
   */
  const handleAddressToggle = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen((prev) => !prev);
  };

  /**
   * Selecciona una dirección existente y cierra el acordeón.
   * @param {Object} address - La dirección seleccionada.
   */
  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  /**
   * Inicia el proceso de creación de una nueva dirección.
   * Abre el formulario en modo creación.
   */
  const handleAddressNew = () => {
    setShowAddressForm(true);
    setEditingAddress(null);
    setAddressSectionOpen(true);
  };

  /**
   * Inicia el proceso de edición de una dirección existente.
   * Abre el formulario precargado con los datos de la dirección.
   * @param {Object} address - La dirección a editar.
   */
  const handleAddressEdit = (address) => {
    setShowAddressForm(true);
    setEditingAddress(address);
    setAddressSectionOpen(true);
  };

  /**
   * Elimina una dirección de la lista local.
   * Si la dirección eliminada estaba seleccionada, intenta seleccionar otra.
   */
  const handleAddressDelete = (address) => {
    const updatedAddresses = addresses.filter((add) => add._id !== address._id);
    // Si borramos la seleccionada, seleccionamos la primera disponible o null
    if (selectedAddress?._id === address._id) {
      setSelectedAddress(updatedAddresses[0] || null);
    }
    setAddresses(updatedAddresses);
  };

  /**
   * Maneja el guardado (Creación o Edición) de una dirección.
   * Actualiza la lista local y la selección automáticamente para mejorar UX.
   */
  const handleAddressSubmit = (formData) => {
    let updatedAddresses;
    let newSelectedAddress = selectedAddress;

    if (editingAddress) {
      // EDICIÓN: Actualizamos la lista
      updatedAddresses = addresses.map((addr) =>
        addr._id === editingAddress._id ? { ...addr, ...formData } : addr
      );

      // Si la que editamos estaba seleccionada, actualizamos también el estado de selección
      // para que refleje los cambios inmediatamente en el resumen.
      if (selectedAddress?._id === editingAddress._id) {
        newSelectedAddress = updatedAddresses.find(
          (a) => a._id === editingAddress._id
        );
      }
    } else {
      // CREACIÓN: Agregamos y seleccionamos automáticamente (UX tipo Amazon)
      const newAddress = { _id: Date.now().toString(), ...formData };
      updatedAddresses = [...addresses, newAddress];
      newSelectedAddress = newAddress;
    }

    setAddresses(updatedAddresses);
    setSelectedAddress(newSelectedAddress);
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  /**
   * Cancela la operación actual (creación o edición) de dirección.
   * Cierra el formulario y limpia el estado de edición.
   */
  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressSectionOpen(false);
  };

  // --- HANDLERS PARA PAGOS (CRUD Local) ---

  /**
   * Alterna la visibilidad de la sección de pagos.
   * Cierra el formulario si estaba abierto.
   */
  const handlePaymentToggle = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen((prev) => !prev);
  };

  /**
   * Selecciona un método de pago existente y cierra el acordeón.
   * @param {Object} payment - El método de pago seleccionado.
   */
  const handleSelectPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  /**
   * Inicia el proceso de creación de un nuevo método de pago.
   * Abre el formulario en modo creación.
   */
  const handlePaymentNew = () => {
    setShowPaymentForm(true);
    setEditingPayment(null);
    setPaymentSectionOpen(true);
  };

  /**
   * Inicia el proceso de edición de un método de pago existente.
   * Abre el formulario precargado con los datos del pago.
   * @param {Object} payment - El método de pago a editar.
   */
  const handlePaymentEdit = (payment) => {
    setShowPaymentForm(true);
    setEditingPayment(payment);
    setPaymentSectionOpen(true);
  };

  /**
   * Elimina un método de pago de la lista local.
   * Si el pago eliminado estaba seleccionado, intenta seleccionar otro.
   * @param {Object} payment - El método de pago a eliminar.
   */
  const handlePaymentDelete = (payment) => {
    const updatedPayments = payments.filter((pay) => pay._id !== payment._id);
    // Si borramos el seleccionado, seleccionamos el primero disponible o null
    if (selectedPayment?._id === payment._id) {
      setSelectedPayment(updatedPayments[0] || null);
    }
    setPayments(updatedPayments);
  };

  /**
   * Maneja el guardado (Creación o Edición) de un método de pago.
   * Actualiza la lista local y la selección automáticamente.
   * @param {Object} formData - Datos del formulario de pago.
   */
  const handlePaymentSubmit = (formData) => {
    let updatedPayments;
    let newSelectedPayment = selectedPayment;

    if (editingPayment) {
      // EDICIÓN
      updatedPayments = payments.map((pay) =>
        pay._id === editingPayment._id ? { ...pay, ...formData } : pay
      );

      // Sincronizar selección si se editó el actual
      if (selectedPayment?._id === editingPayment._id) {
        newSelectedPayment = updatedPayments.find(
          (p) => p._id === editingPayment._id
        );
      }
    } else {
      // CREACIÓN: Auto-seleccionar
      const newPayment = { _id: Date.now().toString(), ...formData };
      updatedPayments = [...payments, newPayment];
      newSelectedPayment = newPayment;
    }

    setPayments(updatedPayments);
    setSelectedPayment(newSelectedPayment);
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  /**
   * Cancela la operación actual (creación o edición) de pago.
   * Cierra el formulario y limpia el estado de edición.
   */
  const handleCancelPayment = () => {
    setShowPaymentForm(false);
    setEditingPayment(null);
    setPaymentSectionOpen(false);
  };

  // --- FINALIZACIÓN DE ORDEN ---

  /**
   * Crea el objeto de orden final y simula el envío.
   * Guarda en localStorage para persistencia simple y redirige.
   */
  const handleCreateOrder = () => {
    if (
      !selectedAddress ||
      !selectedPayment ||
      !cartItems ||
      cartItems.length === 0
    ) {
      return;
    }

    const order = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: cartItems.map((item) => ({
        ...item,
        subtotal: item.price * item.quantity,
      })),
      subtotal,
      tax: taxAmount,
      shipping: shippingCost,
      total: grandTotal,
      shippingAddress: selectedAddress,
      paymentMethod: selectedPayment,
      status: "confirmed",
    };

    // Simulación de persistencia
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    debugger;
    setIsOrderFinished(true);
    navigate("/order-confirmation", { state: { order } });
    clearCart();
  };

  return (
    // Mostrar loading o error antes del contenido principal
    loadingLocal ? (
      <Loading message="Cargando direcciones y métodos de pago..." />
    ) : localError ? (
      <ErrorMessage message={localError} />
    ) : (
      <div className="checkout-container">
        <div className="checkout-left">
          <SummarySection
            title="1. Dirección de envío"
            selected={selectedAddress}
            summaryContent={
              <div className="selected-address">
                <p>{selectedAddress?.name}</p>
                <p>{selectedAddress?.address1}</p>
                <p>
                  {selectedAddress?.city}, {selectedAddress?.postalCode}
                </p>
              </div>
            }
            isExpanded={
              showAddressForm || addressSectionOpen || !selectedAddress
            }
            onToggle={handleAddressToggle}
          >
            {!showAddressForm && !editingAddress ? (
              <AddressList
                addresses={addresses}
                selectedAddress={selectedAddress}
                onSelect={handleSelectAddress}
                onEdit={handleAddressEdit}
                onAdd={handleAddressNew}
                onDelete={handleAddressDelete}
              />
            ) : (
              <AddressForm
                onSubmit={handleAddressSubmit}
                onCancel={handleCancelAddress}
                initialValues={editingAddress || {}}
                isEdit={!!editingAddress}
              />
            )}
          </SummarySection>

          <SummarySection
            title="2. Método de pago"
            selected={selectedPayment}
            summaryContent={
              <div className="selected-payment">
                <p>{selectedPayment?.alias}</p>
                <p>**** {selectedPayment?.cardNumber?.slice(-4) || "----"}</p>
              </div>
            }
            isExpanded={
              showPaymentForm || paymentSectionOpen || !selectedPayment
            }
            onToggle={handlePaymentToggle}
          >
            {!showPaymentForm && !editingPayment ? (
              <PaymentList
                payments={payments}
                selectedPayment={selectedPayment}
                onSelect={handleSelectPayment}
                onEdit={handlePaymentEdit}
                onAdd={handlePaymentNew}
                onDelete={handlePaymentDelete}
              />
            ) : (
              <PaymentForm
                onSubmit={handlePaymentSubmit}
                onCancel={handleCancelPayment}
                initialValues={editingPayment || {}}
                isEdit={!!editingPayment}
              />
            )}
          </SummarySection>

          <SummarySection
            title="3. Revisa tu pedido"
            selected={true}
            isExpanded={true}
          >
            <CartView />
          </SummarySection>
        </div>

        <div className="checkout-right">
          <div className="checkout-summary">
            <h3>Resumen de la Orden</h3>
            <div className="summary-details">
              <p>
                <strong>Dirección de envío:</strong> {selectedAddress?.name}
              </p>
              <p>
                <strong>Método de pago:</strong> {selectedPayment?.alias}
              </p>
              <div className="order-costs">
                <p>
                  <strong>Subtotal:</strong> {formatMoney(subtotal)}
                </p>
                <p>
                  <strong>IVA (16%):</strong> {formatMoney(taxAmount)}
                </p>
                <p>
                  <strong>Envío:</strong>{" "}
                  {shippingCost === 0 ? "Gratis" : formatMoney(shippingCost)}
                </p>
                <hr />
                <p>
                  <strong>Total:</strong> {formatMoney(grandTotal)}
                </p>
              </div>
              <p>
                <strong>Fecha estimada de entrega:</strong>{" "}
                {new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            <Button
              className="pay-button"
              disabled={
                !selectedAddress ||
                !selectedPayment ||
                !cartItems ||
                cartItems.length === 0
              }
              title={
                !cartItems || cartItems.length === 0
                  ? "No hay productos en el carrito"
                  : !selectedAddress
                  ? "Selecciona una dirección de envío"
                  : !selectedPayment
                  ? "Selecciona un método de pago"
                  : "Confirmar y realizar el pago"
              }
              onClick={handleCreateOrder}
            >
              Confirmar y Pagar
            </Button>
          </div>
        </div>
      </div>
    )
  );
}

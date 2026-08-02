import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CartView from "../components/Cart/CartView";
import AddressList from "../components/Checkout/Address/AddressList";
import PaymentList from "../components/Checkout/Payment/PaymentList";
import SummarySection from "../components/Checkout/shared/SummarySection";
import Button from "../components/common/Button";
import ErrorMessage from "../components/common/ErrorMessage/ErrorMessage";
import Loading from "../components/common/Loading/Loading";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { shippingRate, freeShipping } from "../constants/shipping";
import { createOrder, updateOrderStatus } from "../services/orderService";
import {
  chargePaymentMethod,
  createPaymentMethod,
  getDefaultPaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from "../services/paymentService";
import {
  createAddress,
  getDefaultShippingAddress,
  getShippingAddresses,
  updateAddress,
} from "../services/shippingService";
import "./Checkout.css";

// Solo se renderizan cuando el usuario elige agregar/editar dirección o
// pago (no hay dirección/pago por defecto, o hace click en "editar") —
// se descargan bajo demanda en vez de con el resto de Checkout.
const AddressForm = lazy(() => import("../components/Checkout/Address/AddressForm"));
const PaymentForm = lazy(() => import("../components/Checkout/Payment/PaymentForm"));

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, total, clearCart } = useCart();

  // --- LÓGICA DE NEGOCIO FINANCIERA ---
  // Cálculos derivados del estado del carrito.
  // Se realizan en cada render para asegurar consistencia.
  const subtotal = typeof total === "number" ? total : 0;
  const TAX_RATE = 0.16; // IVA 16%

  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shippingCost = subtotal >= freeShipping ? 0 : shippingRate;
  const grandTotal = parseFloat(
    (subtotal + taxAmount + shippingCost).toFixed(2)
  );
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
    if (!cartItems || cartItems.length === 0) {
      if (!isOrderFinished) {
        navigate("/cart");
      }
    }
  }, [cartItems, navigate, isOrderFinished]);

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

  // Estados de envío de formularios y de la orden final
  const [addressSubmitError, setAddressSubmitError] = useState(null);
  const [paymentSubmitError, setPaymentSubmitError] = useState(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);

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
   * Persiste la dirección en el backend (POST/PUT /api/addresses) para obtener
   * un ObjectId real, necesario para poder crear la orden más adelante.
   */
  const handleAddressSubmit = async (formData) => {
    setAddressSubmitError(null);

    const payload = {
      name: formData.name,
      address: formData.address1,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
      country: formData.country,
      phone: formData.phone,
      isDefault: !!formData.default,
    };

    try {
      const saved = editingAddress
        ? await updateAddress(editingAddress._id, payload)
        : await createAddress(payload);

      // Combinamos la respuesta real del backend (para tener un _id válido)
      // con los campos que la UI ya usa para mostrar la dirección. El modelo
      // Address del backend no define `name`, así que el campo se descarta
      // silenciosamente al guardar (ver docs/testing.md, defecto D5); lo
      // conservamos aquí desde formData para no perder la etiqueta elegida.
      const viewAddress = {
        ...saved,
        name: formData.name,
        address1: formData.address1,
        address2: formData.address2,
        reference: formData.reference,
        default: saved.isDefault,
      };

      let updatedAddresses;
      let newSelectedAddress = selectedAddress;

      if (editingAddress) {
        updatedAddresses = addresses.map((addr) =>
          addr._id === editingAddress._id ? viewAddress : addr
        );
        if (selectedAddress?._id === editingAddress._id) {
          newSelectedAddress = viewAddress;
        }
      } else {
        updatedAddresses = [...addresses, viewAddress];
        newSelectedAddress = viewAddress;
      }

      setAddresses(updatedAddresses);
      setSelectedAddress(newSelectedAddress);
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressSectionOpen(false);
    } catch (err) {
      setAddressSubmitError(
        "No se pudo guardar la dirección. Verifica los datos e intenta de nuevo."
      );
    }
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
   * Persiste el método de pago en el backend (POST/PUT /api/payment-methods)
   * para obtener un ObjectId real, necesario para poder crear la orden.
   * El formulario solo soporta tarjetas, por lo que el tipo se fija a "credit_card".
   */
  const handlePaymentSubmit = async (formData) => {
    setPaymentSubmitError(null);

    const payload = {
      user: user?.id,
      type: "credit_card",
      // FIX: PaymentForm pide el número con guiones ("1234-5678-9012-3456",
      // 19 caracteres) pero el validador del backend (updatePaymentValidation
      // en paymentMethodRoutes.js) exige máximo 16 caracteres. Se envían solo
      // los dígitos reales de la tarjeta, sin el formato visual.
      cardNumber: formData.cardNumber.replace(/\D/g, ""),
      cardHolderName: formData.placeHolder,
      expiryDate: formData.expiryDate,
      cvv: formData.cvv,
      isDefault: !!formData.isDefault,
    };

    try {
      const saved = editingPayment
        ? await updatePaymentMethod(editingPayment._id, payload)
        : await createPaymentMethod(payload);

      // Combinamos la respuesta real del backend (para tener un _id válido)
      // con los campos que la UI ya usa para mostrar el método de pago.
      const viewPayment = {
        ...saved,
        alias: formData.alias,
        placeHolder: formData.placeHolder,
      };

      let updatedPayments;
      let newSelectedPayment = selectedPayment;

      if (editingPayment) {
        updatedPayments = payments.map((pay) =>
          pay._id === editingPayment._id ? viewPayment : pay
        );
        if (selectedPayment?._id === editingPayment._id) {
          newSelectedPayment = viewPayment;
        }
      } else {
        updatedPayments = [...payments, viewPayment];
        newSelectedPayment = viewPayment;
      }

      setPayments(updatedPayments);
      setSelectedPayment(newSelectedPayment);
      setShowPaymentForm(false);
      setEditingPayment(null);
      setPaymentSectionOpen(false);
    } catch (err) {
      setPaymentSubmitError(
        "No se pudo guardar el método de pago. Verifica los datos e intenta de nuevo."
      );
    }
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
   * Crea la orden real vía POST /api/orders y, si tiene éxito, redirige a la
   * confirmación (que recibe la orden por router state). Bloquea envíos
   * duplicados mientras la petición está en curso.
   */
  const handleCreateOrder = async () => {
    if (
      orderSubmitting ||
      !selectedAddress ||
      !selectedPayment ||
      !cartItems ||
      cartItems.length === 0
    ) {
      return;
    }

    setOrderSubmitting(true);
    setOrderError(null);

    const orderItems = cartItems.map((item) => ({
      name: item.product.name,
      size: item.size ?? null,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));

    try {
      const charge = await chargePaymentMethod(selectedPayment._id, grandTotal);
      if (charge.status === "declined") {
        setOrderError(
          "Tu pago fue rechazado. Intenta con otro método de pago."
        );
        setOrderSubmitting(false);
        return;
      }

      const backendOrder = await createOrder({
        user: user?.id,
        products: cartItems.map((item) => ({
          productId: item.product._id,
          size: item.size ?? null,
          quantity: item.quantity,
          price: item.product.price,
        })),
        address: selectedAddress._id,
        paymentMethod: selectedPayment._id,
        totalPrice: grandTotal,
        shippingCost,
      });

      // La orden ya existe en este punto; si esta actualización falla no debe
      // impedir que el usuario llegue a la confirmación.
      let orderStatus = backendOrder.status || "pending";
      try {
        const updated = await updateOrderStatus(backendOrder._id, {
          status: "processing",
          paymentStatus: "paid",
        });
        orderStatus = updated.status || orderStatus;
      } catch (statusErr) {
        // no-op: la orden se creó correctamente, solo no se marcó como pagada
      }

      const order = {
        id: backendOrder._id,
        date: backendOrder.createdAt || new Date().toISOString(),
        items: orderItems,
        subtotal,
        tax: taxAmount,
        shipping: shippingCost,
        total: grandTotal,
        shippingAddress: selectedAddress,
        paymentMethod: selectedPayment,
        status: orderStatus,
      };

      setIsOrderFinished(true);
      clearCart();
      navigate("/order-confirmation", { state: { order } });
    } catch (err) {
      const backendMessage = err?.original?.response?.data?.message;
      setOrderError(
        backendMessage ||
        "No se pudo confirmar tu pedido. Verifica tus datos e intenta de nuevo."
      );
      setOrderSubmitting(false);
    }
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
            data-testid="checkout-address-section"
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
            {addressSubmitError && (
              <ErrorMessage data-testid="checkout-address-error">
                {addressSubmitError}
              </ErrorMessage>
            )}
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
              <Suspense fallback={<Loading>Cargando formulario...</Loading>}>
                <AddressForm
                  onSubmit={handleAddressSubmit}
                  onCancel={handleCancelAddress}
                  initialValues={editingAddress || {}}
                  isEdit={!!editingAddress}
                />
              </Suspense>
            )}
          </SummarySection>

          <SummarySection
            title="2. Método de pago"
            selected={selectedPayment}
            data-testid="checkout-payment-section"
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
            {paymentSubmitError && (
              <ErrorMessage data-testid="checkout-payment-error">
                {paymentSubmitError}
              </ErrorMessage>
            )}
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
              <Suspense fallback={<Loading>Cargando formulario...</Loading>}>
                <PaymentForm
                  onSubmit={handlePaymentSubmit}
                  onCancel={handleCancelPayment}
                  initialValues={editingPayment || {}}
                  isEdit={!!editingPayment}
                />
              </Suspense>
            )}
          </SummarySection>

          <SummarySection
            title="3. Revisa tu pedido"
            selected={true}
            isExpanded={true}
            data-testid="checkout-review-section"
          >
            <CartView />
          </SummarySection>
        </div>

        <div className="checkout-right">
          <div className="checkout-summary" data-testid="checkout-order-summary">
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
                <p data-testid="checkout-total">
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
            {orderError && (
              <ErrorMessage data-testid="checkout-order-error">
                {orderError}
              </ErrorMessage>
            )}
            <Button
              className="pay-button"
              disabled={
                orderSubmitting ||
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
              data-testid="checkout-confirm-button"
            >
              {orderSubmitting ? "Procesando..." : "Confirmar y Pagar"}
            </Button>
          </div>
        </div>
      </div>
    )
  );
}

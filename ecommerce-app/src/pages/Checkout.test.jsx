import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import Checkout from "./Checkout";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import {
  getShippingAddresses,
  getDefaultShippingAddress,
} from "../services/shippingService";
import {
  getPaymentMethods,
  getDefaultPaymentMethod,
} from "../services/paymentService";
import { createOrder } from "../services/orderService";
import * as cartService from "../services/cartService";

jest.mock("../services/shippingService");
jest.mock("../services/paymentService");
jest.mock("../services/orderService");
jest.mock("../services/cartService");

const ADDRESS = {
  _id: "addr-1",
  name: "Casa",
  address: "Av. Siempre Viva 123",
  city: "CDMX",
  state: "CDMX",
  postalCode: "01000",
  country: "México",
  phone: "5555555555",
  isDefault: true,
};

const PAYMENT = {
  _id: "pay-1",
  alias: "Mi tarjeta",
  cardNumber: "4111111111111111",
  cardHolderName: "Juan Pérez",
  expiryDate: "12/28",
  isDefault: true,
};

const PRODUCT = {
  _id: "prod-1",
  name: "Teclado Mecánico",
  price: 100,
  imageURL: "https://example.com/teclado.png",
};

function buildFakeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }),
  );
  return `${header}.${body}.fake-signature`;
}

function ConfirmationStub() {
  const location = useLocation();
  const order = location.state?.order;
  if (!order) return <div>Sin orden</div>;
  return (
    <div>
      <p data-testid="confirmation-order-id">{order.id}</p>
      <p data-testid="confirmation-item-subtotal">
        {order.items[0].subtotal}
      </p>
    </div>
  );
}

function seedAuthenticatedUser() {
  localStorage.setItem(
    "authToken",
    buildFakeToken({ userId: "user-1", name: "Juan", role: "customer" }),
  );
}

function seedCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
}

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={["/checkout"]}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<div>Página de carrito</div>} />
            <Route
              path="/order-confirmation"
              element={<ConfirmationStub />}
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Checkout", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    seedAuthenticatedUser();
    // El usuario está autenticado, así que CartContext intenta sincronizar
    // con el backend; lo simulamos como "sin carrito remoto todavía" para
    // no depender de red real ni ensuciar la salida con errores de axios.
    cartService.getCartByUser.mockRejectedValue({ kind: "NOT_FOUND" });
    cartService.createCart.mockResolvedValue({ _id: "server-cart-1" });
    cartService.replaceCart.mockResolvedValue({ _id: "server-cart-1" });
    cartService.clearCart.mockResolvedValue(undefined);
  });

  test("calcula subtotal, IVA, envío y total a partir del carrito", async () => {
    seedCart([{ product: PRODUCT, quantity: 2 }]);
    getShippingAddresses.mockResolvedValue([]);
    getDefaultShippingAddress.mockResolvedValue(null);
    getPaymentMethods.mockResolvedValue([]);
    getDefaultPaymentMethod.mockResolvedValue(null);

    renderCheckout();

    // subtotal = 100*2 = 200; IVA 16% = 32; envío (subtotal<1000) = 350; total = 582
    const total = await screen.findByTestId("checkout-total");
    expect(total).toHaveTextContent("582");
  });

  test('el botón de confirmar está deshabilitado sin dirección ni método de pago seleccionados', async () => {
    seedCart([{ product: PRODUCT, quantity: 1 }]);
    getShippingAddresses.mockResolvedValue([]);
    getDefaultShippingAddress.mockResolvedValue(null);
    getPaymentMethods.mockResolvedValue([]);
    getDefaultPaymentMethod.mockResolvedValue(null);

    renderCheckout();

    expect(await screen.findByTestId("checkout-confirm-button")).toBeDisabled();
  });

  test("crea la orden vía POST /api/orders con el payload correcto y redirige a la confirmación", async () => {
    seedCart([{ product: PRODUCT, quantity: 2 }]);
    getShippingAddresses.mockResolvedValue([ADDRESS]);
    getDefaultShippingAddress.mockResolvedValue(ADDRESS);
    getPaymentMethods.mockResolvedValue([PAYMENT]);
    getDefaultPaymentMethod.mockResolvedValue(PAYMENT);
    createOrder.mockResolvedValue({
      _id: "order-123",
      status: "pending",
      createdAt: "2026-07-02T00:00:00.000Z",
    });

    renderCheckout();

    const confirmButton = await screen.findByTestId("checkout-confirm-button");
    await waitFor(() => expect(confirmButton).not.toBeDisabled());

    userEvent.click(confirmButton);

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));

    expect(createOrder).toHaveBeenCalledWith({
      user: "user-1",
      products: [{ productId: "prod-1", quantity: 2, price: 100 }],
      address: "addr-1",
      paymentMethod: "pay-1",
      totalPrice: 582,
      shippingCost: 350,
    });

    expect(
      await screen.findByTestId("confirmation-order-id"),
    ).toHaveTextContent("order-123");
    // Regression: item.price ya no es undefined -> subtotal no es NaN
    expect(screen.getByTestId("confirmation-item-subtotal")).toHaveTextContent(
      "200",
    );
  });

  test("vacía el carrito y guarda la orden en localStorage tras confirmar", async () => {
    seedCart([{ product: PRODUCT, quantity: 1 }]);
    getShippingAddresses.mockResolvedValue([ADDRESS]);
    getDefaultShippingAddress.mockResolvedValue(ADDRESS);
    getPaymentMethods.mockResolvedValue([PAYMENT]);
    getDefaultPaymentMethod.mockResolvedValue(PAYMENT);
    createOrder.mockResolvedValue({
      _id: "order-456",
      status: "pending",
      createdAt: "2026-07-02T00:00:00.000Z",
    });

    renderCheckout();

    const confirmButton = await screen.findByTestId("checkout-confirm-button");
    await waitFor(() => expect(confirmButton).not.toBeDisabled());
    userEvent.click(confirmButton);

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("cart"))).toEqual([]);
    });

    const savedOrders = JSON.parse(localStorage.getItem("orders"));
    expect(savedOrders).toHaveLength(1);
    expect(savedOrders[0].id).toBe("order-456");
  });

  test("muestra un error y reactiva el botón si la creación de la orden falla", async () => {
    seedCart([{ product: PRODUCT, quantity: 1 }]);
    getShippingAddresses.mockResolvedValue([ADDRESS]);
    getDefaultShippingAddress.mockResolvedValue(ADDRESS);
    getPaymentMethods.mockResolvedValue([PAYMENT]);
    getDefaultPaymentMethod.mockResolvedValue(PAYMENT);
    createOrder.mockRejectedValue({ kind: "SERVER_ERROR", status: 500 });

    renderCheckout();

    const confirmButton = await screen.findByTestId("checkout-confirm-button");
    await waitFor(() => expect(confirmButton).not.toBeDisabled());
    userEvent.click(confirmButton);

    expect(
      await screen.findByTestId("checkout-order-error"),
    ).toBeInTheDocument();
    await waitFor(() => expect(confirmButton).not.toBeDisabled());
    // El carrito no debió vaciarse si la orden falló
    expect(JSON.parse(localStorage.getItem("cart"))).toHaveLength(1);
  });

  test("no permite crear órdenes duplicadas con doble clic", async () => {
    seedCart([{ product: PRODUCT, quantity: 1 }]);
    getShippingAddresses.mockResolvedValue([ADDRESS]);
    getDefaultShippingAddress.mockResolvedValue(ADDRESS);
    getPaymentMethods.mockResolvedValue([PAYMENT]);
    getDefaultPaymentMethod.mockResolvedValue(PAYMENT);
    let resolveOrder;
    createOrder.mockReturnValue(
      new Promise((resolve) => {
        resolveOrder = resolve;
      }),
    );

    renderCheckout();

    const confirmButton = await screen.findByTestId("checkout-confirm-button");
    await waitFor(() => expect(confirmButton).not.toBeDisabled());

    userEvent.click(confirmButton);
    userEvent.click(confirmButton);
    userEvent.click(confirmButton);

    resolveOrder({
      _id: "order-789",
      status: "pending",
      createdAt: "2026-07-02T00:00:00.000Z",
    });

    await waitFor(() => {
      expect(screen.getByTestId("confirmation-order-id")).toBeInTheDocument();
    });

    expect(createOrder).toHaveBeenCalledTimes(1);
  });

  test("redirige a /cart si se entra al checkout con el carrito vacío", async () => {
    seedCart([]);
    getShippingAddresses.mockResolvedValue([]);
    getDefaultShippingAddress.mockResolvedValue(null);
    getPaymentMethods.mockResolvedValue([]);
    getDefaultPaymentMethod.mockResolvedValue(null);

    renderCheckout();

    expect(await screen.findByText("Página de carrito")).toBeInTheDocument();
  });
});

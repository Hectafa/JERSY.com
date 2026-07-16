import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Orders from "./Orders";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";
import { getOrdersByUser } from "../services/orderService";

jest.mock("../services/orderService");

function buildFakeToken(payload) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `${header}.${body}.fake-signature`;
}

function seedAuthenticatedUser() {
  localStorage.setItem(
    "authToken",
    buildFakeToken({ userId: "user-1", name: "Ada Lovelace", role: "customer" }),
  );
}

const buildOrder = (overrides = {}) => ({
  _id: "order-1",
  createdAt: "2026-06-01T10:00:00.000Z",
  products: [
    { productId: { _id: "p1", name: "Teclado Mecánico" }, price: 100, quantity: 2 },
  ],
  tax: 32,
  shippingCost: 0,
  totalPrice: 232,
  address: {
    name: "Ada Lovelace",
    address: "Calle Falsa 123",
    city: "CDMX",
    postalCode: "01000",
    country: "México",
  },
  paymentMethod: { cardHolderName: "Ada Lovelace", cardNumber: "4111111111111111" },
  status: "pending",
  ...overrides,
});

function renderOrdersRoute() {
  return render(
    <MemoryRouter initialEntries={["/orders"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Página de login</div>} />
          <Route
            path="/orders"
            element={
              <ProtectedRoute redirectTo="/login">
                <Orders />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Orders (página)", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    seedAuthenticatedUser();
  });

  test("muestra un estado vacío cuando el usuario no tiene pedidos", async () => {
    getOrdersByUser.mockResolvedValue([]);

    renderOrdersRoute();

    expect(
      await screen.findByText("No tienes pedidos todavía"),
    ).toBeInTheDocument();
  });

  test("lista los pedidos devueltos por el backend", async () => {
    getOrdersByUser.mockResolvedValue([
      buildOrder({ _id: "order-1" }),
      buildOrder({ _id: "order-2" }),
    ]);

    renderOrdersRoute();

    expect(await screen.findByText("#order-1")).toBeInTheDocument();
    expect(screen.getByText("#order-2")).toBeInTheDocument();
    expect(screen.getByText("Tienes 2 pedidos")).toBeInTheDocument();
    expect(getOrdersByUser).toHaveBeenCalledWith("user-1");
  });

  test("selecciona el primer pedido de la lista por defecto y muestra su detalle", async () => {
    getOrdersByUser.mockResolvedValue([
      buildOrder({ _id: "order-new", totalPrice: 232 }),
      buildOrder({ _id: "order-old", totalPrice: 100 }),
    ]);

    renderOrdersRoute();

    expect(await screen.findByText("Pedido #order-new")).toBeInTheDocument();
  });

  test("al hacer clic en un pedido se muestra su detalle (productos, dirección, pago)", async () => {
    getOrdersByUser.mockResolvedValue([
      buildOrder({ _id: "order-1" }),
      buildOrder({
        _id: "order-2",
        products: [
          { productId: { _id: "p2", name: "Mouse Inalámbrico" }, price: 50, quantity: 1 },
        ],
        address: {
          name: "Grace Hopper",
          address: "Av. Siempre Viva 456",
          city: "Guadalajara",
          postalCode: "44100",
          country: "México",
        },
      }),
    ]);

    renderOrdersRoute();

    userEvent.click(await screen.findByText("#order-2"));

    expect(await screen.findByText("Pedido #order-2")).toBeInTheDocument();
    expect(screen.getByText("Mouse Inalámbrico")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  });

  test("muestra 'Sin dirección registrada' cuando el pedido no tiene dirección", async () => {
    getOrdersByUser.mockResolvedValue([buildOrder({ address: null })]);

    renderOrdersRoute();

    expect(
      await screen.findByText("Sin dirección registrada."),
    ).toBeInTheDocument();
  });

  test("muestra un error si falla la carga de pedidos", async () => {
    getOrdersByUser.mockRejectedValue({ kind: "SERVER_ERROR" });

    renderOrdersRoute();

    expect(
      await screen.findByText("No se pudieron cargar tus pedidos."),
    ).toBeInTheDocument();
  });
});

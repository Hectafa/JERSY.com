import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Orders from "./Orders";

const buildOrder = (overrides = {}) => ({
  id: "order-1",
  date: "2026-06-01T10:00:00.000Z",
  items: [{ name: "Teclado Mecánico", price: 100, quantity: 2, subtotal: 200 }],
  subtotal: 200,
  tax: 32,
  shipping: 0,
  total: 232,
  shippingAddress: {
    name: "Ada Lovelace",
    address1: "Calle Falsa 123",
    city: "CDMX",
    postalCode: "01000",
    country: "México",
  },
  paymentMethod: { alias: "Tarjeta ****1111", cardNumber: "4111111111111111" },
  status: "pending",
  ...overrides,
});

function seedOrders(orders) {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function renderOrders() {
  return render(
    <MemoryRouter>
      <Orders />
    </MemoryRouter>,
  );
}

describe("Orders (página)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("muestra un estado vacío cuando no hay pedidos guardados", () => {
    renderOrders();

    expect(screen.getByText("No tienes pedidos guardados")).toBeInTheDocument();
  });

  test("lista los pedidos guardados en localStorage", () => {
    seedOrders([buildOrder({ id: "order-1" }), buildOrder({ id: "order-2" })]);

    renderOrders();

    expect(screen.getByText("#order-1")).toBeInTheDocument();
    expect(screen.getByText("#order-2")).toBeInTheDocument();
    expect(screen.getByText("Tienes 2 pedidos guardados en este dispositivo")).toBeInTheDocument();
  });

  test("ordena los pedidos del más reciente al más antiguo", () => {
    seedOrders([
      buildOrder({ id: "order-old", date: "2026-01-01T00:00:00.000Z" }),
      buildOrder({ id: "order-new", date: "2026-06-01T00:00:00.000Z" }),
    ]);

    renderOrders();

    const orderButtons = screen.getAllByRole("button", { name: /order-/ });
    expect(orderButtons[0]).toHaveTextContent("order-new");
    expect(orderButtons[1]).toHaveTextContent("order-old");
  });

  test("selecciona el primer pedido (el más reciente) por defecto y muestra su detalle", () => {
    seedOrders([
      buildOrder({ id: "order-old", date: "2026-01-01T00:00:00.000Z", total: 100 }),
      buildOrder({ id: "order-new", date: "2026-06-01T00:00:00.000Z", total: 232 }),
    ]);

    renderOrders();

    expect(screen.getByText("Pedido #order-new")).toBeInTheDocument();
  });

  test("al hacer clic en un pedido se muestra su detalle (productos, dirección, pago)", () => {
    seedOrders([
      buildOrder({ id: "order-1", date: "2026-06-01T00:00:00.000Z" }),
      buildOrder({
        id: "order-2",
        date: "2026-05-01T00:00:00.000Z",
        items: [{ name: "Mouse Inalámbrico", price: 50, quantity: 1, subtotal: 50 }],
        shippingAddress: {
          name: "Grace Hopper",
          address1: "Av. Siempre Viva 456",
          city: "Guadalajara",
          postalCode: "44100",
          country: "México",
        },
      }),
    ]);

    renderOrders();

    userEvent.click(screen.getByText("#order-2"));

    expect(screen.getByText("Pedido #order-2")).toBeInTheDocument();
    expect(screen.getByText("Mouse Inalámbrico")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
  });

  test("muestra 'Sin dirección registrada' cuando el pedido no tiene shippingAddress", () => {
    seedOrders([buildOrder({ shippingAddress: null })]);

    renderOrders();

    expect(screen.getByText("Sin dirección registrada.")).toBeInTheDocument();
  });
});

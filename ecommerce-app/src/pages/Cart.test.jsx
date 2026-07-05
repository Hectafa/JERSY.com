import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Cart from "./Cart";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

const product = (overrides = {}) => ({
  _id: "prod-1",
  name: "Teclado Mecánico",
  price: 100,
  imageURL: "https://placehold.co/600x400",
  ...overrides,
});

function renderCart() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <Cart />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function seedCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
}

describe("Cart (página)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("muestra el estado de carrito vacío cuando no hay items", () => {
    renderCart();

    expect(screen.getByTestId("cart-empty")).toBeInTheDocument();
    expect(screen.getByText("Tu carrito está vacío")).toBeInTheDocument();
  });

  test("renderiza los items del carrito y el subtotal correcto", () => {
    seedCart([
      { product: product({ _id: "prod-1", price: 100 }), quantity: 2 },
      { product: product({ _id: "prod-2", name: "Mouse", price: 50 }), quantity: 1 },
    ]);

    renderCart();

    expect(screen.getByTestId("cart-item-prod-1")).toBeInTheDocument();
    expect(screen.getByTestId("cart-item-prod-2")).toBeInTheDocument();
    // (100*2) + (50*1) = 250
    expect(screen.getByTestId("cart-subtotal")).toHaveTextContent("$250.00");
  });

  test("el botón de pago está habilitado cuando hay productos", () => {
    seedCart([{ product: product(), quantity: 1 }]);

    renderCart();

    expect(screen.getByTestId("cart-checkout-button")).not.toBeDisabled();
  });

  test("incrementar la cantidad actualiza el subtotal", () => {
    seedCart([{ product: product({ price: 100 }), quantity: 1 }]);

    renderCart();

    userEvent.click(screen.getByTestId("cart-item-increase-prod-1"));

    expect(screen.getByTestId("cart-item-quantity-prod-1")).toHaveTextContent("2");
    expect(screen.getByTestId("cart-subtotal")).toHaveTextContent("$200.00");
  });

  test("decrementar la cantidad a 0 elimina el producto y muestra el carrito vacío", () => {
    seedCart([{ product: product(), quantity: 1 }]);

    renderCart();

    userEvent.click(screen.getByTestId("cart-item-decrease-prod-1"));

    expect(screen.getByTestId("cart-empty")).toBeInTheDocument();
  });

  test("eliminar un producto lo quita de la lista", () => {
    seedCart([
      { product: product({ _id: "prod-1" }), quantity: 1 },
      { product: product({ _id: "prod-2", name: "Mouse", price: 50 }), quantity: 1 },
    ]);

    renderCart();

    userEvent.click(screen.getByTestId("cart-item-remove-prod-1"));

    expect(screen.queryByTestId("cart-item-prod-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("cart-item-prod-2")).toBeInTheDocument();
  });

  test("vaciar el carrito muestra el estado vacío", () => {
    seedCart([{ product: product(), quantity: 1 }]);

    renderCart();

    userEvent.click(screen.getByTitle("Vaciar carrito"));

    expect(screen.getByTestId("cart-empty")).toBeInTheDocument();
  });
});

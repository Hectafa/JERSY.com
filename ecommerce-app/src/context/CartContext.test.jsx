import { renderHook, act } from "@testing-library/react";
import { AuthProvider } from "./AuthContext";
import { CartProvider, useCart } from "./CartContext";

// Sin token en localStorage => isAuthenticated=false => CartContext no
// intenta sincronizar con el backend (Fase 4 de Checkout usa mocks aparte
// para el caso autenticado). Esto nos deja probar la lógica pura del
// carrito (agregar/quitar/actualizar/calcular totales) sin red.
function wrapper({ children }) {
  return (
    <AuthProvider>
      <CartProvider>{children}</CartProvider>
    </AuthProvider>
  );
}

const product = (overrides = {}) => ({
  _id: "prod-1",
  name: "Teclado Mecánico",
  price: 100,
  stock: 10,
  ...overrides,
});

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("el carrito inicia vacío", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.total).toBe(0);
  });

  test("addItem agrega un producto nuevo con cantidad 1 por defecto", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addItem(product());
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      product: product(),
      quantity: 1,
    });
    expect(result.current.count).toBe(1);
  });

  test("addItem incrementa la cantidad si el producto ya está en el carrito", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addItem(product(), 1);
    });
    await act(async () => {
      await result.current.addItem(product(), 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.count).toBe(3);
  });

  test("updateQuantity actualiza la cantidad de un producto existente", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addItem(product(), 1);
    });
    await act(async () => {
      await result.current.updateQuantity("prod-1", 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
  });

  test("updateQuantity con cantidad menor a 1 elimina el producto del carrito", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addItem(product(), 1);
    });
    await act(async () => {
      await result.current.updateQuantity("prod-1", 0);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.count).toBe(0);
  });

  test("removeItem elimina un producto del carrito", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addItem(product({ _id: "prod-1" }));
    });
    await act(async () => {
      await result.current.addItem(product({ _id: "prod-2", name: "Mouse" }));
    });
    await act(async () => {
      await result.current.removeItem("prod-1");
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product._id).toBe("prod-2");
  });

  test("calcula el subtotal/total como precio * cantidad sumado por artículo", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addItem(product({ _id: "prod-1", price: 100 }), 2);
    });
    await act(async () => {
      await result.current.addItem(
        product({ _id: "prod-2", price: 50, name: "Mouse" }),
        3,
      );
    });

    // (100*2) + (50*3) = 350
    expect(result.current.total).toBe(350);
    expect(result.current.count).toBe(5);
  });

  test("clearCart deja el carrito vacío", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addItem(product());
    });
    await act(async () => {
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  test("persiste el carrito en localStorage tras cada cambio", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await result.current.addItem(product(), 2);
    });

    const stored = JSON.parse(localStorage.getItem("cart"));
    expect(stored).toHaveLength(1);
    expect(stored[0].quantity).toBe(2);
    expect(stored[0].product._id).toBe("prod-1");
  });

  test("restaura el carrito guardado en localStorage al montar", () => {
    localStorage.setItem(
      "cart",
      JSON.stringify([{ product: product(), quantity: 4 }]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(4);
  });
});

import { createContext, useCallback, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";
import {
  getCartByUser,
  createCart,
  replaceCart,
  clearCart as serviceClearCart,
} from "../services/cartService";
import { readLocalJSON, writeLocalJSON } from "../utils/storageHelpers";

const CartContext = createContext();

export function CartProvider({ children }) {
  const CART_STORAGE_KEY = "cart";

  const { isAuthenticated, user } = useAuth();
  const [cartId, setCartId] = useState(null);
  const [items, setItems] = useState(() => {
  return readLocalJSON(CART_STORAGE_KEY) ?? [];
});

  const [loading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    writeLocalJSON(CART_STORAGE_KEY, items);
  }, [items]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCartId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const serverCart = await getCartByUser(user.id);
        if (cancelled) return;
        setCartId(serverCart._id);
      } catch (error) {
        if (cancelled) return;
        if (error.kind !== "NOT_FOUND") {
          setError(error.kind ?? "SERVER_ERROR");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  const count = useMemo(
    () => (items || []).reduce((acc, it) => acc + it.quantity, 0),
    [items],
  );

  const total = useMemo(
    () => (items || []).reduce((acc, it) => acc + it.quantity * it.product.price, 0),
    [items],
  );

  const syncWithApi = useCallback(
    async (nextItems) => {
      if (!isAuthenticated) return;

      // Carrito vacío = el usuario no tiene un carrito
      if (nextItems.length === 0) {
        if (cartId) {
          await serviceClearCart(cartId);
          setCartId(null);
        }
      }

      const products = nextItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));

      if (!cartId) {
        const created = await createCart(user.id, products);
        setCartId(created._id);
      } else {
        await replaceCart(cartId, user.id, products);
      }
    },
    [isAuthenticated, cartId, user],
  );

  const changeItems = useCallback(
    (nextItems) => {
      setItems(nextItems);
      setError(null);
      syncWithApi(nextItems).catch((err) => {
        setError(err.kind ?? "SERVER_ERROR");
      });
    },
    [syncWithApi],
  );

  const removeItem = useCallback(
    async (itemId) => {
      const actualItems = items.filter((item) => item.product._id !== itemId);
      changeItems(actualItems);
    },
    [items, changeItems],
  );

  const addItem = useCallback(
    async (product, quantity = 1) => {
      const existingProduct = items.find(
        (item) => item.product._id === product._id,
      );

      const nextItems = existingProduct
        ? items.map((item) =>
            item.product._id === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [...items, { product, quantity }];

      changeItems(nextItems);
    },
    [items, changeItems],
  );

  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      if (quantity < 1) {
        removeItem(itemId);
        return;
      }

      const nextItems = items.map((item) =>
        item.product._id === itemId ? { ...item, quantity } : item,
      );

      changeItems(nextItems);
    },
    [items, changeItems, removeItem],
  );

  const clearCart = useCallback(() => changeItems([]), [changeItems]);

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      loading,
      error,
    }),
    [items, count, total, addItem, updateQuantity, removeItem, clearCart, loading, error],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart debe ser usado dentro de CartProvider");
  return context;
}
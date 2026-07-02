import apiClient from "./apiClient";

// GET    /cart   → Todos los carritos de compra
const getCart = async () => {
    const response = await apiClient.get("/cart");
    return response.data;
};

// GET    /cart/user/:id   → carrito del usuario (404 = aún no tiene)
const getCartByUser = async (userId) => {
    const response = await apiClient.get(`/cart/user/${userId}`);
    return response.data;
};

// POST   /cart            → crea   { user, products }
const createCart = async (userId, products) => {
    const response = await apiClient.post("/cart", { user: userId, products });
    return response.data;
};

// PUT    /cart/:id        → reemplazo total { user, products }
const replaceCart = async (cartId, userId, products) => {
    const response = await apiClient.put(`/cart/${cartId}`, {
        user: userId,
        products,
    });
    return response.data;
};

// DELETE /cart/:id        → elimina
const clearCart = async (cartId) => {
    await apiClient.delete(`/cart/${cartId}`);
};

export { getCart, getCartByUser, createCart, replaceCart, clearCart };
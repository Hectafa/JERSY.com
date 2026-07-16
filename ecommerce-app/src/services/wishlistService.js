import apiClient from "./apiClient";

// GET /wishlist/user/:id → wishlist del usuario (null si aún no tiene una)
const getWishlistByUser = async (userId) => {
  try {
    const response = await apiClient.get(`/wishlist/user/${userId}`);
    return response.data;
  } catch (error) {
    if (error.kind === "NOT_FOUND") return null;
    throw error;
  }
};

// POST /wishlist → agrega un producto (crea la wishlist si no existe)
const addProductToWishlist = async (userId, productId) => {
  const response = await apiClient.post("/wishlist", { userId, productId });
  return response.data;
};

// DELETE /wishlist/:id/product → quita un producto de la wishlist
const removeProductFromWishlist = async (wishlistId, productId) => {
  const response = await apiClient.delete(`/wishlist/${wishlistId}/product`, {
    data: { productId },
  });
  return response.data;
};

export { getWishlistByUser, addProductToWishlist, removeProductFromWishlist };

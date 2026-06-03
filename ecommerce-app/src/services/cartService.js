import apiClient from "./apiClient";

const getCart = async () => {
    return apiClient.get("/cart");
};

// {
//   user:"ASdasdasdasdsad"
//   products:[
//     product:"1asde3432r32422",
//     quantity:1
//   ]
// }
const addItem = async (userId, products) => {
    return apiClient.post("/cart", { user: userId, products });
};

const updateQuantity = async (itemId, quantity) => {
    return apiClient.patch(`/cart/${itemId}`, { quantity });
};

const removeItem = async (itemId) => {
    return apiClient.delete(`/cart/${itemId}`);
};

const clearCart = async () => {
    return apiClient.delete("/cart");
};

export { getCart, addItem, updateQuantity, removeItem, clearCart };
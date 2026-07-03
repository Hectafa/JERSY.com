import apiClient from "./apiClient";

// POST /orders → crea una orden { user, products, address, paymentMethod, totalPrice, shippingCost }
export async function createOrder(orderData) {
  const response = await apiClient.post("/orders", orderData);
  return response.data;
}

// GET /orders/:id → detalle de una orden
export async function getOrderById(id) {
  const response = await apiClient.get(`/orders/${id}`);
  return response.data;
}

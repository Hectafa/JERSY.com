import apiClient from "./apiClient";

export async function getPaymentMethods() {
  const { data } = await apiClient.get("/payment-methods/me");
  return data || [];
}

export async function getDefaultPaymentMethod() {
  const methods = await getPaymentMethods();
  return methods.find((m) => m.isDefault) || methods[0] || null;
}

export async function createPaymentMethod(paymentData) {
  const { data } = await apiClient.post("/payment-methods", paymentData);
  return data;
}

export async function updatePaymentMethod(id, paymentData) {
  const { data } = await apiClient.put(`/payment-methods/${id}`, paymentData);
  return data;
}

export async function deletePaymentMethod(id) {
  await apiClient.delete(`/payment-methods/${id}`);
}

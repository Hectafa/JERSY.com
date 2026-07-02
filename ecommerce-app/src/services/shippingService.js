import apiClient from "./apiClient";

export async function getShippingAddresses() {
  const { data } = await apiClient.get("/addresses");
  return data.addresses || [];
}

export async function getDefaultShippingAddress() {
  const addresses = await getShippingAddresses();
  return addresses.find((a) => a.isDefault) || addresses[0] || null;
}

export async function createAddress(addressData) {
  const { data } = await apiClient.post("/addresses", addressData);
  return data;
}

export async function updateAddress(id, addressData) {
  const { data } = await apiClient.put(`/addresses/${id}`, addressData);
  return data;
}

export async function deleteAddress(id) {
  await apiClient.delete(`/addresses/${id}`);
}

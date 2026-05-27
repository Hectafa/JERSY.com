import apiClient from "./apiClient";

export async function getAllProducts() {
  const response = await apiClient.get("/products");
  return response.data;
}

export async function getProductById(id) {
  const response = await apiClient.get("/products/" + id);
  return response.data;
}

export async function searchProducts(filters = {}) {
  const params = {};
  if (filters.q) params.q = filters.q;
  if (filters.category) params.category = filters.category;
  if (filters.minPrice != null && !Number.isNaN(filters.minPrice)) {
    params.minPrice = filters.minPrice;
  }
  if (filters.maxPrice != null && !Number.isNaN(filters.maxPrice)) {
    params.maxPrice = filters.maxPrice;
  }
  if (typeof filters.inStock === "boolean") params.inStock = filters.inStock;
  if (filters.sort) params.sort = filters.sort;
  if (filters.order) params.order = filters.order;

  const response = await apiClient.get(`/products/search`, { params });
  return response.data;
}

export async function createProduct(data) {
  const response = await apiClient.post("/products", data);
  return response.data;
}

export async function updateProduct(id, data) {
  const response = await apiClient.put(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id) {
  await apiClient.delete(`/products/${id}`);
}

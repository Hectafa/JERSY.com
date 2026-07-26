import apiClient from "./apiClient";
import { clearCache, getOrFetch } from "./cache";

export async function getAllProducts() {
  return getOrFetch("products:all", async () => {
    const response = await apiClient.get("/products");
    return response.data;
  });
}

export async function getProductById(id) {
  return getOrFetch(`products:${id}`, async () => {
    const response = await apiClient.get("/products/" + id);
    return response.data;
  });
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
  clearCache();
  return response.data;
}

export async function updateProduct(id, data) {
  const response = await apiClient.put(`/products/${id}`, data);
  clearCache();
  return response.data;
}

export async function deleteProduct(id) {
  await apiClient.delete(`/products/${id}`);
  clearCache();
}

export async function uploadProductImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await apiClient.post("/products/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

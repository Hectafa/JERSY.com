import apiClient from "./apiClient";
import { clearCache } from "./cache";
import {
  getAllProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./productsService";

jest.mock("./apiClient");

describe("productsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCache();
  });

  test("getAllProducts llama GET /products y devuelve response.data", async () => {
    apiClient.get.mockResolvedValue({ data: { products: [], pagination: {} } });

    const result = await getAllProducts();

    expect(apiClient.get).toHaveBeenCalledWith("/products", { params: { limit: 100 } });
    expect(result).toEqual({ products: [], pagination: {} });
  });

  test("getProductById llama GET /products/:id", async () => {
    apiClient.get.mockResolvedValue({ data: { _id: "p1", name: "Laptop" } });

    const result = await getProductById("p1");

    expect(apiClient.get).toHaveBeenCalledWith("/products/p1");
    expect(result).toEqual({ _id: "p1", name: "Laptop" });
  });

  test("searchProducts solo incluye los filtros presentes en los params", async () => {
    apiClient.get.mockResolvedValue({ data: { products: [] } });

    await searchProducts({ q: "laptop", minPrice: 100 });

    expect(apiClient.get).toHaveBeenCalledWith("/products/search", {
      params: { q: "laptop", minPrice: 100 },
    });
  });

  test("searchProducts sin filtros no envía params vacíos", async () => {
    apiClient.get.mockResolvedValue({ data: { products: [] } });

    await searchProducts();

    expect(apiClient.get).toHaveBeenCalledWith("/products/search", { params: {} });
  });

  test("createProduct llama POST /products con el body dado", async () => {
    apiClient.post.mockResolvedValue({ data: { _id: "new-id" } });

    const result = await createProduct({ name: "Mouse", price: 200 });

    expect(apiClient.post).toHaveBeenCalledWith("/products", { name: "Mouse", price: 200 });
    expect(result).toEqual({ _id: "new-id" });
  });

  test("updateProduct llama PUT /products/:id", async () => {
    apiClient.put.mockResolvedValue({ data: { _id: "p1", price: 300 } });

    const result = await updateProduct("p1", { price: 300 });

    expect(apiClient.put).toHaveBeenCalledWith("/products/p1", { price: 300 });
    expect(result).toEqual({ _id: "p1", price: 300 });
  });

  test("deleteProduct llama DELETE /products/:id", async () => {
    apiClient.delete.mockResolvedValue({});

    await deleteProduct("p1");

    expect(apiClient.delete).toHaveBeenCalledWith("/products/p1");
  });

  test("propaga el error clasificado cuando la API falla", async () => {
    apiClient.get.mockRejectedValue({ kind: "SERVER_ERROR" });

    await expect(getAllProducts()).rejects.toEqual({ kind: "SERVER_ERROR" });
  });
});

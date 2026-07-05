import apiClient from "./apiClient";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategoryAndChildren,
} from "./categoryService";

jest.mock("./apiClient");

describe("categoryService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getAllCategories llama GET /categories", async () => {
    apiClient.get.mockResolvedValue({ data: [{ _id: "c1", name: "Electrónica" }] });

    const result = await getAllCategories();

    expect(apiClient.get).toHaveBeenCalledWith("/categories");
    expect(result).toEqual([{ _id: "c1", name: "Electrónica" }]);
  });

  test("getCategoryById llama GET /categories/:id", async () => {
    apiClient.get.mockResolvedValue({ data: { _id: "c1" } });

    await getCategoryById("c1");

    expect(apiClient.get).toHaveBeenCalledWith("/categories/c1");
  });

  test("createCategory llama POST /categories con el body", async () => {
    apiClient.post.mockResolvedValue({ data: { _id: "c2" } });

    await createCategory({ name: "Ropa", description: "..." });

    expect(apiClient.post).toHaveBeenCalledWith("/categories", { name: "Ropa", description: "..." });
  });

  test("updateCategory llama PUT /categories/:id", async () => {
    apiClient.put.mockResolvedValue({ data: { _id: "c1", name: "Actualizada" } });

    await updateCategory({ name: "Actualizada" }, "c1");

    expect(apiClient.put).toHaveBeenCalledWith("/categories/c1", { name: "Actualizada" });
  });

  test("deleteCategory llama DELETE /categories/:id y no devuelve valor", async () => {
    apiClient.delete.mockResolvedValue({});

    const result = await deleteCategory("c1");

    expect(apiClient.delete).toHaveBeenCalledWith("/categories/c1");
    expect(result).toBeUndefined();
  });

  test("getProductsByCategoryAndChildren usa page/limit por defecto", async () => {
    apiClient.get.mockResolvedValue({ data: { products: [] } });

    await getProductsByCategoryAndChildren("c1");

    expect(apiClient.get).toHaveBeenCalledWith("/categories/c1/products", {
      params: { page: 1, limit: 10 },
    });
  });

  test("getProductsByCategoryAndChildren respeta page/limit personalizados", async () => {
    apiClient.get.mockResolvedValue({ data: { products: [] } });

    await getProductsByCategoryAndChildren("c1", { page: 3, limit: 5 });

    expect(apiClient.get).toHaveBeenCalledWith("/categories/c1/products", {
      params: { page: 3, limit: 5 },
    });
  });
});

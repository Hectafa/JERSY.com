import apiClient from "./apiClient";

const getAllCategories = async () => {
  const response = await apiClient.get("/categories");
  return response.data;
};

const getCategoryById = async (categoryId) => {
  const response = await apiClient.get("/categories/" + categoryId);
  return response.data;
};

const createCategory = async (data) => {
  const response = await apiClient.post("/categories", data);
  return response.data;
};

const updateCategory = async (data, categoryId) => {
  const response = await apiClient.put("/categories/" + categoryId, data);
  return response.data;
};

const deleteCategory = async (categoryId) => {
  await apiClient.delete("/categories/" + categoryId);
};

const getProductsByCategoryAndChildren = async (categoryId, options = {}) => {
  const params = {
    page: options.page ?? 1,
    limit: options.limit ?? 10,
  };

  const response = await apiClient.get(`/categories/${categoryId}/products`, {
    params,
  });

  return response.data;
};

export {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getProductsByCategoryAndChildren,
};

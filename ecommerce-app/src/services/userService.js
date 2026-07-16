import apiClient from "./apiClient";

//GET /users/:id -> perfil real del usuario (propietario o admin) desde el backend
export async function getUserProfile(id) {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
}

//PUT /users/:id -> actualizar datos del usuario del propio perfil (name/email) desde el backend
export async function updateUserProfile(id, data) {
  const response = await apiClient.put(`/users/${id}/`, data);
  return response.data;
}

//PUT /users/:id/password -> Cambiar contraseña del usuario dueño del perfil desde el backend
export async function changePassword(id, data) {
  const response = await apiClient.put(`/users/${id}/password`, data);
  return response.data;
}

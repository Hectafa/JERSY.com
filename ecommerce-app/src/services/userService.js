import users from "../data/users.json";
import apiClient from "./apiClient";

export const fetchUsers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(users);
    }, 1500); // 1.5 segundos de delay
  });
};

export const searchUsers = async (query) => {
  const lowerQuery = query.trim().toLowerCase();
  return fetchUsers().then((data) =>
    data.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery)
    )
  );
};

export const getUserById = async (userId) => {
  return fetchUsers().then((data) => data.find((user) => user._id === userId));
};

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

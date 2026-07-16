import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

function classifyError(error) {
  if (error.response) {
    const status = error.response.status;
    if (status === 404) return { kind: "NOT_FOUND", status, original: error };
    if (status === 401)
      return { kind: "UNAUTHORIZED", status, original: error };
    if (status === 403) return { kind: "FORBIDDEN", status, original: error };
    if (status === 422)
      return {
        kind: "VALIDATION",
        status,
        fields: error.response.data?.errors,
        original: error,
      };
    if (status === 500)
      return { kind: "SERVER_ERROR", status, original: error };

    return { kind: "CLIENT_ERROR", status, original: error };
  }

  if (error.code === "ECONNABORTED") {
    return { kind: "TIMEOUT", original: error };
  }

  if (error.request) {
    return { kind: "NETWORK", original: error };
  }

  return { kind: "UNKNOWN", original: error };
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const classified = classifyError(error);
    console.error(`[API ${classified.kind}]`, classified);
    return Promise.reject(classified);
  },
);

export default apiClient;
import axios from "axios";

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("cylawcase.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("cylawcase.token");
    }
    return Promise.reject(error);
  }
);


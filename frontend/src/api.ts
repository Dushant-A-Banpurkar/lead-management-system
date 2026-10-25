import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((request) => {
  const token = localStorage.getItem("leadflow-token");
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

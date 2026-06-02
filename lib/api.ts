import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getToken, removeToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally – redirect to login
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      removeToken();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
};

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionsApi = {
  list: (params?: Record<string, string | number>) =>
    api.get("/transactions", { params }),
  create: (data: unknown) => api.post("/transactions", data),
  getById: (id: string) => api.get(`/transactions/${id}`),
  update: (id: string, data: unknown) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  summary: (params?: { month?: string }) =>
    api.get("/transactions/summary", { params }),
  exportCsv: (params?: Record<string, string>) =>
    api.get("/transactions/export/csv", { params, responseType: "blob" }),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get("/categories"),
  create: (data: { name: string; type: string; icon?: string }) =>
    api.post("/categories", data),
  update: (id: string, data: { name?: string; icon?: string }) =>
    api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ─── Budgets ──────────────────────────────────────────────────────────────────
export const budgetsApi = {
  list: (params?: { month?: string }) =>
    api.get("/budgets", { params }),
  create: (data: { category_id: string; limit_amount: number; period: string }) =>
    api.post("/budgets", data),
  update: (id: string, data: { limit_amount: number }) =>
    api.put(`/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/budgets/${id}`),
};

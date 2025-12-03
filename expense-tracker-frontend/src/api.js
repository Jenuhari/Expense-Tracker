// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Attach token for each request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ------------ Auth ------------ */

export const signup = (data) => {
  // data: { full_name, email, password, gender, hobbies, file }
  const formData = new FormData();
  formData.append("full_name", data.full_name);
  if (data.email) formData.append("email", data.email);
  formData.append("password", data.password);
  if (data.gender) formData.append("gender", data.gender);
  if (data.hobbies) formData.append("hobbies", data.hobbies); // already string (joined with ",")
  if (data.file) formData.append("file", data.file);

  return api.post("/auth/signup", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const login = (identifier, password) => {
  const body = new URLSearchParams({ username: identifier, password });
  return api.post("/auth/login", body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const getMe = () => api.get("/auth/me");

/* ------------ Categories ------------ */

export const fetchCategories = () => api.get("/categories");
export const createCategory = (data) => api.post("/categories", data);

/* ------------ Expenses ------------ */

export const fetchExpenses = (params) => api.get("/expenses", { params });
export const createExpense = (data) => api.post("/expenses", data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

export const fetchMonthlyStats = (year, month) =>
  api.get("/expenses/stats/monthly", { params: { year, month } });

export default api;

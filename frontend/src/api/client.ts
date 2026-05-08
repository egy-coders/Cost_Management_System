import axios from "axios";
import i18n from "../i18n";
import { formatCurrency, humanizeEnum } from "../i18n/format";
import type { Paginated } from "../types";

function normalizeApiBaseUrl(value?: string) {
  const raw = (value || "http://127.0.0.1:8000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Accept-Language"] = i18n.resolvedLanguage || i18n.language || "en";
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refreshToken");
      if (refresh) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh });
          localStorage.setItem("accessToken", response.data.access);
          if (response.data.refresh) {
            localStorage.setItem("refreshToken", response.data.refresh);
          }
          original.headers.Authorization = `Bearer ${response.data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }
    }
    return Promise.reject(error);
  }
);

export function rows<T>(payload: T[] | Paginated<T>): T[] {
  return Array.isArray(payload) ? payload : payload.results;
}

export function queryString(filters: Record<string, string | number | undefined | null>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

export function formatMoney(value: string | number | undefined | null, currency = "SAR") {
  return formatCurrency(value, currency);
}

export function apiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      return Object.entries(data)
        .map(([key, value]) => `${i18n.t(`fields.${key}`, { defaultValue: humanizeEnum(key) })}: ${Array.isArray(value) ? value.join(", ") : value}`)
        .join(", ");
    }
  }
  return i18n.t("messages.generic_error");
}

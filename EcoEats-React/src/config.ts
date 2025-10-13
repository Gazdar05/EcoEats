// src/config.ts
// Works for Vite (using import.meta.env)
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";

import axios from "axios";

/** Future DRF transport; the prototype's feature APIs use the local mock repository by default. */
export const apiClient = axios.create({
  baseURL: "/api/",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

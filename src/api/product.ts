import apiClient from "./axios";

export const getProducts = () => {
  return apiClient.get("/products.json");
};

// 需要API直接import { getProducts } from "@/api/product";
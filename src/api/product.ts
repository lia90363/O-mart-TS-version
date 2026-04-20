import apiClient from "./axios";
import type { AxiosResponse } from "axios";
// 引入在 Store 定義好的 Product 型別，確保產品資料符合規格
import type { Product } from "@/stores/cartStore"; 

// 【取得產品列表】
export const getProducts = (): Promise<AxiosResponse<Product[]>> => {
  return apiClient.get<Product[]>("/products");
};
// 使用範例：在組件中 import { getProducts } from "@/api/product";
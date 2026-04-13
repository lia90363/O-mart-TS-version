import apiClient from "./axios";
import type { AxiosResponse } from "axios";
// 引入在 Store 定義好的 Product 型別
import type { Product } from "@/stores/cartStore"; 

// 加上泛型 <Product[]>
export const getProducts = (): Promise<AxiosResponse<Product[]>> => {
  // 原本是 "/products.json"，現在改成 "/products"
  // (因為 baseURL 已經有 /api 了，所以這裡寫 /products 就好)
  return apiClient.get<Product[]>("/products");
};
// 需要API直接import { getProducts } from "@/api/product";
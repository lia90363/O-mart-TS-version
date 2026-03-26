import apiClient from "./axios";
import type { AxiosResponse } from "axios";
// 引入在 Store 定義好的 Product 型別
import type { Product } from "@/stores/cartStore"; 

// 加上泛型 <Product[]>
// 這樣呼叫這支 API 的人，就能立刻知道 res.data 是一個產品陣列
export const getProducts = (): Promise<AxiosResponse<Product[]>> => {
  return apiClient.get<Product[]>("/products.json");
};

// 需要API直接import { getProducts } from "@/api/product";
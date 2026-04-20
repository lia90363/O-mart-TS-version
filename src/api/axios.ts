import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const apiClient = axios.create({
  baseURL: 'https://o-mart-ts-version-production.up.railway.app/api', 
  headers: {
    "Content-Type": "application/json",
  },
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    // 從 Pinia Store 取得 token (有持久化，重整頁面也會在)
    const authStore = useAuthStore();
    const token = authStore.token;

    // 如果 token 存在，就把它塞進 Header 的 Authorization 欄位
    if (token) {
      // 格式必須符合後端警衛要求的 "Bearer <token>"
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 回應攔截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const authStore = useAuthStore();
      // 清空登入狀態，強迫使用者重新登入
      authStore.logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
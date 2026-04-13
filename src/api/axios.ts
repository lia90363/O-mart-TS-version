import axios from "axios";

const apiClient = axios.create({
  // 改成你的後端網址
  baseURL: 'http://localhost:3000/api', 
  timeout: 5000,
});

export default apiClient;
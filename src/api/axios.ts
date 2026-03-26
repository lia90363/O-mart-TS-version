import axios from "axios";

const apiClient = axios.create({
  baseURL: '/',
  timeout: 5000,
});

export default apiClient;


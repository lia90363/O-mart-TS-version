import axios from "axios";

const apiClient = axios.create({
  baseURL: 'https://o-mart-ts-version-production.up.railway.app', 
  timeout: 5000,
});

export default apiClient;
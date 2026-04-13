import axios from "axios";

const apiClient = axios.create({
  baseURL: 'https://o-mart-ts-version-production.up.railway.app/api', 
  timeout: 5000,
});

export default apiClient;
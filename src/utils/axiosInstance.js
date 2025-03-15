import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api", // Replace with your backend URL
});

// Intercept API responses to handle 401/403 errors
API.interceptors.response.use(
  (response) => response, // ✅ Pass successful responses
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("⚠️ Token expired or invalid. Logging out...");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login"; // 🔄 Redirect to login page
    }
    return Promise.reject(error);
  }
);

export default API;

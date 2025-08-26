import axios from 'axios';

const isDevelopment = import.meta.env.MODE === 'development';
const baseurl = isDevelopment ? import.meta.env.VITE_API_BASE_URL_LOCAL : import.meta.env.VITE_API_BASE_URL_PROD;

//Extract CSRF token from cookies
const csrfToken = document.cookie.match(/csrftoken=([\w-]+)/)?.[1];

const AxiosInstance = axios.create({
  baseURL: baseurl,
  headers: {

    accept: "application/json",
    "X-CSRFToken": csrfToken ? csrfToken : "", 
  },
});

// Interceptor to add 'multipart/form-data' if needed
AxiosInstance.interceptors.request.use(
(config) => {
     
      try {
      const token = localStorage.getItem("access_token");
      if (token) {
        console.log("✅ Token accessed");
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("⚠️ Unable to access token from localStorage:", error);
    }

    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
 },
 (error) => {
   return Promise.reject(error);
 }
 );

export default AxiosInstance;
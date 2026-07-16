import axios from "axios";

// Determine the API base URL based on environment
const getBaseURL = () => {
  // Always use the API URL from environment variable
  return process.env.NEXT_PUBLIC_API_URL || "https://app.fittbot.com";
};

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds
  withCredentials: true, // Important: enables sending cookies with requests
  headers: {
    "Content-Type": "application/json",
    ////////////////////////////////////////////////////////////
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true"
  },
});

let isRefreshing = false;
let refreshPromise = null;

const clearTokens = () => {
  if (typeof window !== "undefined") {
    delete axiosInstance.defaults.headers.common["Authorization"];
  }
};

const refreshToken = async () => {
  try {
    
    // The /auth/refresh endpoint expects {id: int, user_type: str} in body but doesn't set cookies
    // The /api/admin/auth/refresh-cookie endpoint reads from cookies and properly sets new cookies

    const refreshResponse = await axios.post(
      `${getBaseURL()}/api/admin/auth/refresh-cookie`,
      {},  // Empty body - reads from cookies
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
      }
    );

    if (refreshResponse?.status === 200) {
      // Backend has set the new access token in httpOnly cookie
      return true;
    } else {
      throw new Error("Failed to refresh token");
    }
  } catch (error) {
    clearTokens();

    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return null;
  }
};

const verifyToken = async () => {
  try {
    // Backend reads admin_id and access token from httpOnly cookies

    const verifyResponse = await axios.get(`${getBaseURL()}/api/admin/auth/verify`, {
      params: { device: "web" },
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true"
      },
    });

    if (verifyResponse?.status === 200) {
      return verifyResponse.data;
    } else {
      throw new Error("Token verification failed");
    }
  } catch (error) {

    if (error.response?.status === 401) {
      try {
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          // Retry verification with new token
          const retryResponse = await axios.get(`${getBaseURL()}/api/admin/auth/verify`, {
            params: { device: "web" },
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true"
            },
          });
          if (retryResponse?.status === 200) {
            return retryResponse.data;
          }
        }
      } catch (refreshError) {
        // Token refresh failed
      }
    }

    throw error;
  }
};

// Request interceptor - cookies are sent automatically due to withCredentials: true
axiosInstance.interceptors.request.use(
  (config) => {
  

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally with automatic token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: "Network error. Please check your connection.",
        originalError: error,
      });
    }

    // Bail immediately on non-401 errors
    if (status !== 401) {
      return Promise.reject(error);
    }

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip retry for auth endpoints to avoid infinite loops
    const url = originalRequest.url;
    const isAuthEndpoint =
      url?.includes("/auth/refresh") ||
      url?.includes("/api/admin/auth/verify") ||
      url?.includes("/auth/otp-verification") ||
      url?.includes("/auth/refresh-cookie") ||
      url?.includes("/api/admin/auth/refresh-cookie");

    if (isAuthEndpoint) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        window.location.href = "/";
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshToken();
    }

    try {
      const refreshSuccess = await refreshPromise;

      if (refreshSuccess) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return axiosInstance(originalRequest);
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }

    return Promise.reject(error);
  }
);

export { verifyToken };
export default axiosInstance;

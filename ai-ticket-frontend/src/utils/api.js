import { safeStorage } from "./storage.js";

// API utility with better error handling for storage issues
export const apiClient = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",

  async request(endpoint, options = {}) {
    try {
      const token = safeStorage.getItem("token");

      const config = {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Handle authentication errors
      if (response.status === 401) {
        // Clear potentially corrupted auth data
        safeStorage.removeItem("token");
        safeStorage.removeItem("user");

        // Redirect to login if not already there
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  },

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  },

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  },
};

import { safeStorage } from "./storage.js";

// Function to safely construct API URLs
function getBaseURL() {
  const serverUrl =
    import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL;

  if (serverUrl) {
    return serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
  }

  // Fallback for different environments
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000/api";
    }

    // Production fallback
    return "https://ticketmate-ai.onrender.com/api";
  }

  // Server-side fallback
  return "https://ticketmate-ai.onrender.com/api";
}

// API utility with better error handling for storage issues
export const apiClient = {
  baseURL: getBaseURL(),

  async request(endpoint, options = {}) {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const token = safeStorage.getItem("token");

        // Ensure endpoint starts with /
        const cleanEndpoint = endpoint.startsWith("/")
          ? endpoint
          : `/${endpoint}`;
        const url = `${this.baseURL}${cleanEndpoint}`;

        console.log(`API Request (attempt ${attempt}): ${options.method || "GET"} ${url}`);

        const config = {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
          timeout: 30000, // 30 second timeout
          ...options,
        };

        const response = await fetch(url, config);

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
          // For server errors, check if we should retry
          if (response.status >= 500 && attempt < maxRetries) {
            console.log(`Server error ${response.status}, retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`API request failed (attempt ${attempt}):`, error);
        
        // Check if it's a network error and we should retry
        if ((error.name === 'TypeError' || error.message.includes('Failed to fetch')) && attempt < maxRetries) {
          console.log(`Network error, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // If it's the last attempt or a non-retryable error, throw it
        throw error;
      }
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

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  },
  },
};

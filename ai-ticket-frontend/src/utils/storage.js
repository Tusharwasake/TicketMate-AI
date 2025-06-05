// Safe localStorage wrapper to handle storage access errors
export const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof Storage === "undefined" || !window.localStorage) {
        return null;
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get item '${key}' from localStorage:`, error);
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      if (typeof Storage === "undefined" || !window.localStorage) {
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set item '${key}' in localStorage:`, error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      if (typeof Storage === "undefined" || !window.localStorage) {
        return false;
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove item '${key}' from localStorage:`, error);
      return false;
    }
  },

  clear: () => {
    try {
      if (typeof Storage === "undefined" || !window.localStorage) {
        return false;
      }
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn("Failed to clear localStorage:", error);
      return false;
    }
  }
};

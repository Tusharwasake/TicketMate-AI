// Safe localStorage wrapper to handle storage access errors
// Fallback to sessionStorage or memory storage when localStorage is not available

class FallbackStorage {
  constructor() {
    this.storage = new Map();
  }

  getItem(key) {
    return this.storage.get(key) || null;
  }

  setItem(key, value) {
    this.storage.set(key, value);
  }

  removeItem(key) {
    this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }
}

// Check if we're in a restricted context (iframe, private browsing, etc.)
function isStorageAvailable(type) {
  try {
    if (typeof window === "undefined") return false;

    const storage = window[type];
    if (!storage) return false;

    const testKey = "__storage_test__";
    storage.setItem(testKey, "test");
    storage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

// Determine the best available storage
function getBestStorage() {
  if (isStorageAvailable("localStorage")) {
    return window.localStorage;
  }
  if (isStorageAvailable("sessionStorage")) {
    console.warn("localStorage not available, falling back to sessionStorage");
    return window.sessionStorage;
  }
  console.warn("No web storage available, falling back to memory storage");
  return new FallbackStorage();
}

const storage = getBestStorage();

export const safeStorage = {
  getItem: (key) => {
    try {
      return storage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get item '${key}' from storage:`, error);
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      storage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set item '${key}' in storage:`, error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove item '${key}' from storage:`, error);
      return false;
    }
  },

  clear: () => {
    try {
      storage.clear();
      return true;
    } catch (error) {
      console.warn("Failed to clear storage:", error);
      return false;
    }
  },
};

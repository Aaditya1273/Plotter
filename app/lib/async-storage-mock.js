// Mock for @react-native-async-storage/async-storage in web environment
const AsyncStorage = {
  getItem: async (key) => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
  clear: async () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }
};

module.exports = AsyncStorage;
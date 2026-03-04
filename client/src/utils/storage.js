/**
 * Storage utility — window.storage (Claude artifacts) → localStorage fallback
 */
const Store = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : null;
      }
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },

  async set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, serialized);
      } else {
        localStorage.setItem(key, serialized);
      }
      return true;
    } catch {
      return false;
    }
  },

  async del(key) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.delete(key);
      } else {
        localStorage.removeItem(key);
      }
      return true;
    } catch {
      return false;
    }
  },

  async keys(prefix) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.list(prefix);
        return r?.keys || [];
      }
      return Object.keys(localStorage).filter((k) => k.startsWith(prefix));
    } catch {
      return [];
    }
  },
};

export default Store;

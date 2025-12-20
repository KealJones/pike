import { del, get, set } from 'idb-keyval';
import type { PersistStorage } from 'zustand/middleware';

/**
 * Custom storage implementation using IndexedDB via idb-keyval
 * This provides better performance and larger storage capacity than localStorage
 */
export const indexedDBStorage: PersistStorage<any> = {
  getItem: async (name: string) => {
    try {
      const value = await get(name);
      return value || null;
    } catch (error) {
      console.error('Error getting item from IndexedDB:', error);
      return null;
    }
  },
  setItem: async (name: string, value: any) => {
    try {
      await set(name, value);
    } catch (error) {
      console.error('Error setting item in IndexedDB:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await del(name);
    } catch (error) {
      console.error('Error removing item from IndexedDB:', error);
    }
  },
};

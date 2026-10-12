import { useEffect, useState } from 'react';

/**
 * Like useState, but the value is saved to localStorage under `key`.
 *
 * - On first load, reads the stored value if one exists.
 * - Otherwise uses `initialValue` (a value or a function returning one)
 *   and saves it, so sample data is only written on the first launch.
 * - Every update is written back to localStorage.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn(`Could not read "${key}" from localStorage. Using default data.`, error);
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not save "${key}" to localStorage.`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

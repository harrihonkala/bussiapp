import { useState, useCallback } from 'react';

const KEY = 'bussiapp_favorites';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(load);

  const save = useCallback((next) => {
    setFavorites(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback((stop) => {
    setFavorites(prev => {
      const exists = prev.some(s => s.gtfsId === stop.gtfsId);
      const next = exists
        ? prev.filter(s => s.gtfsId !== stop.gtfsId)
        : [...prev, stop];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (gtfsId) => favorites.some(s => s.gtfsId === gtfsId),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}

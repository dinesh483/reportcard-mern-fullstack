import { useState, useEffect, useCallback } from 'react';

export function useDraft(key, initial = {}) {
  const storageKey = `draft:${key}`;

  const [draft, setDraftState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...initial, ...JSON.parse(saved) } : initial;
    } catch {
      return initial;
    }
  });

  const [hasDraft, setHasDraft] = useState(() => !!localStorage.getItem(storageKey));

  const setDraft = useCallback((updater) => {
    setDraftState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      setHasDraft(true);
      return next;
    });
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setDraftState(initial);
    setHasDraft(false);
  }, [storageKey]);

  return { draft, setDraft, clearDraft, hasDraft };
}

'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  getSecureItem,
  removeSecureItem,
  setSecureItem,
} from '../services/storage.service';

export function useSecureDraft<T>(key: string, values: T) {
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      setSecureItem(key, values);
    }, 2000);

    return () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [key, values]);

  const restoreDraft = useCallback((): T | null => getSecureItem<T>(key), [key]);

  const clearDraft = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current);
    }
    removeSecureItem(key);
  }, [key]);

  return { restoreDraft, clearDraft };
}

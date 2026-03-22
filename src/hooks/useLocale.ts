import { useState, useCallback } from 'react';
import { Locale, t as translate } from '../lib/i18n';

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(() => {
    return (localStorage.getItem('locale') as Locale) || 'zh';
  });

  const switchLocale = useCallback((l: Locale) => {
    setLocale(l);
    localStorage.setItem('locale', l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  return { locale, switchLocale, t };
}

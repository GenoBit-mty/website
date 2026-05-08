import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {  translate } from "./strings";
import type {StringKey} from "./strings";
import type { ReactNode } from "react";
import type { Lang } from "./types";

const COOKIE_NAME = "genobit-lang";
const STORAGE_KEY = "genobit-lang";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function detectInitialLang(): Lang {
  if (typeof window === "undefined") return "es";
  const fromCookie = readCookie(COOKIE_NAME);
  if (fromCookie === "es" || fromCookie === "en") return fromCookie;
  const fromStorage = readStorage(STORAGE_KEY);
  if (fromStorage === "es" || fromStorage === "en") return fromStorage;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("en")) return "en";
  return "es";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = detectInitialLang();
    setLangState(initial);
    setHydrated(true);
    if (typeof document !== "undefined") {
      document.documentElement.lang = initial;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, [lang, hydrated]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeCookie(COOKIE_NAME, next);
    writeStorage(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: StringKey) => translate(key, lang),
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}

export function useT() {
  return useLang().t;
}

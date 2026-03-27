import React, { createContext, useContext, useEffect, useMemo } from "react";

const ThemeContext = createContext(null);

function applyDarkTheme() {
  document.documentElement.classList.add("dark");
}

export function ThemeProvider({ children }) {
  useEffect(() => {
    applyDarkTheme();
  }, []);

  const value = useMemo(
    () => ({
      theme: "dark",
      setTheme: () => {},
      toggle: () => {},
      isDark: true,
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

import { useState, useEffect, useCallback } from "react"

const THEME_KEY = "f5-theme"

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "light"
    } catch {
      return "light"
    }
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-theme", theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0f172a" : "#ffffff")
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"))
  }, [])

  return { theme, toggleTheme }
}

'use client'

import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes'
import { ReactNode } from 'react'

export function useTheme() {
  const { theme, setTheme } = useNextTheme()
  return {
    theme: (theme ?? 'dark') as 'dark' | 'light',
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" storageKey="hackwire-theme">
      {children}
    </NextThemesProvider>
  )
}

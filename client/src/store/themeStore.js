import { create } from 'zustand'

const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem('theme') || 'light',

  // Applies the persisted/stored theme to the <html> element on app load
  initTheme: () => {
    applyTheme(get().theme)
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', next)
    applyTheme(next)
    set({ theme: next })
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    set({ theme })
  },
}))

export default useThemeStore

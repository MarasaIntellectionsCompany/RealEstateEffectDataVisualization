// src/composables/useTheme.js
import { ref, watch } from 'vue'

const theme = ref('dark')
let initialized = false
let watcherRegistered = false

const storageKey = 'alfapoly-theme'

const applyThemeToDocument = (mode) => {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  root.setAttribute('data-theme', mode)

  if (mode === 'light') {
    root.style.setProperty('--primary-bg', 'hsla(38, 10%, 84%, 1.00)')
    root.style.setProperty('--secondary-bg', '#dbd8d3')
    root.style.setProperty('--secondary-bg-pane', '#d1cdc7')
    root.style.setProperty('--tertiary-bg', '#dbd8d3')
    root.style.setProperty('--table-lines', '#333333')
    root.style.setProperty('--panel-bg', '#dbd8d3')
    root.style.setProperty('--primary-text', '#333333')
    root.style.setProperty('--secondary-text', '#333333')
    root.style.setProperty('--hover-text', '#dbd8d3')
    root.style.setProperty('--tile-text', '#0f1012')
    root.style.setProperty('--hover-bg', '#333333')
    root.style.setProperty('--accent-color', '#333333')
    root.style.setProperty('--accent-color-border', 'rgba(51, 51, 51, 0.5)')
    root.style.setProperty('--accent-hover', '#b8a58a')
    root.style.setProperty('--shadow-color', 'rgba(27, 29, 33, 0.1)')
    root.style.setProperty('--modal-bg', '#dbd8d3')
    root.style.setProperty('--input-bg', '#dbd8d3')
    root.style.setProperty('--input-border', '#1b1d21')
    root.style.setProperty('--button-hover', '#1b1d21')
    root.style.setProperty('--border-color', '#1b1d21')
    root.style.setProperty('--border-color-light', 'rgba(27, 29, 33, 0.3)')
    root.style.setProperty('--border-color-medium', 'rgba(27, 29, 33, 0.5)')
    root.style.setProperty('--border-color-strong', 'rgba(27, 29, 33, 0.7)')
    root.style.setProperty('--four-bg', '#dbd8d3')
    root.style.setProperty('--five-bg', '#d1cdc7')
    root.style.setProperty('--shadow-color-light', 'rgba(0, 0, 0, 0.1)')
    root.style.setProperty('--shadow-color-medium', 'rgba(0, 0, 0, 0.2)')
    root.style.setProperty('--accent-text', '#cbba9f')
    root.style.setProperty('--box-text-unit', '#dbd8d3')
    root.style.setProperty('--tile-font-weight', '500')
    root.style.setProperty('--accent-bg', '#333333')
    root.style.setProperty('--clear-font-weight', '500')
    root.style.setProperty('--hard-yellow', '#635b47')
    root.style.setProperty('--primary-hover', '#dbd8d3')
    root.style.setProperty('--six-bg', '#c7c3bd')
    root.style.setProperty('--serious-red', '#801e17')
    root.style.setProperty('--serious-green', '#1b351b')
    root.style.setProperty('--gold-color', '#cbba9f')
  } else {
    root.style.setProperty('--gold-color', '#cbba9f')
    root.style.setProperty('--primary-bg', '#333333')
    root.style.setProperty('--primary-hover', '#333333')
    root.style.setProperty('--secondary-bg', '#333333')
    root.style.setProperty('--secondary-bg-pane', '#1b1d21')
    root.style.setProperty('--hover-text', '#1b1d21')
    root.style.setProperty('--tertiary-bg', '#404040')
    root.style.setProperty('--table-lines', '#404040')
    root.style.setProperty('--four-bg', '#4d4d4d')
    root.style.setProperty('--five-bg', '#4d4d4d')
    root.style.setProperty('--six-bg', '#5c5c5c')
    root.style.setProperty('--panel-bg', '#333333')
    root.style.setProperty('--accent-text', '#333333')
    root.style.setProperty('--primary-text', '#dbd8d3')
    root.style.setProperty('--tile-text', '#dbd8d3')
    root.style.setProperty('--secondary-text', '#9e9c9c')
    root.style.setProperty('--hover-bg', '#cbba9f')
    root.style.setProperty('--button-hover', '#d1cdc7')
    root.style.setProperty('--accent-color', '#cbba9f')
    root.style.setProperty('--serious-red', '#9b524d')
    root.style.setProperty('--serious-green', '#538354')
    root.style.setProperty('--accent-color-border', 'rgba(203, 186, 159, 0.7)')
    root.style.setProperty('--hard-yellow', '#cbba9f')
    root.style.setProperty('--accent-hover', '#dbd8d3')
    root.style.setProperty('--accent-bg', '#dbd8d3')
    root.style.setProperty('--box-text-unit', '#333333')
    root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)')
    root.style.setProperty('--shadow-color-light', 'rgba(0, 0, 0, 0.1)')
    root.style.setProperty('--shadow-color-medium', 'rgba(0, 0, 0, 0.2)')
    root.style.setProperty('--modal-bg', '#1b1d21')
    root.style.setProperty('--input-bg', '#404040')
    root.style.setProperty('--input-border', '#dbd8d3')
    root.style.setProperty('--border-color', '#dbd8d3')
    root.style.setProperty('--border-color-light', 'rgba(219, 216, 211, 0.3)')
    root.style.setProperty('--border-color-medium', 'rgba(219, 216, 211, 0.5)')
    root.style.setProperty('--border-color-strong', 'rgba(219, 216, 211, 0.7)')
    root.style.setProperty('--tile-font-weight', '400')
    root.style.setProperty('--clear-font-weight', '500')
  }
}

const initializeTheme = () => {
  if (initialized) return
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'light' || stored === 'dark') {
      theme.value = stored
    }
  }
  applyThemeToDocument(theme.value)
  initialized = true
}

export const useTheme = () => {
  initializeTheme()

  if (!watcherRegistered) {
    watch(
      theme,
      (value) => {
        applyThemeToDocument(value)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, value)
        }
      },
      { immediate: false },
    )
    watcherRegistered = true
  }

  const setTheme = (value) => {
    if (value !== 'light' && value !== 'dark') return
    theme.value = value
  }

  const toggleTheme = () => {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}

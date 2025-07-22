'use client'

import { useState, useEffect } from 'react'

type TranslationKey = string
type TranslationValue = string | { [key: string]: any }
type Translations = { [key: string]: TranslationValue }

let translations: Translations = {}

export function useTranslation() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch('/locales/it.json')
        translations = await response.json()
        setIsLoaded(true)
      } catch (error) {
        console.error('Error loading translations:', error)
        setIsLoaded(true)
      }
    }

    if (Object.keys(translations).length === 0) {
      loadTranslations()
    } else {
      setIsLoaded(true)
    }
  }, [])

  const t = (key: TranslationKey, fallback?: string): string => {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }

    return typeof value === 'string' ? value : fallback || key
  }

  return { t, isLoaded }
}

// Static translation function for server-side or immediate use
export function getTranslation(key: TranslationKey, fallback?: string): string {
  const keys = key.split('.')
  let value: any = translations

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return fallback || key
    }
  }

  return typeof value === 'string' ? value : fallback || key
}
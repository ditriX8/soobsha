import { useSyncExternalStore } from 'react'

/** Chrome / Edge / Android expose this event when the site can be installed as an app. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed =
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // show our own button instead of the mini-infobar
    deferred = e as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    deferred = null
    emit()
  })
}

let snapshot = { canPrompt: !!deferred, installed }
function getSnapshot() {
  if (snapshot.canPrompt !== !!deferred || snapshot.installed !== installed) {
    snapshot = { canPrompt: !!deferred, installed }
  }
  return snapshot
}
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export function useInstallApp() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable'
    const ev = deferred
    await ev.prompt()
    const { outcome } = await ev.userChoice
    deferred = null
    if (outcome === 'accepted') installed = true
    emit()
    return outcome
  }
  return { ...state, ios: isIOS(), install }
}

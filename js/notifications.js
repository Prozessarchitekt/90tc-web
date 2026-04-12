// 90TC — Web Notifications
// Speichert Reminder-Prefs in localStorage, zeigt Notifications via SW wenn aktiv.

const NOTIF_KEY = '90tc_notif_prefs'

function getNotifPrefs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}') } catch { return {} }
}
function saveNotifPrefs(prefs) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs))
}

// Request permission
async function requestNotifPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

// Show a notification via SW (if active) or directly
async function showNotification(title, body, icon) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const opts = { body, icon: icon || '/icon.svg', badge: '/icon.svg', vibrate: [100,50,100] }
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) { reg.showNotification(title, opts); return }
  }
  new Notification(title, opts)
}

// Check if reminder should fire today
function shouldFireReminder(type, prefs) {
  const today = new Date().toISOString().split('T')[0]
  const firedKey = '90tc_notif_fired_' + type + '_' + today
  if (localStorage.getItem(firedKey)) return false
  const hour = new Date().getHours()
  if (type === 'morgen') {
    const target = parseInt(prefs.morgenStunde || 7)
    return hour >= target && hour < target + 3
  }
  if (type === 'abend') {
    const target = parseInt(prefs.abendStunde || 21)
    return hour >= target && hour < target + 3
  }
  return false
}

async function checkAndFireReminders() {
  const prefs = getNotifPrefs()
  if (!prefs.enabled) return
  if (Notification.permission !== 'granted') return
  const today = new Date().toISOString().split('T')[0]

  if (prefs.morgen && shouldFireReminder('morgen', prefs)) {
    await showNotification('☀️ Morgen-Check-in', 'Starte deinen Tag stark — 2 Minuten reichen!', '/icon.svg')
    localStorage.setItem('90tc_notif_fired_morgen_' + today, '1')
  }
  if (prefs.abend && shouldFireReminder('abend', prefs)) {
    await showNotification('🌙 Abend-Check-in', 'Wie war dein Tag? Hak ihn ab!', '/icon.svg')
    localStorage.setItem('90tc_notif_fired_abend_' + today, '1')
  }
}

// Call this on every page load
checkAndFireReminders()

// ── XP Rewards ──────────────────────────────────────
const XP = {
  MORGEN: 20,
  ABEND: 30,
  ALLE_7: 50,
  TRAINING: 40,
  NEW_PR: 80,
  WEEKLY_CHECK: 60,
  STREAK_7: 100,
  STREAK_30: 300,
}

// ── Level System ─────────────────────────────────────
const LEVELS = [
  { name: 'Rookie',       min: 0     },
  { name: 'Starter',      min: 500   },
  { name: 'Kämpfer',      min: 1200  },
  { name: 'Athlet',       min: 2200  },
  { name: 'Champion',     min: 3500  },
  { name: 'Legend',       min: 5500  },
  { name: 'Titan',        min: 8000  },
  { name: 'Unstoppable',  min: 12000 },
]

function getLevelInfo(xp) {
  let idx = 0
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) { idx = i; break }
  }
  const curr = LEVELS[idx]
  const next = LEVELS[idx + 1]
  const progress = next
    ? Math.round(((xp - curr.min) / (next.min - curr.min)) * 100)
    : 100
  return {
    level: idx + 1,
    name: curr.name,
    progress: Math.min(100, progress),
    xpToNext: next ? next.min - xp : 0,
    nextName: next?.name || null,
  }
}

function getStreakEmoji(streak) {
  if (streak >= 90) return '🏆'
  if (streak >= 60) return '🔥🔥🔥'
  if (streak >= 30) return '🔥🔥'
  if (streak >= 7)  return '🔥'
  if (streak >= 3)  return '🕯️'
  return '✨'
}

// ── Day Calculator ───────────────────────────────────
function calcDayNr(startdatum) {
  const start = new Date(startdatum)
  const today = new Date()
  start.setHours(0,0,0,0)
  today.setHours(0,0,0,0)
  const diff = Math.floor((today - start) / 86400000)
  return Math.min(90, Math.max(1, diff + 1))
}

// ── Makro-Formel ─────────────────────────────────────
const PAL_KAT = [
  { key: 'schlaf',   label: '😴 Schlafen',                        pal: 0.95 },
  { key: 'liegend',  label: '🛋️ Nur sitzend / liegend',           pal: 1.2  },
  { key: 'sitzend',  label: '💻 Überwiegend sitzend (Bürojob)',    pal: 1.45 },
  { key: 'wechsel',  label: '🚶 Sitzend + Stehen wechselnd',       pal: 1.65 },
  { key: 'stehend',  label: '🏪 Überwiegend stehend / gehend',     pal: 1.85 },
  { key: 'schwer',   label: '⚒️ Körperlich anstrengend / Sport',   pal: 2.2  },
]
const DEFAULT_STUNDEN = { schlaf: 8, liegend: 8, sitzend: 4, wechsel: 2, stehend: 1, schwer: 1 }

function berechnePAL(stunden) {
  return PAL_KAT.reduce((s, k) => s + (stunden[k.key] || 0) * k.pal, 0) / 24
}

function calculateMacros(gewicht, geschlecht, stunden, ziel, anpassung = 300) {
  const mann = geschlecht === 'maennlich'
  const bmr  = gewicht * (mann ? 24 : 21.6)
  const pal  = berechnePAL(stunden)
  const tdee = bmr * pal

  let kcal
  if (ziel === 'aufbauen')   kcal = Math.round(tdee + anpassung)
  else if (ziel === 'definieren') kcal = Math.round(tdee - anpassung)
  else                       kcal = Math.round(tdee)

  let protein, fettQ
  if (ziel === 'aufbauen') {
    protein = Math.round(gewicht * 1.9)
    fettQ   = mann ? 0.25 : 0.35
  } else if (ziel === 'definieren') {
    protein = Math.round(gewicht * (mann ? 2.3 : 2.2))
    fettQ   = mann ? 0.20 : 0.30
  } else {
    protein = Math.round(gewicht * (mann ? 2.2 : 2.0))
    fettQ   = mann ? 0.20 : 0.30
  }

  const fett  = Math.round((kcal * fettQ) / 9)
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fett * 9) / 4))
  return { kalorien: kcal, protein, fett, carbs, tdee: Math.round(tdee) }
}

// ── Score berechnen (7 Erfolgsfaktoren) ─────────────
function berechneScore(entry, profile) {
  return berechneScoreDetail(entry, profile).score
}

function berechneScoreDetail(entry, profile) {
  const faktoren = [
    !!(entry.kalorien_ist && profile.kalorien_ziel && Math.abs(entry.kalorien_ist - profile.kalorien_ziel) <= profile.kalorien_ziel * 0.10),
    !!(entry.protein_ist_g && profile.protein_ziel_g && entry.protein_ist_g >= profile.protein_ziel_g),
    !!(entry.schlaf_ist_h && entry.schlaf_ist_h >= 7),
    !!(entry.wasser_ist_l && profile.wasser_ziel_l && entry.wasser_ist_l >= profile.wasser_ziel_l),
    !!(entry.training_gemacht),
    !!(entry.progression),
    !!(entry.schritte_ist && profile.schritte_ziel && entry.schritte_ist >= profile.schritte_ziel),
  ]
  const score = Math.min(7, faktoren.filter(Boolean).length)
  return { score, faktoren }
}

// ── Streak Update ─────────────────────────────────────
async function updateStreak(profile, xpEarned) {
  const today = getToday()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newStreak = profile.streak_aktuell || 0
  const last = profile.letzter_checkin

  if (last === today) return // already counted

  if (!last || last < yesterdayStr) {
    newStreak = 1
  } else if (last === yesterdayStr) {
    newStreak = (profile.streak_aktuell || 0) + 1
  }

  let bonusXP = 0
  if (newStreak === 7)  bonusXP = XP.STREAK_7
  if (newStreak === 30) bonusXP = XP.STREAK_30

  await sb.from('profiles').update({
    xp_gesamt:      (profile.xp_gesamt || 0) + xpEarned + bonusXP,
    coins:          (profile.coins || 0) + xpEarned + bonusXP,
    streak_aktuell: newStreak,
    streak_rekord:  Math.max(profile.streak_rekord || 0, newStreak),
    letzter_checkin: today,
  }).eq('id', profile.id)

  return newStreak
}

// ── Count-up Animation ────────────────────────────────
function countUp(el, target, duration = 900, suffix = '') {
  if (!el) return
  const start = parseInt(el.textContent.replace(/\D/g, '')) || 0
  const diff  = target - start
  if (diff === 0) return
  const t0 = performance.now()
  function step(t) {
    const p = Math.min((t - t0) / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3) // cubic ease-out
    el.textContent = Math.round(start + diff * eased) + suffix
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ── Auto countUp for [data-countup] elements ──────────
function initCountUps() {
  document.querySelectorAll('[data-countup]').forEach(el => {
    const target = parseInt(el.dataset.countup)
    const suffix = el.dataset.suffix || ''
    if (!isNaN(target)) countUp(el, target, 900, suffix)
  })
}

// ── Confetti (requires canvas-confetti) ──────────────
function fireConfetti(opts = {}) {
  if (typeof confetti === 'undefined') return
  confetti({
    particleCount: opts.count || 80,
    spread: opts.spread || 70,
    origin: { y: opts.y || 0.65 },
    colors: opts.colors || ['#00d166','#39f08a','#fbbf24','#ffffff'],
    disableForReducedMotion: true,
  })
}

function firePRConfetti() {
  if (typeof confetti === 'undefined') return
  // Left burst
  confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: ['#fbbf24','#f59e0b','#fff'] })
  setTimeout(() =>
    confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: ['#fbbf24','#f59e0b','#fff'] })
  , 150)
}

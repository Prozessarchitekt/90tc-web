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

// ── 90TC Makro-Tabelle (aus Orientierungshilfe) ───────
const MACRO_TABELLE = {
  weiblich: {
    definieren: [
      { kfaMin:20, kfaMax:35, rows: [
        { hMin:150,hMax:160,wMin:55, wMax:65, kcalMin:1700,kcalMax:2100,ewMin:110,ewMax:130,fMin:50,fMax:65 },
        { hMin:160,hMax:170,wMin:65, wMax:75, kcalMin:1800,kcalMax:2200,ewMin:110,ewMax:130,fMin:50,fMax:75 },
        { hMin:170,hMax:180,wMin:75, wMax:85, kcalMin:1900,kcalMax:2300,ewMin:120,ewMax:140,fMin:50,fMax:75 },
      ]},
      { kfaMin:35, kfaMax:50, rows: [
        { hMin:150,hMax:160,wMin:75, wMax:115,kcalMin:2000,kcalMax:2500,ewMin:120,ewMax:150,fMin:65,fMax:95 },
        { hMin:160,hMax:170,wMin:85, wMax:125,kcalMin:2100,kcalMax:2600,ewMin:130,ewMax:160,fMin:75,fMax:105 },
        { hMin:170,hMax:180,wMin:95, wMax:135,kcalMin:2200,kcalMax:2700,ewMin:140,ewMax:170,fMin:85,fMax:115 },
      ]},
    ],
    recomp: [
      { kfaMin:15, kfaMax:30, rows: [
        { hMin:150,hMax:160,wMin:45, wMax:60, kcalMin:1700,kcalMax:2200,ewMin:100,ewMax:130,fMin:45,fMax:60 },
        { hMin:160,hMax:170,wMin:50, wMax:70, kcalMin:1800,kcalMax:2300,ewMin:110,ewMax:140,fMin:50,fMax:65 },
        { hMin:170,hMax:180,wMin:60, wMax:75, kcalMin:1900,kcalMax:2400,ewMin:120,ewMax:150,fMin:55,fMax:75 },
      ]},
    ],
    aufbauen: [
      { kfaMin:10, kfaMax:20, rows: [
        { hMin:150,hMax:160,wMin:40, wMax:60, kcalMin:1900,kcalMax:2400,ewMin:100,ewMax:130,fMin:45,fMax:60 },
        { hMin:160,hMax:170,wMin:45, wMax:70, kcalMin:2000,kcalMax:2500,ewMin:110,ewMax:140,fMin:50,fMax:65 },
        { hMin:170,hMax:180,wMin:50, wMax:75, kcalMin:2100,kcalMax:2600,ewMin:120,ewMax:150,fMin:55,fMax:75 },
      ]},
    ],
  },
  maennlich: {
    definieren: [
      { kfaMin:10, kfaMax:25, rows: [
        { hMin:160,hMax:170,wMin:60, wMax:80, kcalMin:2400,kcalMax:2800,ewMin:140,ewMax:180,fMin:40,fMax:60 },
        { hMin:170,hMax:180,wMin:70, wMax:90, kcalMin:2500,kcalMax:2900,ewMin:160,ewMax:200,fMin:50,fMax:70 },
        { hMin:180,hMax:190,wMin:80, wMax:100,kcalMin:2700,kcalMax:3100,ewMin:180,ewMax:220,fMin:60,fMax:80 },
        { hMin:190,hMax:200,wMin:90, wMax:110,kcalMin:2800,kcalMax:3200,ewMin:200,ewMax:240,fMin:70,fMax:90 },
      ]},
      { kfaMin:25, kfaMax:40, rows: [
        { hMin:160,hMax:170,wMin:85, wMax:115,kcalMin:2800,kcalMax:3400,ewMin:160,ewMax:220,fMin:55,fMax:85 },
        { hMin:170,hMax:180,wMin:95, wMax:125,kcalMin:2900,kcalMax:3500,ewMin:180,ewMax:240,fMin:65,fMax:95 },
        { hMin:180,hMax:190,wMin:105,wMax:135,kcalMin:3000,kcalMax:3600,ewMin:200,ewMax:260,fMin:75,fMax:105 },
        { hMin:190,hMax:200,wMin:115,wMax:145,kcalMin:3100,kcalMax:3700,ewMin:220,ewMax:280,fMin:85,fMax:115 },
      ]},
    ],
    recomp: [
      { kfaMin:6, kfaMax:20, rows: [
        { hMin:160,hMax:170,wMin:55, wMax:75, kcalMin:2400,kcalMax:3000,ewMin:130,ewMax:180,fMin:35,fMax:60 },
        { hMin:170,hMax:180,wMin:65, wMax:85, kcalMin:2500,kcalMax:3100,ewMin:150,ewMax:200,fMin:45,fMax:70 },
        { hMin:180,hMax:190,wMin:75, wMax:95, kcalMin:2700,kcalMax:3200,ewMin:170,ewMax:220,fMin:55,fMax:80 },
        { hMin:190,hMax:200,wMin:85, wMax:100,kcalMin:2800,kcalMax:3300,ewMin:190,ewMax:240,fMin:65,fMax:90 },
      ]},
    ],
    aufbauen: [
      { kfaMin:3, kfaMax:15, rows: [
        { hMin:160,hMax:170,wMin:50, wMax:85, kcalMin:2500,kcalMax:3300,ewMin:130,ewMax:180,fMin:35,fMax:70 },
        { hMin:170,hMax:180,wMin:60, wMax:95, kcalMin:2600,kcalMax:3400,ewMin:150,ewMax:200,fMin:45,fMax:80 },
        { hMin:180,hMax:190,wMin:70, wMax:105,kcalMin:2700,kcalMax:3500,ewMin:170,ewMax:220,fMin:55,fMax:90 },
        { hMin:190,hMax:200,wMin:80, wMax:115,kcalMin:2800,kcalMax:3600,ewMin:180,ewMax:240,fMin:65,fMax:100 },
      ]},
    ],
  },
}

function calculateMacrosFromTable(geschlecht, ziel, kfa, groesse, gewicht, alter, vegan) {
  const gKey = geschlecht === 'maennlich' ? 'maennlich' : 'weiblich'
  const groups = MACRO_TABELLE[gKey]?.[ziel]
  if (!groups || !groesse || !kfa) return null

  // KFA-Gruppe finden — exakt oder nächste
  const closest = (arr, val, fn) =>
    arr.reduce((b, x) => { const d = fn(x); return d < fn(b) ? x : b })
  let group = groups.find(g => kfa >= g.kfaMin && kfa <= g.kfaMax)
  if (!group) group = closest(groups, kfa,
    g => Math.min(Math.abs(kfa - g.kfaMin), Math.abs(kfa - g.kfaMax)))

  // Höhen-Zeile finden
  let row = group.rows.find(r => groesse >= r.hMin && groesse <= r.hMax)
  if (!row) row = closest(group.rows, groesse,
    r => Math.min(Math.abs(groesse - r.hMin), Math.abs(groesse - r.hMax)))

  // Interpolation nach Gewicht (t = 0 = unteres Ende, t = 1 = oberes Ende)
  const t = row.wMax > row.wMin
    ? Math.max(0, Math.min(1, (gewicht - row.wMin) / (row.wMax - row.wMin)))
    : 0.5

  let kcal    = Math.round(row.kcalMin + t * (row.kcalMax - row.kcalMin))
  let protein = Math.round(row.ewMin   + t * (row.ewMax   - row.ewMin))
  let fett    = Math.round(row.fMin    + t * (row.fMax    - row.fMin))

  if (alter >= 65)  protein = Math.round(protein * 1.25) // Ab 65 +25% Protein
  if (vegan)        protein = Math.round(protein * 1.20) // Vegan +20% Protein

  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fett * 9) / 4))
  return {
    kalorien: kcal, protein, fett, carbs,
    kfaGruppe: `KFA ${group.kfaMin}–${group.kfaMax}%`,
    hZeile: `${row.hMin}–${row.hMax} cm`,
  }
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

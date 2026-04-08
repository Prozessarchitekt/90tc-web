async function getSession() {
  const { data: { session } } = await sb.auth.getSession()
  return session
}

async function requireAuth() {
  const session = await getSession()
  if (!session) { window.location.href = 'login.html'; return null }
  return session.user
}

async function requireProfile() {
  const user = await requireAuth()
  if (!user) return null
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) { window.location.href = 'onboarding.html'; return null }
  return { user, profile }
}

async function signOut() {
  await sb.auth.signOut()
  window.location.href = 'login.html'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div')
  t.className = 'toast toast-' + type
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.classList.add('toast-show'), 10)
  setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 300) }, 3000)
}

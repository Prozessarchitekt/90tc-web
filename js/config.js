const SUPABASE_URL = 'https://wqznvxipnqvikuirjobi.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxem52eGlwbnF2aWt1aXJqb2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjkzODgsImV4cCI6MjA5MDY0NTM4OH0.k0phWyOQmvQLQa8Jk5jERPce5jp_NBjhIIPWT1jFT_g'
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

// Service Worker registrieren (nur auf HTTPS/localhost)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

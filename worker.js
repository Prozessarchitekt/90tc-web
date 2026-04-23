export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    if (url.pathname === '/api/coach' && request.method === 'POST') {
      return handleCoach(request, env)
    }

    return env.ASSETS.fetch(request)
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
}

async function handleCoach(request, env) {
  const headers = { ...corsHeaders(), 'Content-Type': 'application/json' }

  if (!env.ANTHROPIC_API_KEY) {
    return Response.json({ message: '—' }, { headers })
  }

  let data
  try { data = await request.json() } catch {
    return Response.json({ message: '—' }, { headers })
  }

  const { score, kalorien, protein, wasser, schlaf, schritte, stimmung, training } = data

  const prompt = `Du bist ein direkter, motivierender Fitness-Coach für die 90-Tage-Challenge. \
Schreib eine persönliche Abend-Nachricht auf Deutsch — max. 3 kurze Sätze. \
Kein "Hallo", kein "Ich bin dein Coach". Direkt anfangen. Kein Bullshit.

Tageswerte:
- Score: ${score}/7
- Kalorien: ${kalorien ?? '—'} kcal
- Protein: ${protein ?? '—'} g
- Wasser: ${wasser ?? '—'} L
- Schlaf letzte Nacht: ${schlaf ?? '—'} h
- Schritte: ${schritte ?? '—'}
- Stimmung: ${stimmung ?? '—'}/5
- Training heute: ${training ? 'Ja ✓' : 'Nein'}

Wenn etwas nicht optimal war: kurz ansprechen + konkreter Tipp für morgen. Wenn gut: kurze echte Anerkennung + was morgen zählt.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const result = await res.json()
    const message = result.content?.[0]?.text?.trim() || '—'
    return Response.json({ message }, { headers })
  } catch {
    return Response.json({ message: '—' }, { headers })
  }
}

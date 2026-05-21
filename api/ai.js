// Vercel Serverless Function — Anthropic proxy for FOREXDESK parser/chat.
// maxDuration raised so large broker reports don't get killed mid-generation
// (the root cause of the "Failed to fetch / paste fewer operations" error).
// 60s is the Pro-plan ceiling; on Hobby this is silently capped at 10s, in
// which case very large pastes should be split (the client warns about this).
export const maxDuration = 60;

const UPSTREAM_TIMEOUT_MS = 55_000; // abort just under maxDuration → clean 504

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  // Defensive body parsing: Vercel auto-parses JSON, but guard against string
  // bodies (e.g. when content-type is dropped) so we never crash on req.body.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const payload = {
    model: body.model || 'claude-sonnet-4-20250514',
    max_tokens: body.max_tokens || 1200,
    messages: Array.isArray(body.messages) ? body.messages : []
  };
  if (body.system) payload.system = body.system;
  if (body.temperature !== undefined) payload.temperature = body.temperature;

  if (payload.messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('Anthropic API error:', upstream.status, data);
      return res.status(upstream.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    if (err && err.name === 'AbortError') {
      console.error('AI proxy upstream timeout after', UPSTREAM_TIMEOUT_MS, 'ms');
      return res.status(504).json({
        error: 'Upstream timeout',
        detail:
          'A geração demorou demais (relatório muito grande). Cole menos operações por vez (até ~50) ou divida o relatório.'
      });
    }
    console.error('AI proxy error:', err);
    return res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
  } finally {
    clearTimeout(timer);
  }
}

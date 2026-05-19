import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // User key from header (acts as login/account isolation)
  const userKey = req.headers['x-user-key'];
  if (!userKey || userKey.length < 8) {
    return res.status(401).json({ error: 'Missing or invalid X-User-Key header' });
  }

  const storageKey = `forexdesk:${userKey}`;

  try {
    if (req.method === 'GET') {
      const data = await redis.get(storageKey);
      const lastUpdate = await redis.get(`${storageKey}:lastUpdate`);
      return res.status(200).json({
        data: data || null,
        lastUpdate: lastUpdate || null
      });
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid body' });
      }

      const now = new Date().toISOString();
      await redis.set(storageKey, body);
      await redis.set(`${storageKey}:lastUpdate`, now);

      return res.status(200).json({
        ok: true,
        lastUpdate: now,
        size: JSON.stringify(body).length
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: err.message });
  }
}

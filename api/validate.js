export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { key } = req.query;
  if (!key || typeof key !== 'string') return res.status(400).json({ error: 'Missing key' });

  const k = key.trim().toUpperCase();
  if (!k.startsWith('ASTRION_KEYHABWUBWVA_')) return res.status(400).json({ error: 'Invalid format' });

  const fp = Buffer.from((req.headers['user-agent'] || '') + (req.headers['x-forwarded-for'] || '')).toString('base64').substring(0,20);
  const db = global.db || (global.db = new Map());
  const now = Date.now();
  const exp = 24 * 60 * 60 * 1000;

  if (db.has(k)) {
    const r = db.get(k);
    if (now - r.time > exp) {
      db.delete(k);
      return res.status(403).json({ error: 'Key expired' });
    }
    if (r.fp !== fp) return res.status(403).json({ error: 'Used on another device' });
    return res.status(200).json({ success: true });
  }

  db.set(k, { fp, time: now });
  return res.status(200).json({ success: true });
}

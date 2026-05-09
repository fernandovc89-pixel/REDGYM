module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('[exercise-image] RAPIDAPI_KEY is not set');
    return res.status(500).json({ gifUrl: null });
  }

  try {
    console.log('[exercise-image] searching:', name);
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name.toLowerCase())}?limit=1`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      }
    );
    const data = await response.json();
    const gifUrl = Array.isArray(data) && data[0]?.gifUrl ? data[0].gifUrl : null;
    console.log('[exercise-image] result for', name, ':', gifUrl ? 'found' : 'not found');
    return res.json({ gifUrl });
  } catch (e) {
    console.error('[exercise-image] error:', e.message);
    return res.json({ gifUrl: null });
  }
};

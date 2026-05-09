module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { name } = req.query;
  if (!name) return res.status(400).json({ gifUrl: null, error: 'name required' });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('[get-exercise-image] RAPIDAPI_KEY not set');
    return res.status(200).json({ gifUrl: null });
  }

  try {
    console.log('[get-exercise-image] fetching:', name);
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
    console.log('[get-exercise-image]', name, '->', gifUrl ? 'found' : 'not found');
    return res.status(200).json({ gifUrl });
  } catch (e) {
    console.error('[get-exercise-image] error:', e.message);
    return res.status(200).json({ gifUrl: null });
  }
};

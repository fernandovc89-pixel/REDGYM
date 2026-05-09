module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { edad, peso_kg, altura_cm, objetivo } = req.body || {};
  console.log('[generate-plan] body:', { edad, peso_kg, altura_cm, objetivo });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('[generate-plan] GROQ_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  if (!edad || !peso_kg || !altura_cm || !objetivo) {
    return res.status(400).json({ error: 'Missing fields: edad, peso_kg, altura_cm, objetivo' });
  }

  try {
    console.log('[generate-plan] calling Groq...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1500,
        messages: [
          { role: 'system', content: 'You are an expert personal trainer. Reply ONLY with valid JSON, no extra text, no markdown code fences.' },
          { role: 'user', content: `Generate a personalized weekly training plan for:
- Age: ${edad} years
- Weight: ${peso_kg} kg
- Height: ${altura_cm} cm
- Goal: ${objetivo}

CRITICAL: Each exercise MUST be a JSON object with two fields:
- "name": the EXACT English exercise name as it appears in ExerciseDB. Only use names from this approved list: squat, push up, deadlift, pull up, plank, lunge, bench press, barbell row, shoulder press, overhead press, bicep curl, tricep dip, tricep extension, leg press, calf raise, crunch, mountain climber, lat pulldown, dumbbell row, leg curl, leg extension, hip thrust, glute bridge, lateral raise, front raise, incline bench press, dips, jump rope, burpee, run, step up
- "label": the Spanish name for this exercise

Reply ONLY with this JSON (resumen and enfoque in Spanish, exercise labels in Spanish, exercise names in English from the approved list):
{
  "resumen": "descripción motivacional breve del plan en español (1-2 oraciones)",
  "dias": [
    { "dia": "Lunes", "enfoque": "tipo de entreno en español", "ejercicios": [{"name":"squat","label":"Sentadillas"},{"name":"push up","label":"Flexiones"},{"name":"plank","label":"Plancha"},{"name":"lunge","label":"Zancadas"}] },
    { "dia": "Martes", "enfoque": "...", "ejercicios": [{"name":"...","label":"..."}] },
    { "dia": "Miércoles", "enfoque": "...", "ejercicios": [{"name":"...","label":"..."}] },
    { "dia": "Jueves", "enfoque": "...", "ejercicios": [{"name":"...","label":"..."}] },
    { "dia": "Viernes", "enfoque": "...", "ejercicios": [{"name":"...","label":"..."}] },
    { "dia": "Sábado", "enfoque": "...", "ejercicios": [{"name":"...","label":"..."}] },
    { "dia": "Domingo", "enfoque": "Descanso", "ejercicios": [{"name":"plank","label":"Plancha suave"},{"name":"run","label":"Caminata ligera"}] }
  ],
  "consejos": ["consejo 1 en español", "consejo 2 en español", "consejo 3 en español"]
}` }
        ]
      })
    });

    console.log('[generate-plan] Groq status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('[generate-plan] Groq error:', JSON.stringify(data));
      throw new Error(data.error?.message || `Groq error ${response.status}`);
    }

    const raw = data.choices[0].message.content;
    console.log('[generate-plan] raw response (first 200):', raw.slice(0, 200));

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    const plan = JSON.parse(cleaned);

    console.log('[generate-plan] success');
    return res.json({ plan });
  } catch (e) {
    console.error('[generate-plan] error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};

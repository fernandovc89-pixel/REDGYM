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
        max_tokens: 2000,
        messages: [
          { role: 'system', content: 'You are an expert personal trainer. Reply ONLY with valid JSON, no extra text, no markdown code fences.' },
          { role: 'user', content: `Generate a personalized weekly training plan for this specific user:
- Age: ${edad} years
- Weight: ${peso_kg} kg
- Height: ${altura_cm} cm
- Goal: ${objetivo}

Tailor sets, reps, and exercise selection to match this exact profile. For example:
- "Perder peso" → higher reps (15-20), shorter rest, more cardio
- "Ganar músculo" → moderate reps (8-12), heavier compound lifts
- "Mejorar resistencia" → circuit style, bodyweight focus
- "Mantenimiento" → balanced full-body approach
Adjust intensity for age and weight appropriately.

RULE 1 — Each exercise MUST be a JSON object with exactly these four fields:
  "name"  : EXACT English key from the approved list below
  "label" : EXACT Spanish label from the table below — do NOT invent other labels
  "sets"  : integer (e.g. 3)
  "reps"  : string — number "12", range "8-12", or duration "30 segundos"

RULE 2 — Approved name → label table (copy labels EXACTLY, accent marks included):
  squat               → Sentadillas
  deadlift            → Peso Muerto
  push up             → Flexiones
  pull up             → Dominadas
  plank               → Plancha
  lunge               → Zancadas
  bench press         → Press de Banca
  barbell row         → Remo con Barra
  shoulder press      → Press de Hombros
  overhead press      → Press Militar
  bicep curl          → Curl de Bíceps
  tricep dip          → Fondos de Tríceps
  tricep extension    → Extensión de Tríceps
  dips                → Fondos en Paralelas
  leg press           → Prensa de Piernas
  calf raise          → Elevación de Pantorrillas
  crunch              → Abdominales
  mountain climber    → Escalador
  lat pulldown        → Jalón al Pecho
  dumbbell row        → Remo con Mancuerna
  leg curl            → Curl Femoral
  leg extension       → Extensión de Cuádriceps
  hip thrust          → Hip Thrust
  glute bridge        → Puente de Glúteos
  lateral raise       → Elevaciones Laterales
  front raise         → Elevaciones Frontales
  incline bench press → Press Inclinado
  step up             → Subida al Banco
  run                 → Carrera
  jump rope           → Saltar la Cuerda
  burpee              → Burpee

Reply ONLY with this JSON (resumen, enfoque, and consejos in Spanish):
{
  "resumen": "descripción motivacional breve del plan en español (1-2 oraciones)",
  "dias": [
    { "dia": "Lunes",     "enfoque": "tipo de entreno en español", "ejercicios": [{"name":"squat","label":"Sentadillas","sets":3,"reps":"12"},{"name":"deadlift","label":"Peso Muerto","sets":3,"reps":"10"},{"name":"push up","label":"Flexiones","sets":3,"reps":"15"},{"name":"plank","label":"Plancha","sets":3,"reps":"30 segundos"}] },
    { "dia": "Martes",    "enfoque": "...", "ejercicios": [{"name":"...","label":"...","sets":3,"reps":"12"}] },
    { "dia": "Miércoles", "enfoque": "...", "ejercicios": [{"name":"...","label":"...","sets":3,"reps":"12"}] },
    { "dia": "Jueves",    "enfoque": "...", "ejercicios": [{"name":"...","label":"...","sets":3,"reps":"12"}] },
    { "dia": "Viernes",   "enfoque": "...", "ejercicios": [{"name":"...","label":"...","sets":3,"reps":"12"}] },
    { "dia": "Sábado",    "enfoque": "...", "ejercicios": [{"name":"...","label":"...","sets":3,"reps":"12"}] },
    { "dia": "Domingo",   "enfoque": "Descanso", "ejercicios": [{"name":"plank","label":"Plancha","sets":2,"reps":"30 segundos"},{"name":"run","label":"Carrera","sets":1,"reps":"20 minutos"}] }
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

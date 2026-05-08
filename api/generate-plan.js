module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { edad, peso_kg, altura_cm, objetivo } = req.body || {};
  console.log('[generate-plan] body:', { edad, peso_kg, altura_cm, objetivo });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[generate-plan] VITE_ANTHROPIC_KEY is not set');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  if (!edad || !peso_kg || !altura_cm || !objetivo) {
    return res.status(400).json({ error: 'Missing fields: edad, peso_kg, altura_cm, objetivo' });
  }

  try {
    console.log('[generate-plan] calling Anthropic...');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Eres un entrenador personal experto. Genera un plan de entrenamiento semanal personalizado en español para:
- Edad: ${edad} años
- Peso: ${peso_kg} kg
- Altura: ${altura_cm} cm
- Objetivo: ${objetivo}

Responde ÚNICAMENTE con JSON válido, sin texto adicional:
{
  "resumen": "descripción breve motivacional del plan (1-2 oraciones)",
  "dias": [
    { "dia": "Lunes", "enfoque": "nombre del tipo de entreno", "ejercicios": ["ej1", "ej2", "ej3", "ej4"] },
    { "dia": "Martes", "enfoque": "...", "ejercicios": ["..."] },
    { "dia": "Miércoles", "enfoque": "...", "ejercicios": ["..."] },
    { "dia": "Jueves", "enfoque": "...", "ejercicios": ["..."] },
    { "dia": "Viernes", "enfoque": "...", "ejercicios": ["..."] },
    { "dia": "Sábado", "enfoque": "...", "ejercicios": ["..."] },
    { "dia": "Domingo", "enfoque": "Descanso", "ejercicios": ["Descanso activo", "Stretching 15 min"] }
  ],
  "consejos": ["consejo 1", "consejo 2", "consejo 3"]
}`
        }]
      })
    });

    console.log('[generate-plan] Anthropic status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.error('[generate-plan] Anthropic error:', JSON.stringify(data));
      throw new Error(data.error?.message || `Anthropic error ${response.status}`);
    }

    const raw = data.content[0].text;
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

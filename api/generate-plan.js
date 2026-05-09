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
          { role: 'system', content: 'Eres un entrenador personal experto. Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown.' },
          { role: 'user', content: `Genera un plan de entrenamiento semanal personalizado en español para:
- Edad: ${edad} años
- Peso: ${peso_kg} kg
- Altura: ${altura_cm} cm
- Objetivo: ${objetivo}

Responde ÚNICAMENTE con este JSON:
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

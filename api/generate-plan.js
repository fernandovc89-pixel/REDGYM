export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { edad, peso_kg, altura_cm, objetivo } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
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
    { "dia": "Lunes", "enfoque": "nombre del tipo de entreno", "ejercicios": ["ejercicio 1", "ejercicio 2", "ejercicio 3", "ejercicio 4"] },
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

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Anthropic API error');

    const text = data.content[0].text;
    const plan = JSON.parse(text);
    res.json({ plan });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

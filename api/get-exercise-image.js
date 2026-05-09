const TRANSLATIONS = {
  // Lower body
  "sentadilla": "squat", "sentadillas": "squat", "squat": "squat",
  "zancada": "lunge", "zancadas": "lunge",
  "peso muerto": "deadlift",
  "prensa": "leg press", "prensa de piernas": "leg press",
  "extensiones de cuádriceps": "leg extension", "extensión de cuádriceps": "leg extension",
  "curl de femoral": "leg curl", "curl femoral": "leg curl",
  "elevación de talones": "calf raise", "elevaciones de talones": "calf raise",
  "hip thrust": "hip thrust",
  "glúteo": "glute bridge",

  // Upper body push
  "flexiones": "push up", "flexión": "push up",
  "press de banca": "bench press", "press banca": "bench press",
  "press de hombros": "shoulder press", "press militar": "overhead press",
  "press inclinado": "incline bench press",
  "fondos": "dips", "fondos en paralelas": "dips",
  "elevaciones laterales": "lateral raise",
  "elevaciones frontales": "front raise",

  // Upper body pull
  "dominadas": "pull up", "dominada": "pull up",
  "jalón al pecho": "lat pulldown", "jalón": "lat pulldown",
  "remo con barra": "barbell row", "remo": "row",
  "remo con mancuerna": "dumbbell row",
  "curl de bíceps": "bicep curl", "curl bíceps": "bicep curl", "curl biceps": "bicep curl",
  "extensión de tríceps": "tricep extension", "extensión tríceps": "tricep extension",

  // Core
  "plancha": "plank", "plank": "plank",
  "abdominales": "crunch", "abdominal": "crunch",
  "crunch": "crunch",
  "elevación de piernas": "leg raise",
  "russian twist": "russian twist",
  "mountain climbers": "mountain climber",
  "escaladores": "mountain climber",

  // Cardio
  "correr": "run", "carrera": "run",
  "saltar la cuerda": "jump rope", "cuerda": "jump rope",
  "burpees": "burpee", "burpee": "burpee",
  "jumping jacks": "jumping jack",
  "bicicleta estática": "stationary bike", "bicicleta": "stationary bike",
  "elíptica": "elliptical",
  "caminata": "walk",
  "step": "step up",
  "saltos": "jump",

  // General
  "press": "press",
  "estiramiento": "stretch", "stretching": "stretch",
  "foam roller": "foam roller",
  "descanso": null,
};

function translateExercise(name) {
  const lower = name.toLowerCase().trim();
  if (TRANSLATIONS[lower] !== undefined) return TRANSLATIONS[lower];
  // try first two words
  const twoWords = lower.split(" ").slice(0, 2).join(" ");
  if (TRANSLATIONS[twoWords] !== undefined) return TRANSLATIONS[twoWords];
  // try first word
  const firstWord = lower.split(" ")[0];
  if (TRANSLATIONS[firstWord] !== undefined) return TRANSLATIONS[firstWord];
  return lower;
}

async function searchExercise(query, apiKey) {
  if (!query) return null;
  const response = await fetch(
    `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(query)}?limit=1`,
    {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
      }
    }
  );
  const data = await response.json();
  return Array.isArray(data) && data[0]?.gifUrl ? data[0].gifUrl : null;
}

const FALLBACK_IMAGES = {
  "squat": "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=200&h=200&fit=crop",
  "push up": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop",
  "deadlift": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop",
  "run": "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=200&h=200&fit=crop",
  "default": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop"
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { name } = req.query;
  if (!name) return res.status(400).json({ gifUrl: null, error: 'name required' });

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.error('[get-exercise-image] RAPIDAPI_KEY not set');
    return res.status(200).json({ gifUrl: FALLBACK_IMAGES.default });
  }

  const translated = translateExercise(name);
  console.log('[get-exercise-image]', name, '->', translated);

  if (translated === null) {
    return res.status(200).json({ gifUrl: null });
  }

  try {
    // Pass 1: full translated name
    let gifUrl = await searchExercise(translated, apiKey);

    // Pass 2: first word only
    if (!gifUrl) {
      const firstWord = translated.split(" ")[0];
      if (firstWord !== translated) {
        console.log('[get-exercise-image] retry with first word:', firstWord);
        gifUrl = await searchExercise(firstWord, apiKey);
      }
    }

    // Fallback: category-based static image
    if (!gifUrl) {
      console.log('[get-exercise-image] no result, using fallback for:', translated);
      const fallbackKey = Object.keys(FALLBACK_IMAGES).find(k => translated.includes(k));
      gifUrl = FALLBACK_IMAGES[fallbackKey] || FALLBACK_IMAGES.default;
    }

    console.log('[get-exercise-image]', name, '->', gifUrl ? 'found' : 'none');
    return res.status(200).json({ gifUrl });
  } catch (e) {
    console.error('[get-exercise-image] error:', e.message);
    return res.status(200).json({ gifUrl: FALLBACK_IMAGES.default });
  }
};

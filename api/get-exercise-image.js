// Hardcoded map: exact AI-generated exercise names → confirmed Wger CDN image URLs.
// No external API calls — images load instantly and reliably.
const EXERCISE_IMAGES = {
  // Lower body compound
  "squat":               "https://wger.de/media/exercise-images/1801/60043328-1cfb-4289-9865-aaf64d5aaa28.jpg",
  "deadlift":            "https://wger.de/media/exercise-images/184/1709c405-620a-4d07-9658-fade2b66a2df.jpeg",
  "lunge":               "https://wger.de/media/exercise-images/984/5c7ffe68-e7b2-47f3-a22a-f9cc28640432.png",
  "leg press":           "https://wger.de/media/exercise-images/371/d2136f96-3a43-4d4c-9944-1919c4ca1ce1.webp",
  "calf raise":          "https://wger.de/media/exercise-images/1243/53d4fabe-c994-4907-873f-8d82813a9832.png",
  "hip thrust":          "https://wger.de/media/exercise-images/1642/a81ad922-caf5-47f8-99b4-640cb0717436.webp",
  "glute bridge":        "https://wger.de/media/exercise-images/1642/a81ad922-caf5-47f8-99b4-640cb0717436.webp",
  "leg curl":            "https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png",
  "leg extension":       "https://wger.de/media/exercise-images/851/4d621b17-f6cb-4107-97c0-9f44e9a2dbc6.webp",

  // Upper body push
  "push up":             "https://wger.de/media/exercise-images/1551/a6a9e561-3965-45c6-9f2b-ee671e1a3a45.png",
  "bench press":         "https://wger.de/media/exercise-images/192/Bench-press-1.png",
  "incline bench press": "https://wger.de/media/exercise-images/41/Incline-bench-press-1.png",
  "shoulder press":      "https://wger.de/media/exercise-images/123/dumbbell-shoulder-press-large-1.png",
  "overhead press":      "https://wger.de/media/exercise-images/1893/7dbad19e-0616-41fd-9d7d-3e21649c0eea.png",
  "dips":                "https://wger.de/media/exercise-images/194/34600351-8b0b-4cb0-8daa-583537be15b0.png",
  "tricep dip":          "https://wger.de/media/exercise-images/194/34600351-8b0b-4cb0-8daa-583537be15b0.png",
  "tricep extension":    "https://wger.de/media/exercise-images/50/695ced5c-9961-4076-add2-cb250d01089e.png",
  "lateral raise":       "https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-2.png",
  "front raise":         "https://wger.de/media/exercise-images/256/b7def5bc-2352-499b-b9e5-fff741003831.png",

  // Upper body pull
  "pull up":             "https://wger.de/media/exercise-images/475/b0554016-16fd-4dbe-be47-a2a17d16ae0e.jpg",
  "barbell row":         "https://wger.de/media/exercise-images/109/Barbell-rear-delt-row-1.png",
  "dumbbell row":        "https://wger.de/media/exercise-images/1186/1987a039-cf35-437e-bbdc-40c53dd7d053.jpg",
  "lat pulldown":        "https://wger.de/media/exercise-images/158/02e8a7c3-dc67-434e-a4bc-77fdecf84b49.webp",
  "bicep curl":          "https://wger.de/media/exercise-images/74/Bicep-curls-1.png",

  // Core
  "plank":               "https://wger.de/media/exercise-images/458/b7bd9c28-9f1d-4647-bd17-ab6a3adf5770.png",
  "crunch":              "https://wger.de/media/exercise-images/91/Crunches-1.png",
  "mountain climber":    "https://wger.de/media/exercise-images/1091/50c8912d-54ef-46c9-99d1-633b6196aa1e.jpg",
  "russian twist":       "https://wger.de/media/exercise-images/1193/70ca5d80-3847-4a8c-8882-c6e9e485e29e.png",
  "leg raise":           "https://wger.de/media/exercise-images/125/Leg-raises-2.png",

  // Cardio / full body
  "run":                 "https://wger.de/media/exercise-images/1615/7792295c-83b6-4ea8-9353-ce02f0ad2559.jpg",
  "burpee":              "https://wger.de/media/exercise-images/1556/a23c820b-e08b-4911-a6a4-80f16c15d2e0.png",
  "jump rope":           "https://wger.de/media/exercise-images/1615/7792295c-83b6-4ea8-9353-ce02f0ad2559.jpg",
  "step up":             "https://wger.de/media/exercise-images/984/5c7ffe68-e7b2-47f3-a22a-f9cc28640432.png",
};

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { name } = req.query;
  if (!name) return res.status(400).json({ gifUrl: null, error: 'name required' });

  const key = name.toLowerCase().trim();
  const gifUrl = EXERCISE_IMAGES[key] || null;

  console.log('[get-exercise-image]', key, '->', gifUrl ? 'found' : 'not in map');
  return res.status(200).json({ gifUrl });
};

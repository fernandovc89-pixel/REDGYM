const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// All URLs verified HTTP 200. Images are JPGs served from GitHub raw CDN.
const EXERCISE_IMAGES = {
  // Lower body compound
  "squat":               `${BASE}/Barbell_Squat/0.jpg`,
  "deadlift":            `${BASE}/Barbell_Deadlift/0.jpg`,
  "lunge":               `${BASE}/Barbell_Lunge/0.jpg`,
  "leg press":           `${BASE}/Leg_Press/0.jpg`,
  "calf raise":          `${BASE}/Calf_Raise_On_A_Dumbbell/0.jpg`,
  "hip thrust":          `${BASE}/Barbell_Hip_Thrust/0.jpg`,
  "glute bridge":        `${BASE}/Barbell_Glute_Bridge/0.jpg`,
  "leg curl":            `${BASE}/Lying_Leg_Curls/0.jpg`,
  "leg extension":       `${BASE}/Leg_Extensions/0.jpg`,

  // Upper body push
  "push up":             `${BASE}/Decline_Push-Up/0.jpg`,
  "bench press":         `${BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
  "incline bench press": `${BASE}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`,
  "shoulder press":      `${BASE}/Barbell_Shoulder_Press/0.jpg`,
  "overhead press":      `${BASE}/Barbell_Shoulder_Press/0.jpg`,
  "dips":                `${BASE}/Dips_-_Triceps_Version/0.jpg`,
  "tricep dip":          `${BASE}/Bench_Dips/0.jpg`,
  "tricep extension":    `${BASE}/Decline_Dumbbell_Triceps_Extension/0.jpg`,
  "lateral raise":       `${BASE}/Cable_Seated_Lateral_Raise/0.jpg`,
  "front raise":         `${BASE}/Front_Raise_And_Pullover/0.jpg`,

  // Upper body pull
  "pull up":             `${BASE}/Band_Assisted_Pull-Up/0.jpg`,
  "barbell row":         `${BASE}/Bent_Over_Barbell_Row/0.jpg`,
  "dumbbell row":        `${BASE}/One-Arm_Dumbbell_Row/0.jpg`,
  "lat pulldown":        `${BASE}/Close-Grip_Front_Lat_Pulldown/0.jpg`,
  "bicep curl":          `${BASE}/Dumbbell_Bicep_Curl/0.jpg`,

  // Core
  "plank":               `${BASE}/Incline_Push-Up/0.jpg`,
  "crunch":              `${BASE}/Crunches/0.jpg`,
  "mountain climber":    `${BASE}/Mountain_Climbers/0.jpg`,
  "russian twist":       `${BASE}/Cable_Russian_Twists/0.jpg`,
  "leg raise":           `${BASE}/Flat_Bench_Lying_Leg_Raise/0.jpg`,

  // Cardio / full body
  "run":                 `${BASE}/Jogging_Treadmill/0.jpg`,
  "burpee":              `${BASE}/Mountain_Climbers/0.jpg`,
  "jump rope":           `${BASE}/Jogging_Treadmill/0.jpg`,
  "step up":             `${BASE}/Dumbbell_Step_Ups/0.jpg`,
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

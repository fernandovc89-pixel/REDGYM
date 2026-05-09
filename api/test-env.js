module.exports = function handler(req, res) {
  res.json({
    hasGroqKey: !!process.env.GROQ_API_KEY,
    groqKeyPrefix: process.env.GROQ_API_KEY?.slice(0, 10) || 'missing'
  });
};

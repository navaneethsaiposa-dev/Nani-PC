import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const titleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  duration: { type: Number, required: true, min: 1 },
  genres: { type: [String], default: [] },
  moods: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  audience: { type: String, enum: ['kids', 'family', 'teen', 'adult'], required: true },
  rating: { type: String, default: 'U' },
  emoji: String,
  colors: { type: [String], default: ['#496f82', '#b8dce8'] },
  description: String,
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  provider: { type: String, default: 'other' }
}, { timestamps: true });

const Title = mongoose.models.Title || mongoose.model('Title', titleSchema);
let connectionPromise;
function connectDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');
  if (!connectionPromise) connectionPromise = mongoose.connect(process.env.MONGODB_URI);
  return connectionPromise;
}
function match(values, wanted) { return wanted ? (values || []).includes(wanted) ? 1 : 0.15 : 0.5; }
function score(title, preferences) {
  const time = title.duration <= preferences.minutes ? 1 : Math.max(0, 1 - (title.duration - preferences.minutes) / Math.max(preferences.minutes, 1));
  const audience = title.audience === preferences.audience ? 1 : preferences.audience === 'family' && title.audience === 'kids' ? 0.8 : 0.2;
  return time * 0.25 + match(title.genres, preferences.genre) * 0.2 + match(title.moods, preferences.mood) * 0.15 + match(title.languages, preferences.language) * 0.15 + audience * 0.15 + 0.1;
}
function explain(title, preferences) {
  const reasons = [];
  if (title.duration <= preferences.minutes) reasons.push(`${title.duration} minutes`);
  if (title.genres?.includes(preferences.genre)) reasons.push(`${preferences.genre} genre`);
  if (title.moods?.includes(preferences.mood)) reasons.push(`${preferences.mood} mood`);
  if (title.languages?.includes(preferences.language)) reasons.push(`${preferences.language} audio`);
  if (title.audience === preferences.audience) reasons.push('right for your audience');
  return reasons.length ? `Matches: ${reasons.join(', ')}.` : 'A balanced match for your request.';
}

app.get('/api/health', async (_, res) => {
  try { await connectDb(); res.json({ ok: true, service: 'fire-tv-just-play' }); }
  catch { res.status(500).json({ ok: false, error: 'Database unavailable' }); }
});
app.get('/api/titles', async (_, res) => {
  try { await connectDb(); res.json({ titles: await Title.find().limit(200).lean() }); }
  catch { res.status(500).json({ error: 'Could not load titles' }); }
});
app.post('/api/recommendations', async (req, res) => {
  try {
    await connectDb();
    const preferences = { minutes: Number(req.body.minutes) || 45, mood: req.body.mood, audience: req.body.audience, language: req.body.language, genre: req.body.genre };
    const limit = req.body.budget === 'three' ? 3 : 1;
    const recommendations = (await Title.find().limit(200).lean()).map(title => ({ ...title, score: score(title, preferences), why: explain(title, preferences) })).sort((a, b) => b.score - a.score).slice(0, limit);
    res.json({ recommendations, privacy: 'session-only' });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Could not create recommendations' }); }
});

export default app;

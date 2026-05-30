/**
 * FAQ Backend Server
 * Proxies Claude API calls so the API key stays server-side.
 * Node >= 18 required (uses built-in fetch).
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Simple in-memory rate limiter (20 req / min per IP) ────
const rateMap = new Map();
function rateLimit(req, res, next) {
  const ip  = req.ip;
  const now = Date.now();
  const WIN = 60_000;   // 1 minute window
  const MAX = 20;

  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > WIN) {
    rateMap.set(ip, { count: 1, start: now });
    return next();
  }
  entry.count++;
  if (entry.count > MAX) {
    return res.status(429).json({ error: 'Too many requests — please wait a moment.' });
  }
  next();
}

// ── /api/chat ───────────────────────────────────────────────
app.post('/api/chat', rateLimit, async (req, res) => {
  const { messages, system } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set.');
    return res.status(500).json({ error: 'Server is not configured. Set ANTHROPIC_API_KEY.' });
  }

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1000,
    messages: [
      { role: 'system', content: system || 'You are a helpful FAQ assistant.' },
      ...messages.slice(-10)
    ],
  }),
});

const data = await upstream.json();

if (!upstream.ok) {
  console.error('Groq error:', data);
  return res.status(upstream.status).json({
    error: data?.error?.message || 'Upstream API error.',
  });
}

const reply = data.choices[0].message.content.trim();
    res.json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── /api/health ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    version:   '1.0.0',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ── Catch-all → index.html ──────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✓ FAQ server → http://localhost:${PORT}`);
  console.log(`  API key : ${process.env.ANTHROPIC_API_KEY ? '✓ configured' : '✗ MISSING — set ANTHROPIC_API_KEY'}\n`);
});

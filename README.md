# FAQ Website with AI Chatbot

A clean, fully-featured FAQ web app with a built-in AI chatbot powered by [Groq](https://groq.com/) (Llama 3.3 70B). Designed for organisations running structured programmes (internships, fellowships, cohorts) that need a self-service knowledge base with an intelligent assistant layer on top.

---

## Features

- **Structured FAQ** — Numbered sections and questions with anchor links, a sticky sidebar table of contents, and scroll-spy highlighting
- **Live search** — Instant keyword filtering with match highlighting across all questions and answers
- **AI chatbot** — Floating chat panel backed by Groq (`llama-3.3-70b-versatile`); the bot answers *only* from the FAQ and cites exact section numbers (§X.Y) as clickable links
- **Changelog popover** — Version badge in the toolbar shows a history of FAQ updates
- **Per-answer feedback** — Thumbs up / thumbs down on every answer, persisted in `localStorage`
- **Expand / collapse all** — One-click toggle for power readers
- **"Most Asked" cards** — Configurable pinned shortcuts at the top of the page
- **Secure backend proxy** — Express server keeps your Groq API key server-side; the browser never sees it
- **Rate limiting** — 20 requests per minute per IP (configurable)
- **CORS lock** — Set `ALLOWED_ORIGIN` in `.env` to restrict API access to your domain in production

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML / CSS / JS (no build step) |
| Backend | Node.js (≥ 18) + Express |
| AI | Groq API · Llama 3.3 70B (`llama-3.3-70b-versatile`) |
| Fonts | Libre Baskerville · Source Sans 3 · JetBrains Mono |

---

## Project structure

```
faq-project/
├── server.js          ← Express backend (proxies Groq API)
├── package.json
├── .env.example       ← Copy to .env and add your API key
├── .gitignore
├── public/
│   └── index.html     ← The FAQ page (edit FAQ content here)
└── README.md
```

---

## Quick start

### 1. Clone the repo

```bash
git clone https://github.com/yourname/faq-project.git
cd faq-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your API key

```bash
cp .env.example .env
# Open .env and paste your Groq API key
# Get one free (no credit card) at: https://console.groq.com
```

### 4. Start the dev server

```bash
npm run dev
```

Visit **http://localhost:3000** — your FAQ is live.

---

## Customising the FAQ content

Open `public/index.html` and scroll to the `<script>` tag. Edit two things:

### CONFIG — your programme details

```js
const CONFIG = {
  version:   'v1.0.0',
  updated:   '2026-05-29',
  programme: 'Your Programme Name',
  org:       'Your Organisation',
  orgYear:   'Your Organisation · 2026',
};
```

### FAQ array — your questions

Each **question** follows this shape:

```js
{
  id: 'q11',        // unique ID (used for anchor links)
  num: '1.1',       // displayed question number
  q:   'Question text here?',
  a:   '<p>Answer HTML here.</p>'
}
```

Each **section** follows this shape:

```js
{
  id: 's1', num: '1', title: 'Section Title',
  items: [ /* questions */ ]
}
```

The table of contents, search index, and chatbot context all regenerate automatically from the `FAQ` array — no other files to touch.

---

## Deployment

### Option A — Railway (recommended, free tier)

1. Push to a GitHub repository
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Select your repository (Railway auto-detects Node.js)
4. Under **Variables**, add `GROQ_API_KEY`
5. Click **Deploy** — Railway gives you a live URL instantly

### Option B — Render (free tier)

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service** → connect your repo
3. Build command: `npm install` · Start command: `node server.js`
4. Under **Environment**, add `GROQ_API_KEY`
5. Click **Create Web Service**

### Option C — VPS (DigitalOcean, AWS, etc.)

```bash
git clone https://github.com/yourname/faq-project.git
cd faq-project
npm install
cp .env.example .env   # add your API key

npm install -g pm2
pm2 start server.js --name faq
pm2 save && pm2 startup
```

Then point your domain DNS to the server IP and use Nginx as a reverse proxy on port 3000.

---

## Updating the FAQ

1. Edit `public/index.html` — add or edit questions in the `FAQ` array
2. Bump `CONFIG.version` (e.g. `v1.0.0` → `v1.1.0`)
3. Update `CONFIG.updated` with today's date
4. `git push` — Railway / Render redeploys automatically

---

## Security notes

- The Groq API key lives in `.env` on the server and is **never sent to the browser**
- Rate limiting: 20 requests / minute / IP (edit `MAX` in `server.js` to change)
- `.env` is in `.gitignore` — it will not be committed to git
- Set `ALLOWED_ORIGIN` in `.env` to your live domain in production to lock down CORS

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | — | Your Groq API key — get one free at [console.groq.com](https://console.groq.com) |
| `PORT` | No | `3000` | Port the server listens on |
| `ALLOWED_ORIGIN` | No | `*` | CORS origin whitelist (set to your domain in production) |

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Proxies a chat turn to Groq; accepts `{ messages, system }` |
| `GET` | `/api/health` | Health check — returns version and API key status |

---

## License

MIT — see [LICENSE](LICENSE).

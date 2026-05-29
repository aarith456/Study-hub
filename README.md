# Study Hub

School study app: create courses, generate **Gemini** study guides for any topic (overview, concepts, practice, resources), and chat with an AI tutor (OpenAI or Gemini).

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **API keys (server-side)**  
   Copy `.env.example` to `.env` and set:
   - **Required for study guides:** [Gemini API key](https://aistudio.google.com/app/apikey) → `GEMINI_API_KEY`
   - **Optional for tutor:** `OPENAI_API_KEY` and/or `GEMINI_API_KEY`

## Run locally

### Easiest (Windows)

Double-click **`start-app.bat`** in the project folder. It starts both servers and opens http://localhost:5173/ in your browser. Keep the two command windows open while you use the app.

### Manual (two terminals)

1. **Backend:** `npm run server` — API at http://localhost:3001  
2. **Frontend:** `npm run dev` — app at http://localhost:5173  

Vite proxies `/api` to the local server.

### Troubleshooting

| Problem | Fix |
|--------|-----|
| **Error -102** or “connection refused” on localhost:5173 | The dev server is not running. Use `start-app.bat` or run `npm run dev` and leave that terminal open. |
| **`npm` is not recognized** | Install [Node.js LTS](https://nodejs.org), then **fully quit and reopen Cursor** (or open a new terminal). On Windows, Node usually installs to `C:\Program Files\nodejs`. |
| Study guides fail / “can’t reach server” | Run `npm run server` in a second terminal (or use `start-app.bat`). Set `GEMINI_API_KEY` in a `.env` file in the project root. |

## How to use

1. Open **Courses** and create a course (e.g. “AP World History”).
2. Open the course, enter a **topic** (e.g. “Industrial Revolution”), and click **Generate study guide**.
3. Gemini builds a full guide: overview, key concepts, sections, practice questions, and curated resources. Guides are saved in your browser (localStorage).
4. Use **Tutor** for follow-up questions on anything you’re learning.

## Build

```bash
npm run build
```

Output is in `dist/`.

## Deploy (Vercel)

1. Push to GitHub and import in [Vercel](https://vercel.com).
2. Set `GEMINI_API_KEY` (and optionally `OPENAI_API_KEY`) in Environment Variables.
3. Deploy. The `api/` folder runs as serverless functions; the SPA is served from `dist/`.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run server` | Local API (tutor + study guides) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

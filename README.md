# Personal AI Interview Practice Platform

A local practice tool with five interview modes. You paste the content (case books, resume, JD, question lists). Gemini runs an adaptive interviewer, you answer by voice (Whisper), and you get a scored report. Questions are shown as text — there is no text-to-speech.

Sessions are stored in SQLite (`backend/data/case_ai.db`) so they survive backend restarts.

## Modes

- **PM Cases** — product sense, guesstimates, design, metrics
- **Resume Round** — questions grounded in a pasted or uploaded resume
- **HR Round** — behavioral / STAR, culture, motivation
- **Technical Round** — spoken Q&A on a stack you specify
- **Consulting Round** — classic case interviews

## Setup

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Put your Gemini API key in `backend/.env`:

```
GEMINI_API_KEY=your_key_here
```

Optional model split (defaults fall back to `GEMINI_MODEL`):

```
GEMINI_MODEL_INTERVIEWER=gemini-flash-latest
GEMINI_MODEL_EVAL=gemini-flash-latest
GEMINI_MODEL_SUMMARY=gemini-flash-latest
```

Start the API:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8005
```

The first transcription downloads the Whisper `small` model (~500 MB). If transcription fails on WebM audio, install ffmpeg (`brew install ffmpeg` on macOS).

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set `NEXT_PUBLIC_DEBUG=true` to show the token/context debug panel during interviews.

## Flow

1. Choose a mode.
2. Paste your custom prompt (and optionally a resume PDF for Resume Round). Set difficulty and duration.
3. The interviewer asks an opening question.
4. Record an answer, review the transcript, submit.
5. Repeat until time is up or you end the interview.
6. Read the evaluation report, export Markdown/JSON, or browse History.

# Personal AI Case Interview Platform

A local practice tool: you enter a case prompt, an AI interviewer (Gemini) runs an adaptive case interview, and you answer by voice (Whisper). Questions are shown as text — there is no text-to-speech.

State lives in memory for the current backend process. Restarting the API clears interviews.

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

Start the API:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

The first transcription downloads the Whisper `small` model (~500 MB). If transcription fails on WebM audio, install ffmpeg (`brew install ffmpeg` on macOS).

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. Enter a case prompt, interview type, difficulty, and duration (15 / 30 / 45 min).
2. The interviewer asks an opening question.
3. Record an answer, review the transcript, submit.
4. Repeat until time is up or you end the interview.
5. Read the evaluation report.

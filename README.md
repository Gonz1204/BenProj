# BenPodcast — Textbook to Sports Debate

Upload photos of your textbook pages and get an AI-generated two-host sports debate podcast in the style of First Take / Undisputed. GPT-4o reads the images and writes a heated debate script; ElevenLabs voices each host separately; the audio is stitched and plays in-browser.

## Setup

### Install dependencies

```bash
npm install
```

### Environment variables

Create or edit `.env.local` in the project root:

```
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

- Get your OpenAI key: https://platform.openai.com/api-keys
- Get your ElevenLabs key: https://elevenlabs.io (Creator plan recommended for longer podcasts)

### Run in development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Deployment

### Vercel (recommended)

1. Push this folder to a GitHub repository.
2. Connect the repo at vercel.com.
3. Add both keys as Environment Variables in the Vercel project settings:
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
4. Deploy — Vercel auto-detects Next.js.

## iPhone tip

After opening the app in Safari, tap the Share button and choose "Add to Home Screen" for a full-screen, app-like experience.

## Tech stack

- Next.js 14 (App Router)
- OpenAI GPT-4o vision for script generation
- ElevenLabs TTS for dual-voice audio
- Tailwind CSS + TypeScript

# Textbook Podcast

Upload a textbook photo and get an AI-generated audio lecture powered by GPT-4o and OpenAI TTS.

## Setup

### Prerequisites
- Node.js 18+
- An OpenAI API key with access to GPT-4o and TTS

### Installation

```bash
cd benPodcast
npm install
```

### Environment

The `.env.local` file is already configured. If you need to change the API key:

```
OPENAI_API_KEY=your_api_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. In the Vercel project settings, add the environment variable:
   - `OPENAI_API_KEY` = your OpenAI API key
4. Deploy. Vercel will auto-detect Next.js.

### Netlify

1. Push to GitHub.
2. Create a new site from Git on [netlify.com](https://netlify.com).
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variable `OPENAI_API_KEY` in Site settings > Environment.
6. Install the Netlify Next.js plugin.

### Self-hosted (VPS / Docker)

```bash
npm install
npm run build
npm start
```

Or with PM2:

```bash
npm install -g pm2
npm run build
pm2 start npm --name "textbook-podcast" -- start
```

## Features

- Upload textbook photos (JPEG, PNG, HEIC from iPhone)
- GPT-4o vision extracts and rewrites content as an AP lecture script
- 6 OpenAI TTS voices to choose from with live preview
- Audio plays in-browser with download option
- Low-vision optimized UI (WCAG AAA contrast, 18px+ fonts, large tap targets)

## Tech Stack

- Next.js 14 (App Router)
- OpenAI SDK (GPT-4o + TTS-1)
- Tailwind CSS
- TypeScript

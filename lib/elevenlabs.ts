export const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  description: string
  preview_text: string
}

// Pre-curated energetic, hype voices for sports debate
export const CURATED_VOICES: ElevenLabsVoice[] = [
  {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'The Loud One',
    description: 'Deep, booming, dominant — argues like he\'s always right',
    preview_text: 'Let me tell you something, this was the most DOMINANT performance in the history of this game and nobody can tell me otherwise!',
  },
  {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'The Analyst',
    description: 'Smooth, confident — breaks it down like film study',
    preview_text: 'When you look at the tape, what you\'re seeing here is a level of strategic execution that only comes around once in a generation.',
  },
  {
    voice_id: 'VR6AewLTigWG4xSOukaG',
    name: 'The Hype Man',
    description: 'Fast-talking, excitable — can\'t contain himself on big moments',
    preview_text: 'OH WE ARE NOT DOING THIS RIGHT NOW! This is INSANE, this is HISTORIC, I have never seen anything like this in my entire career!',
  },
  {
    voice_id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'The Contrarian',
    description: 'Gravelly, skeptical — always has a counter',
    preview_text: 'I\'m gonna stop you right there because I\'ve heard this argument before and it doesn\'t hold up. Let me explain why you\'re wrong.',
  },
  {
    voice_id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'The Veteran',
    description: 'Authoritative, wise — drops knowledge like he\'s seen it all',
    preview_text: 'I\'ve been in this game for thirty years and I can tell you with complete certainty that what happened here changed everything that came after it.',
  },
  {
    voice_id: 'IKne3meq5aSn9XLyUdCD',
    name: 'The Young Gun',
    description: 'Energetic, modern — brings current energy to every take',
    preview_text: 'Bro this is actually crazy. Like we\'re sleeping on how big this actually was. This was a whole different level no cap.',
  },
  {
    voice_id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'The Closer',
    description: 'Dramatic, building — best at delivering the final take',
    preview_text: 'And when the dust settled, when the history books were written, there was only one question that mattered: were you on the right side of this moment?',
  },
]

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<ArrayBuffer> {
  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.75,
        style: 0.6,
        use_speaker_boost: true,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`)
  }

  return response.arrayBuffer()
}

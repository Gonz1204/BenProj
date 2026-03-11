import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai'

const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const
type Voice = (typeof VALID_VOICES)[number]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { script, voice } = body as { script: string; voice: string }

    if (!script || typeof script !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid script in request body.' },
        { status: 400 }
      )
    }

    const safeVoice: Voice = VALID_VOICES.includes(voice as Voice)
      ? (voice as Voice)
      : 'onyx'

    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: safeVoice,
      input: script,
      response_format: 'mp3',
    })

    // Get the raw binary data from the OpenAI response
    const arrayBuffer = await mp3Response.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="podcast.mp3"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    console.error('[/api/tts] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

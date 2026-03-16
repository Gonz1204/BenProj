import { NextRequest, NextResponse } from 'next/server'
import { synthesizeSpeech } from '@/lib/elevenlabs'
import type { DebateLine } from '@/app/api/generate/route'

export async function POST(request: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()

    // Handle preview request
    if (body.previewText && body.voiceId) {
      const audioBuffer = await synthesizeSpeech(body.previewText, body.voiceId, apiKey)
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Handle full script TTS
    const { lines, voice1Id, voice2Id } = body as {
      lines: DebateLine[]
      voice1Id: string
      voice2Id: string
    }

    if (!lines || !voice1Id || !voice2Id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const audioBuffers: ArrayBuffer[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const voiceId = line.host === 1 ? voice1Id : voice2Id

      const buffer = await synthesizeSpeech(line.text, voiceId, apiKey)
      audioBuffers.push(buffer)

      // Small delay to respect rate limits
      if (i < lines.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Concatenate all audio buffers
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0)
    const combined = new Uint8Array(totalLength)
    let offset = 0
    for (const buf of audioBuffers) {
      combined.set(new Uint8Array(buf), offset)
      offset += buf.byteLength
    }

    return new NextResponse(combined.buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'Content-Length': String(totalLength),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('TTS error:', message)

    if (message.includes('401') || message.includes('api key')) {
      return NextResponse.json({ error: '❌ ElevenLabs API key error' }, { status: 401 })
    }
    if (message.includes('429') || message.includes('quota')) {
      return NextResponse.json({ error: '❌ ElevenLabs quota exceeded — upgrade your plan' }, { status: 429 })
    }
    return NextResponse.json({ error: `❌ Audio generation failed: ${message}` }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('ElevenLabs key present:', !!process.env.ELEVENLABS_API_KEY)

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.error('ELEVENLABS_API_KEY is not set')
    return NextResponse.json(
      { error: 'ElevenLabs API key not configured' },
      { status: 500 }
    )
  }

  let voiceId: string
  let text: string

  try {
    const body = await request.json()
    voiceId = body.voiceId
    text = body.text
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!voiceId || !text) {
    return NextResponse.json({ error: 'voiceId and text are required' }, { status: 400 })
  }

  try {
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
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
      }
    )

    if (!elevenRes.ok) {
      const errorText = await elevenRes.text()
      console.error('ElevenLabs error:', elevenRes.status, errorText)
      if (elevenRes.status === 401) {
        return NextResponse.json({ error: 'ElevenLabs API key is invalid' }, { status: 401 })
      }
      if (elevenRes.status === 429) {
        return NextResponse.json({ error: 'ElevenLabs quota exceeded' }, { status: 429 })
      }
      return NextResponse.json(
        { error: `ElevenLabs error ${elevenRes.status}: ${errorText}` },
        { status: 502 }
      )
    }

    const audioBuffer = await elevenRes.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Preview route error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

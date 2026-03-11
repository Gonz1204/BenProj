import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai'

const SYSTEM_PROMPT = `You are an engaging AP US History professor recording an audio lecture. Transform the textbook content in the image into a compelling spoken lecture script for a student. Rules: Pure spoken prose only — no bullet points, headers, or markdown. Address the student directly as 'you'. Confident, clear lecture tone — explain WHY events matter, not just WHAT happened. Use verbal signposting: 'First...', 'Now here's the key thing...', 'So what does this mean for you?'. Describe any maps, diagrams, or charts verbally as a professor would. Handle blur, glare, or skewed angles gracefully — infer from context. Scale length naturally to the content in the image. Never reference 'this textbook' or 'this image' — lecture as if live. Frame significance in terms relevant to AP exam understanding. Your response must start with exactly this line: TOPIC: [3-5 word topic, underscores only, no special characters] Then a blank line, then the lecture script.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, mimeType } = body as { image: string; mimeType: string }

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Missing image or mimeType in request body.' },
        { status: 400 }
      )
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const safeMimeType = validMimeTypes.includes(mimeType) ? mimeType : 'image/jpeg'

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${safeMimeType};base64,${image}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Please transform the textbook content in this image into a lecture script.',
            },
          ],
        },
      ],
    })

    const rawText = response.choices[0]?.message?.content ?? ''

    // Parse TOPIC line and script body
    const lines = rawText.split('\n')
    let topic = 'Lecture'
    let scriptLines: string[] = []
    let foundTopic = false
    let pastBlankLine = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!foundTopic && line.startsWith('TOPIC:')) {
        const topicRaw = line.replace('TOPIC:', '').trim()
        topic = topicRaw.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
        foundTopic = true
        continue
      }
      if (foundTopic && !pastBlankLine) {
        if (line.trim() === '') {
          pastBlankLine = true
          continue
        }
      }
      if (foundTopic && pastBlankLine) {
        scriptLines.push(line)
      }
    }

    // Fallback: if parsing failed, use entire text as script
    if (scriptLines.length === 0) {
      scriptLines = lines.filter((l) => !l.startsWith('TOPIC:'))
    }

    const script = scriptLines.join('\n').trim()

    if (!script) {
      return NextResponse.json(
        { error: 'GPT-4o returned an empty script. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ script, topic })
  } catch (error: unknown) {
    console.error('[/api/generate] Error:', error)
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

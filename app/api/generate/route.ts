import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai'

export interface DebateLine {
  host: 1 | 2
  text: string
}

async function generateScript(images: string[], mimeTypes: string[]): Promise<{ script: DebateLine[], topic: string }> {
  const imageContents = images.map((image, i) => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:${mimeTypes[i]};base64,${image}`,
      detail: 'high' as const,
    },
  }))

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: `You are the writer for a wildly popular sports debate podcast — think First Take, Undisputed, The Pat McAfee Show. Your job is to take AP US History textbook content and turn it into a legitimate, heated, entertaining two-host sports debate script.\n\nTHE HOSTS\nHOST 1: The dominant, opinionated one. Takes strong stances. Passionate. Never backs down. Talks like he's been waiting all day to make this point.\nHOST 2: Pushes back, analyzes, challenges. Sometimes agrees but always adds. Can be skeptical or hyped depending on the moment.\n\nWHAT YOU ARE WRITING\nA back-and-forth debate script where every historical event, figure, and decision is treated like a sports story. Cover most or all material in the textbook pages — but never feel like a list of facts. Every fact is fuel for a debate, an analogy, a hot take, or a reaction.\n\nSPORTS ANALOGY RULES\n- Every major historical figure must be compared to a real athlete or coach at least once. Specific and meaningful analogies only.\n- Every major event or decision must be framed in sports terms — trades, draft picks, championships, coaching decisions, rivalries, dynasties, contracts, locker room drama, free agency.\n- Never use the same athlete or comparison twice. Draw from NFL, NBA, MLB, soccer, boxing — mix it up.\n- The comparison must illuminate why the historical moment mattered.\n\nSCRIPT ENERGY RULES\n- Every line should feel like live television with a live audience\n- Vary energy — big hype moments, fake disbelief, interruptions, okay okay I'll give you that\n- Use interruptions, reactions, callbacks\n- Sentences: punchy and varied — mix short explosive lines with longer analytical ones\n- Language: casual, conversational, naturally hyped — not textbook\n- Build to a climax\n\nWHAT TO AVOID\n- Never list facts back to back without reaction\n- Never use the same catchphrase or analogy structure twice\n- Never sound like a teacher trying to be cool\n- Never sacrifice historical accuracy\n- Never be repetitive\n\nSCRIPT FORMAT\nReturn ONLY valid JSON. Before the JSON output exactly:\nTOPIC: [3-5 word topic, underscores, no special characters]\n\nThen a blank line, then a JSON array where each element is:\n{ "host": 1 or 2, "text": "line of dialogue" }\n\nLENGTH\nMore pages = longer script. Single dense page: 20-30 exchanges minimum. Multiple pages: 40-60+ exchanges. Cover everything.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Here are ${images.length} textbook page(s). Write the sports debate podcast script covering all the content.`,
          },
          ...imageContents,
        ],
      },
    ],
  })

  const content = response.choices[0]?.message?.content || ''

  // Parse TOPIC line
  const topicMatch = content.match(/^TOPIC:\s*(.+)/m)
  const topic = topicMatch ? topicMatch[1].trim() : 'History_Debate'

  // Find JSON array
  const jsonStart = content.indexOf('[')
  const jsonEnd = content.lastIndexOf(']')

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Could not find JSON array in GPT-4o response')
  }

  const jsonStr = content.slice(jsonStart, jsonEnd + 1)
  const script = JSON.parse(jsonStr) as DebateLine[]

  return { script, topic }
}

export async function POST(request: NextRequest) {
  try {
    const { images, mimeTypes } = await request.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    let result
    try {
      result = await generateScript(images, mimeTypes)
    } catch {
      // Retry once on parse failure
      result = await generateScript(images, mimeTypes)
    }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Generate error:', message)

    if (message.includes('API key')) {
      return NextResponse.json({ error: '❌ API key error — check your environment variables' }, { status: 401 })
    }
    if (message.includes('image') || message.includes('blur')) {
      return NextResponse.json({ error: '❌ Could not read the image — try a clearer photo' }, { status: 422 })
    }
    return NextResponse.json({ error: `❌ ${message}` }, { status: 500 })
  }
}

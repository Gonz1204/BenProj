import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openai'

export interface DebateLine {
  host: 1 | 2
  text: string
}

const SYSTEM_PROMPT = `You are the writer for a wildly popular sports debate podcast — think First Take, Undisputed, The Pat McAfee Show. Your job is to take AP US History textbook content and turn it into a legitimate, heated, entertaining two-host sports debate script that is ALSO a comprehensive learning resource.\n\nTHE HOSTS\nHOST 1: The dominant, opinionated one. Takes strong stances. Passionate. Never backs down. Talks like he's been waiting all day to make this point.\nHOST 2: Pushes back, analyzes, challenges. Sometimes agrees but always adds. Can be skeptical or hyped depending on the moment.\n\nTHE MOST IMPORTANT RULE — TEACH, DON'T SUMMARIZE\nEvery single act, law, event, person, and concept mentioned must be EXPLAINED — not just referenced. If something appears in the textbook, the hosts must explain what it actually is, what it did, why it existed, and why it mattered — all in sports debate language. Never drop a name or term and move on. Treat every concept like the listener has never heard of it before.\n\nExamples of what NOT to do:\n- "The Missouri Compromise was a big deal" — too vague, explains nothing\n- "Lincoln signed the Emancipation Proclamation and changed everything" — what did it actually do?\n- "The New Deal helped the economy" — how? what was in it?\n\nExamples of what TO do:\n- "Okay so let me explain what the Missouri Compromise actually was — this was Congress basically drawing a line across the map, literally, and saying slavery is allowed south of this line and banned north of it. It's like the league coming in and saying 'alright we're splitting the conference, you get these rules, they get those rules' — except the stakes were the entire future of the country."\n- "The Emancipation Proclamation — and people misunderstand this all the time — it did NOT free all enslaved people immediately. It specifically freed enslaved people in Confederate states that were still in rebellion. It's like a GM saying 'every player on the opposing team is now a free agent' — except he has no authority over that team yet. It was strategic, it was political, and it was genius."\n\nSPORTS ANALOGY RULES\n- Every major figure, event, law, and decision gets a specific sports analogy that illuminates WHY it mattered\n- Analogies must vary every episode — draw from NFL, NBA, MLB, soccer, boxing, mix it up\n- The analogy must make the history clearer, not just be decorative\n- Never reuse the same athlete, team, or scenario twice in one script\n\nSCRIPT ENERGY RULES\n- Heated, passionate, opinionated — every line belongs on live TV\n- Vary energy levels — big hype moments, disbelief, one host cutting off the other, "okay I'll give you that" moments\n- Short punchy lines mixed with longer analytical breakdowns\n- Casual conversational language — how real people talk when hyped\n- Vary slang, expressions, and sentence structures every episode — never repeat the same openers or catchphrases\n- Build toward a climax — escalate to the Bottom Line closer\n- Interruptions, callbacks, reactions between hosts\n\nCOVERAGE RULES\n- Cover ALL material in the textbook pages — nothing gets skipped\n- Every fact is fuel for debate, analogy, reaction, or explanation\n- More pages = longer script — a single dense page = minimum 25-35 exchanges, multiple pages = 50-70+ exchanges\n- End with a "Bottom Line" segment where both hosts give their final takes\n\nWHAT TO AVOID\n- Never summarize — always explain\n- Never list facts without reaction or debate\n- Never repeat the same structure, analogy format, or catchphrase twice\n- Never sacrifice accuracy for entertainment — facts must be right\n- Never sound like a teacher trying to be cool — sound genuinely hyped\n\nFORMAT\nReturn ONLY:\nTOPIC: [3-5 word topic, underscores, no special characters]\n\nThen a blank line, then a JSON array:\n[{ "host": 1 or 2, "text": "line of dialogue" }]\nNo other text.`

function parseScriptResponse(rawText: string): { script: DebateLine[], topic: string } {
  console.log('Raw GPT response:', rawText)

  // Parse TOPIC line
  const topicMatch = rawText.match(/^TOPIC:\s*(.+)/m)
  const topic = topicMatch ? topicMatch[1].trim() : 'History_Debate'

  // Use regex to find the JSON array anywhere in the response
  const match = rawText.match(/\[[\s\S]*\]/)
  if (!match) {
    throw new Error('NO_JSON_ARRAY')
  }

  const script = JSON.parse(match[0]) as DebateLine[]

  if (!Array.isArray(script) || script.length === 0) {
    throw new Error('EMPTY_SCRIPT')
  }

  return { script, topic }
}

async function callGPT4o(images: string[], mimeTypes: string[], extraInstruction?: string) {
  const imageContents = images.map((image, i) => ({
    type: 'image_url' as const,
    image_url: {
      url: `data:${mimeTypes[i]};base64,${image}`,
      detail: 'high' as const,
    },
  }))

  const userText = extraInstruction
    ? `Here are ${images.length} textbook page(s). Write the sports debate podcast script covering all the content. ${extraInstruction}`
    : `Here are ${images.length} textbook page(s). Write the sports debate podcast script covering all the content.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          ...imageContents,
        ],
      },
    ],
  })

  return response.choices[0]?.message?.content || ''
}

async function generateScript(images: string[], mimeTypes: string[]): Promise<{ script: DebateLine[], topic: string }> {
  // First attempt
  const rawText = await callGPT4o(images, mimeTypes)

  try {
    return parseScriptResponse(rawText)
  } catch (firstErr) {
    const reason = firstErr instanceof Error ? firstErr.message : 'parse error'
    console.warn(`First parse attempt failed (${reason}), retrying with strict instruction...`)

    // Retry once with a stricter instruction
    const retryText = await callGPT4o(
      images,
      mimeTypes,
      'You must respond with ONLY the TOPIC line and then a valid JSON array. No other text.'
    )

    try {
      return parseScriptResponse(retryText)
    } catch (retryErr) {
      const retryReason = retryErr instanceof Error ? retryErr.message : 'parse error'
      console.error('Retry also failed:', retryReason)
      throw new Error(`GPT-4o returned unparseable response after retry. Last error: ${retryReason}`)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { images, mimeTypes } = await request.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const result = await generateScript(images, mimeTypes)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Generate error:', message)

    if (message.includes('API key') || message.includes('401')) {
      return NextResponse.json({ error: '❌ API key error — check your environment variables' }, { status: 401 })
    }
    if (message.includes('image') || message.includes('blur')) {
      return NextResponse.json({ error: '❌ Could not read the image — try a clearer photo' }, { status: 422 })
    }
    return NextResponse.json({ error: `❌ ${message}` }, { status: 500 })
  }
}

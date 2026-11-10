import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const guideSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['introduction', 'schedule', 'localTips', 'gettingAround', 'foodNearby', 'estimatedBudget'],
  properties: {
    introduction: { type: 'string' },
    schedule: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['time', 'title', 'details'],
        properties: { time: { type: 'string' }, title: { type: 'string' }, details: { type: 'string' } },
      },
    },
    localTips: { type: 'array', items: { type: 'string' } },
    gettingAround: { type: 'string' },
    foodNearby: { type: 'string' },
    estimatedBudget: { type: 'string' },
  },
} as const

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Detailed guides are not configured yet. Please try again later.' }, { status: 503 })
  }

  let input: { destination?: unknown; dayNumber?: unknown; title?: unknown; activities?: unknown; travelStyles?: unknown }
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Please provide valid guide details.' }, { status: 400 })
  }

  const destination = typeof input.destination === 'string' ? input.destination.trim().slice(0, 120) : ''
  const title = typeof input.title === 'string' ? input.title.trim().slice(0, 140) : ''
  const dayNumber = Number(input.dayNumber)
  const activities = Array.isArray(input.activities)
    ? input.activities.filter((item): item is string => typeof item === 'string').slice(0, 8).map((item) => item.slice(0, 180))
    : []
  const travelStyles = Array.isArray(input.travelStyles)
    ? input.travelStyles.filter((item): item is string => typeof item === 'string').slice(0, 6).map((item) => item.slice(0, 40))
    : []

  if (!destination || !title || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 30 || activities.length === 0) {
    return NextResponse.json({ error: 'A destination, day title, and activities are required.' }, { status: 400 })
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.72,
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'travel_day_guide', strict: true, schema: guideSchema },
        },
        messages: [
          {
            role: 'system',
            content: `You are the thoughtful, highly perceptive travel editor behind a premium-feeling independent city guide. Write in warm, natural English with an elegant, vivid voice: specific and human, never breathless, salesy, generic, or stuffed with travel clichés. Make this feel personally composed for this traveler, not like a template. Build a coherent day arc from the supplied stops: explain the sense of place, why the sequence works, and how to enjoy transitions and pauses. Adapt recommendations to the selected travel styles. Return 3-5 schedule entries with useful suggested time windows (clearly approximate), engaging short titles, and concrete practical detail. Include 3-5 genuinely useful local tips, thoughtful transport guidance, nearby food ideas, and an honest per-person budget range with currency or an explicit note that it varies. Be grounded: never claim live research, invent exact opening hours, current prices, transit schedules, availability, or specific venues you cannot confidently identify. If uncertain, say so naturally and suggest what to verify with official sources. Avoid repeating the same advice across sections. Keep the introduction to 2-3 evocative but informative sentences; keep each schedule detail concise and actionable. Return only the requested JSON.`,
          },
          {
            role: 'user',
            content: JSON.stringify({ destination, dayNumber, title, activities, travelStyles }),
          },
        ],
        max_tokens: 1400,
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Day guide provider returned an error:', response.status)
      return NextResponse.json({ error: 'The guide service is temporarily unavailable. Please try again.' }, { status: 502 })
    }

    const completion = await response.json()
    const content = completion.choices?.[0]?.message?.content
    if (typeof content !== 'string') throw new Error('Empty guide response')
    const guide = JSON.parse(content)
    return NextResponse.json({ guide }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Unable to generate day guide:', error)
    return NextResponse.json({ error: 'The guide could not be created. Please try again.' }, { status: 502 })
  }
}

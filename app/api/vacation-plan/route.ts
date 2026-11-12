import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

type Activity = { time: string; title: string; place: string; details: string; duration: string }
type ItineraryDay = { title: string; theme: string; activities: Activity[] }
type VacationPlan = {
  headline: string
  overview: string
  destinationFit: string
  bestTimeNote: string
  days: ItineraryDay[]
  restaurants: { name: string; cuisine: string; whyItFits: string; priceLevel: string; area: string }[]
  excursions: { name: string; description: string; duration: string; effort: string }[]
  stayAdvice: { area: string; reason: string; style: string }
  transportAdvice: string
  budgetBreakdown: { category: string; estimate: string }[]
  budgetNote: string
}

const schema = {
  type: 'object', additionalProperties: false,
  required: ['headline','overview','destinationFit','bestTimeNote','days','restaurants','excursions','stayAdvice','transportAdvice','budgetBreakdown','budgetNote'],
  properties: {
    headline: { type: 'string' }, overview: { type: 'string' }, destinationFit: { type: 'string' }, bestTimeNote: { type: 'string' },
    days: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['title','theme','activities'], properties: {
      title: { type: 'string' }, theme: { type: 'string' }, activities: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['time','title','place','details','duration'], properties: {
        time: { type: 'string' }, title: { type: 'string' }, place: { type: 'string' }, details: { type: 'string' }, duration: { type: 'string' },
      } } },
    } } },
    restaurants: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name','cuisine','whyItFits','priceLevel','area'], properties: {
      name: { type: 'string' }, cuisine: { type: 'string' }, whyItFits: { type: 'string' }, priceLevel: { type: 'string' }, area: { type: 'string' },
    } } },
    excursions: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name','description','duration','effort'], properties: {
      name: { type: 'string' }, description: { type: 'string' }, duration: { type: 'string' }, effort: { type: 'string' },
    } } },
    stayAdvice: { type: 'object', additionalProperties: false, required: ['area','reason','style'], properties: { area: { type: 'string' }, reason: { type: 'string' }, style: { type: 'string' } } },
    transportAdvice: { type: 'string' },
    budgetBreakdown: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['category','estimate'], properties: { category: { type: 'string' }, estimate: { type: 'string' } } } },
    budgetNote: { type: 'string' },
  },
} as const

async function findWikimediaPhoto(query: string) {
  try {
    const params = new URLSearchParams({
      action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${query}`, gsrnamespace: '6', gsrwhat: 'text', gsrlimit: '1',
      prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1200', format: 'json', origin: '*',
    })
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': 'TravelAI vacation planner/1.0 (place photo lookup)' }, next: { revalidate: 86400 },
    })
    if (!response.ok) return null
    const data = await response.json()
    const page = Object.values(data.query?.pages ?? {})[0] as { title?: string; imageinfo?: { thumburl?: string; url?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] } | undefined
    const image = page?.imageinfo?.[0]
    const url = image?.thumburl || image?.url
    if (!url) return null
    const artist = image?.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '').slice(0, 180) || 'Wikimedia Commons contributor'
    const license = image?.extmetadata?.LicenseShortName?.value?.replace(/<[^>]*>/g, '').slice(0, 80) || 'Wikimedia Commons'
    return { url, attribution: `${artist} · ${license}`, sourceUrl: image?.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page?.title || '')}` }
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'The AI planner is not configured yet. Add OPENAI_API_KEY to the deployment environment.' }, { status: 503 })

  let input: Record<string, unknown>
  try { input = await request.json() } catch { return NextResponse.json({ error: 'Please submit valid trip preferences.' }, { status: 400 }) }

  const destination = typeof input.destination === 'string' ? input.destination.trim().slice(0, 120) : ''
  const duration = Math.min(14, Math.max(3, Number(input.duration) || 5))
  const travelers = Math.min(12, Math.max(1, Number(input.travelers) || 2))
  const budget = typeof input.budget === 'string' ? input.budget.slice(0, 40) : 'mid-range'
  const travelStyles = Array.isArray(input.travelStyles) ? input.travelStyles.filter((value): value is string => typeof value === 'string').slice(0, 8) : []
  const interests = Array.isArray(input.interests) ? input.interests.filter((value): value is string => typeof value === 'string').slice(0, 8).map((value) => value.slice(0, 60)) : []
  const dates = typeof input.dates === 'string' ? input.dates.slice(0, 80) : 'Flexible dates'
  const needs = typeof input.needs === 'string' ? input.needs.trim().slice(0, 400) : ''
  if (!destination) return NextResponse.json({ error: 'Enter a destination to build your vacation plan.' }, { status: 400 })

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.55,
        response_format: { type: 'json_schema', json_schema: { name: 'personal_vacation_plan', strict: true, schema } },
        messages: [
          { role: 'system', content: `You are a meticulous, independent AI travel planner. Create a coherent, high-quality vacation for the supplied traveler. Return exactly the requested number of days. Each day needs 2-3 real, distinctive sights or places with realistic geographic grouping and a sensible morning/afternoon/evening rhythm. Name only real places and restaurants you are reasonably confident exist; do not claim live availability or fabricate current opening hours, prices, transit timetables, or booking status. Restaurant recommendations must be recognizable real venues only when confident; otherwise return a cuisine/area-based suggestion and make that explicit in its name (for example "A well-reviewed trattoria in Trastevere"). Explain why each choice fits the user rather than calling everything “best”. Include 3-5 restaurant options, 2-4 excursions, practical hotel-area advice, transport, and an estimated per-person budget breakdown appropriate to the budget and duration. Clearly label estimates and say what is excluded. Adapt for traveler count, dates, interests, style, budget, and accessibility/other needs. For unspecified details, make reasonable assumptions and mention them briefly in overview. Write in polished, warm English.` },
          { role: 'user', content: JSON.stringify({ destination, durationDays: duration, travelers, budget, travelStyles, interests, dates, additionalNeeds: needs }) },
        ], max_tokens: 5000,
      }), cache: 'no-store',
    })
    if (!response.ok) {
      console.error('Vacation planner provider returned an error:', response.status)
      return NextResponse.json({ error: 'The travel planner is temporarily unavailable. Please try again.' }, { status: 502 })
    }
    const completion = await response.json()
    const content = completion.choices?.[0]?.message?.content
    if (typeof content !== 'string') throw new Error('Empty vacation plan response')
    const plan = JSON.parse(content) as VacationPlan
    const days = await Promise.all(plan.days.map(async (day) => {
      const photo = await findWikimediaPhoto(`${day.activities[0]?.place || day.title} ${destination}`)
      return { ...day, photo }
    }))
    return NextResponse.json({ plan: { ...plan, days } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Unable to build vacation plan:', error)
    return NextResponse.json({ error: 'We could not complete this vacation plan. Please try again.' }, { status: 502 })
  }
}

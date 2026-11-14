import { createGoogle } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireActiveSubscription } from '@/lib/app-access'

export const runtime = 'nodejs'
export const maxDuration = 60

const activitySchema = z.object({
  time: z.string(),
  title: z.string(),
  place: z.string(),
  details: z.string(),
  duration: z.string(),
})

const daySchema = z.object({
  title: z.string(),
  theme: z.string(),
  activities: z.array(activitySchema).min(2).max(3),
})

const restaurantSchema = z.object({
  name: z.string(),
  cuisine: z.string(),
  whyItFits: z.string(),
  priceLevel: z.string(),
  area: z.string(),
})

const excursionSchema = z.object({
  name: z.string(),
  description: z.string(),
  duration: z.string(),
  effort: z.string(),
})

const chunkPlanSchema = (duration: number) =>
  z.object({
    headline: z.string(),
    overview: z.string(),
    destinationFit: z.string(),
    bestTimeNote: z.string(),
    days: z.array(daySchema).length(duration),
    restaurants: z.array(restaurantSchema).min(2).max(4),
    excursions: z.array(excursionSchema).min(1).max(2),
    stayAdvice: z.object({
      area: z.string(),
      reason: z.string(),
      style: z.string(),
    }),
    transportAdvice: z.string(),
    budgetBreakdown: z.array(
      z.object({
        category: z.string(),
        estimate: z.string(),
      }),
    ).min(2).max(4),
    budgetNote: z.string(),
  })

type Activity = z.infer<typeof activitySchema>
type DayPlan = z.infer<typeof daySchema>
type Restaurant = z.infer<typeof restaurantSchema>
type Excursion = z.infer<typeof excursionSchema>
type BudgetBreakdown = { category: string; estimate: string }
type ChunkPlan = {
  headline: string
  overview: string
  destinationFit: string
  bestTimeNote: string
  days: DayPlan[]
  restaurants: Restaurant[]
  excursions: Excursion[]
  stayAdvice: { area: string; reason: string; style: string }
  transportAdvice: string
  budgetBreakdown: BudgetBreakdown[]
  budgetNote: string
}

async function findWikimediaPhoto(query: string) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `filetype:bitmap ${query}`,
      gsrnamespace: '6',
      gsrwhat: 'text',
      gsrlimit: '1',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1200',
      format: 'json',
      origin: '*',
    })

    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': 'TravelAI vacation planner/1.0 (place photo lookup)' },
      next: { revalidate: 86400 },
    })

    if (!response.ok) return null

    const data = await response.json()
    const page = Object.values(data.query?.pages ?? {})[0] as {
      title?: string
      imageinfo?: Array<{
        thumburl?: string
        url?: string
        descriptionurl?: string
        extmetadata?: Record<string, { value?: string }>
      }>
    }

    const image = page?.imageinfo?.[0]
    const url = image?.thumburl || image?.url
    if (!url) return null

    const artist = image?.extmetadata?.Artist?.value?.replace(/<[^>]*>/g, '').slice(0, 180) || 'Wikimedia Commons contributor'
    const license = image?.extmetadata?.LicenseShortName?.value?.replace(/<[^>]*>/g, '').slice(0, 80) || 'Wikimedia Commons'

    return {
      url,
      attribution: `${artist} · ${license}`,
      sourceUrl: image?.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page?.title || '')}`,
    }
  } catch {
    return null
  }
}

function mergeBudgetBreakdown(items: BudgetBreakdown[]) {
  const map = new Map<string, string>()

  for (const item of items) {
    if (!item?.category) continue
    map.set(item.category, item.estimate)
  }

  return Array.from(map.entries()).map(([category, estimate]) => ({ category, estimate }))
}

function dedupeByName<T extends { name?: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.name ?? JSON.stringify(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function mergeChunkPlans(chunkPlans: ChunkPlan[]) {
  const mergedDays = chunkPlans.flatMap((chunk) => chunk.days)
  const mergedRestaurants = chunkPlans.flatMap((chunk) => chunk.restaurants)
  const mergedExcursions = chunkPlans.flatMap((chunk) => chunk.excursions)

  return {
    headline: chunkPlans[0]?.headline ?? 'Custom vacation plan',
    overview: chunkPlans.map((chunk) => chunk.overview).filter(Boolean).join(' '),
    destinationFit: chunkPlans[0]?.destinationFit ?? 'Designed around your interests and pace.',
    bestTimeNote: chunkPlans[0]?.bestTimeNote ?? 'Flexible timing works well for this itinerary.',
    days: mergedDays,
    restaurants: dedupeByName(mergedRestaurants).slice(0, 5),
    excursions: dedupeByName(mergedExcursions).slice(0, 4),
    stayAdvice: chunkPlans[0]?.stayAdvice ?? {
      area: 'City center or central neighborhood',
      reason: 'Convenient access to the best local experiences.',
      style: 'Balanced and comfortable',
    },
    transportAdvice: chunkPlans.map((chunk) => chunk.transportAdvice).filter(Boolean).join(' '),
    budgetBreakdown: mergeBudgetBreakdown(chunkPlans.flatMap((chunk) => chunk.budgetBreakdown)).slice(0, 7),
    budgetNote: chunkPlans.map((chunk) => chunk.budgetNote).filter(Boolean).join(' '),
  }
}

async function generateVacationChunk({
  google,
  destination,
  duration,
  travelers,
  budget,
  travelStyles,
  interests,
  dates,
  needs,
  chunkIndex,
  totalChunks,
}: {
  google: ReturnType<typeof createGoogle>
  destination: string
  duration: number
  travelers: number
  budget: string
  travelStyles: string[]
  interests: string[]
  dates: string
  needs: string
  chunkIndex: number
  totalChunks: number
}) {
  const { output } = await generateText({
    model: google('gemini-3.1-flash-lite'),
    output: Output.object({
      schema: chunkPlanSchema(duration),
      name: `vacation_plan_chunk_${chunkIndex + 1}`,
    }),
    temperature: 0.55,
    maxOutputTokens: 3600,
    prompt: `
You are a meticulous independent AI travel planner.
Create a coherent, high-quality trip for the traveler below.

Trip details:
- Destination: ${destination}
- Duration (this chunk): ${duration} days
- Chunk: ${chunkIndex + 1}/${totalChunks}
- Travelers: ${travelers}
- Budget: ${budget}
- Travel styles: ${travelStyles.length ? travelStyles.join(', ') : 'Flexible'}
- Interests: ${interests.length ? interests.join(', ') : 'Balanced sightseeing'}
- Dates: ${dates}
- Special needs: ${needs || 'None'}

Rules:
- Return exactly ${duration} days.
- Each day must have 2-3 realistic activities with title, place, details, and duration.
- Keep the trip cohesive and locally grounded.
- Give practical, actionable advice.
- Be concise but rich in detail.
- Return valid JSON matching the schema exactly.
    `,
  })

  return output as ChunkPlan
}

export async function POST(request: Request) {
  const access = await requireActiveSubscription(request)
  if (!access.ok) return access.response

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Please submit valid trip preferences.' }, { status: 400 })
  }

  const destination = typeof input.destination === 'string' ? input.destination.trim().slice(0, 120) : ''
  const requestedDuration = Number(input.duration)
  const allowedDurations = [3, 5, 7, 10, 14]
  const duration = allowedDurations.includes(requestedDuration) ? requestedDuration : 5

  const travelers = Math.min(12, Math.max(1, Number(input.travelers) || 2))
  const budget = typeof input.budget === 'string' ? input.budget.slice(0, 40) : 'mid-range'
  const travelStyles = Array.isArray(input.travelStyles)
    ? input.travelStyles.filter((value): value is string => typeof value === 'string').slice(0, 8).map((value) => value.slice(0, 40))
    : []
  const interests = Array.isArray(input.interests)
    ? input.interests.filter((value): value is string => typeof value === 'string').slice(0, 8).map((value) => value.slice(0, 60))
    : []
  const dates = typeof input.dates === 'string' ? input.dates.slice(0, 80) : 'Flexible dates'
  const needs = typeof input.needs === 'string' ? input.needs.trim().slice(0, 400) : ''

  if (!destination) {
    return NextResponse.json({ error: 'Enter a destination to build your vacation plan.' }, { status: 400 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      error: 'Gemini API key is missing. Add a Google AI Studio key to use the free-tier model.',
      helpUrl: 'https://aistudio.google.com/apikey',
    }, { status: 503 })
  }

  try {
    const google = createGoogle({ apiKey: process.env.GEMINI_API_KEY })

    let chunkSizes: number[] = [duration]

    if (duration === 10) {
      chunkSizes = [5, 5]
    } else if (duration === 14) {
      chunkSizes = [7, 7]
    }

    const chunkPlans = await Promise.all(
      chunkSizes.map(async (chunkDuration, index) => {
        return generateVacationChunk({
          google,
          destination,
          duration: chunkDuration,
          travelers,
          budget,
          travelStyles,
          interests,
          dates,
          needs,
          chunkIndex: index,
          totalChunks: chunkSizes.length,
        })
      }),
    )

    const output = mergeChunkPlans(chunkPlans)

    const photoDays = await Promise.all(
      output.days.map(async (day) => {
        const photo = await findWikimediaPhoto(`${day.activities[0]?.place || day.title} ${destination}`)
        return { ...day, photo }
      }),
    )

    return NextResponse.json(
      {
        plan: {
          ...output,
          days: photoDays,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[v0] Unable to build vacation plan:', error)
    const message = error instanceof Error ? error.message : ''
    const quotaExceeded = /429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(message)
    const invalidKey = /API_KEY_INVALID|API key not valid|unauthenticated|401/i.test(message)

    return NextResponse.json({
      error: quotaExceeded
        ? 'Gemini free-tier quota reached. Please wait before trying again.'
        : invalidKey
          ? 'Gemini rejected the API key. Check your Google AI Studio key and try again.'
          : 'Gemini could not complete this vacation plan. Please try again.',
      ...(quotaExceeded
        ? { helpUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits' }
        : invalidKey
          ? { helpUrl: 'https://aistudio.google.com/apikey' }
          : {}),
    }, { status: quotaExceeded ? 429 : invalidKey ? 401 : 502 })
  }
}

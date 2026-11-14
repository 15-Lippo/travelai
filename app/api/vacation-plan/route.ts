import { createGoogle } from '@ai-sdk/google'
import { generateText, Output } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireActiveSubscription } from '@/lib/app-access'
import { resolveLocale } from '@/lib/i18n'

export const runtime = 'nodejs'
export const maxDuration = 60

const activitySchema = z.object({
  time: z.string(),
  title: z.string(),
  place: z.string(),
  details: z.string(),
  duration: z.string(),
  gettingThere: z.string(),
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

const travelEssentialsSchema = z.object({
  localTransport: z.string(),
  paymentAndCurrency: z.string(),
  connectivity: z.string(),
  safety: z.string(),
  accessibility: z.string(),
  bookAhead: z.array(z.string()).min(2).max(5),
})

const chunkPlanSchema = (duration: number, isSingleChunk: boolean) =>
  z.object({
    headline: z.string(),
    overview: z.string(),
    destinationFit: z.string(),
    bestTimeNote: z.string(),
    days: z.array(daySchema).length(duration),
    restaurants: z.array(restaurantSchema).min(isSingleChunk ? 3 : 2).max(4),
    excursions: z.array(excursionSchema).min(isSingleChunk ? 2 : 1).max(3),
    stayAdvice: z.object({
      area: z.string(),
      reason: z.string(),
      style: z.string(),
    }),
    transportAdvice: z.string(),
    travelEssentials: travelEssentialsSchema,
    budgetBreakdown: z.array(
      z.object({
        category: z.string(),
        estimate: z.string(),
      }),
    ).min(3).max(5),
    budgetNote: z.string(),
  })

type DayPlan = z.infer<typeof daySchema>
type Restaurant = z.infer<typeof restaurantSchema>
type Excursion = z.infer<typeof excursionSchema>
type BudgetBreakdown = { category: string; estimate: string }
type TravelEssentials = z.infer<typeof travelEssentialsSchema>
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
  travelEssentials: TravelEssentials
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
    const key = (item.name ?? JSON.stringify(item)).trim().toLocaleLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function mergeChunkPlans(chunkPlans: ChunkPlan[]) {
  const firstChunk = chunkPlans[0]
  const mergedDays = chunkPlans.flatMap((chunk) => chunk.days)
  const mergedRestaurants = chunkPlans.flatMap((chunk) => chunk.restaurants)
  const mergedExcursions = chunkPlans.flatMap((chunk) => chunk.excursions)

  return {
    headline: firstChunk.headline,
    overview: chunkPlans.map((chunk) => chunk.overview).filter(Boolean).join(' '),
    destinationFit: firstChunk.destinationFit,
    bestTimeNote: firstChunk.bestTimeNote,
    days: mergedDays,
    restaurants: dedupeByName(mergedRestaurants).slice(0, 5),
    excursions: dedupeByName(mergedExcursions).slice(0, 4),
    stayAdvice: firstChunk.stayAdvice,
    transportAdvice: chunkPlans.map((chunk) => chunk.transportAdvice).filter(Boolean).join(' '),
    travelEssentials: firstChunk.travelEssentials,
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
  responseLanguage,
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
  responseLanguage: string
  chunkIndex: number
  totalChunks: number
}) {
  const dayStart = chunkIndex * duration + 1
  const dayEnd = dayStart + duration - 1
  const { output } = await generateText({
    model: google('gemini-3.1-flash-lite'),
    output: Output.object({
      schema: chunkPlanSchema(duration, totalChunks === 1),
      name: `vacation_plan_chunk_${chunkIndex + 1}`,
    }),
    temperature: 0.55,
    maxOutputTokens: 5000,
    prompt: `You are a meticulous independent AI travel planner. Create a coherent, high-quality vacation plan in ${responseLanguage}.

Traveler preferences:
- Destination: ${destination}
- Total trip: ${duration * totalChunks} days. This is chunk ${chunkIndex + 1} of ${totalChunks}, covering trip days ${dayStart}-${dayEnd}.
- Travelers: ${travelers}
- Budget: ${budget}
- Travel styles: ${travelStyles.length ? travelStyles.join(', ') : 'Flexible'}
- Interests: ${interests.length ? interests.join(', ') : 'Balanced sightseeing'}
- Dates: ${dates}
- Additional needs: ${needs || 'None'}

Requirements:
- Return exactly ${duration} days for trip days ${dayStart}-${dayEnd}; do not repeat activities from another chunk.
- Each day must include 2-3 realistic activities.
- Every activity must include time, title, place, details, duration, and gettingThere. Include practical approximate transit guidance in gettingThere; do not invent live departure times, exact fares, opening hours, or availability.
- Keep days geographically sensible and the second chunk a natural continuation of the first.
- Include practical destination advice and estimates, clearly avoiding claims of live availability.
- Keep descriptions concise and return an object matching the supplied schema exactly.`,
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

  const locale = resolveLocale(input.language === 'it' ? 'it' : 'en')
  const localized = (english: string, italian: string) => locale === 'it' ? italian : english
  const responseLanguage = locale === 'it' ? 'Italian' : 'English'
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
    return NextResponse.json({
      error: localized('Enter a destination to build your vacation plan.', 'Inserisci una destinazione per creare il tuo itinerario.'),
    }, { status: 400 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      error: localized(
        'Gemini API key is missing. Add a Google AI Studio key to use the free-tier model.',
        'La chiave API di Gemini non è configurata. Aggiungi una chiave Google AI Studio per usare il modello gratuito.',
      ),
      helpUrl: 'https://aistudio.google.com/apikey',
    }, { status: 503 })
  }

  try {
    const google = createGoogle({ apiKey: process.env.GEMINI_API_KEY })
    const chunkSizes = duration === 10 ? [5, 5] : duration === 14 ? [7, 7] : [duration]

    const chunkPlans = await Promise.all(
      chunkSizes.map((chunkDuration, index) => generateVacationChunk({
        google,
        destination,
        duration: chunkDuration,
        travelers,
        budget,
        travelStyles,
        interests,
        dates,
        needs,
        responseLanguage,
        chunkIndex: index,
        totalChunks: chunkSizes.length,
      })),
    )

    const output = mergeChunkPlans(chunkPlans)
    if (output.days.length !== duration) {
      throw new Error(`Generated ${output.days.length} days; expected ${duration}.`)
    }

    const photoDays = await Promise.all(output.days.map(async (day) => {
      const photo = await findWikimediaPhoto(`${day.activities[0]?.place || day.title} ${destination}`)
      return { ...day, photo }
    }))

    return NextResponse.json(
      { plan: { ...output, days: photoDays } },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[vacation-plan] Generation failed:', message)

    const quotaExceeded = /429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(message)
    const invalidKey = /API_KEY_INVALID|API key not valid|unauthenticated|401/i.test(message)
    const timeout = /timeout|timed out|deadline|FUNCTION_INVOCATION_TIMEOUT/i.test(message)
    const localizedError = quotaExceeded
      ? localized('Gemini free-tier quota reached. Please wait before trying again.', 'Hai raggiunto il limite gratuito di Gemini. Attendi prima di riprovare.')
      : invalidKey
        ? localized('Gemini rejected the API key. Check your Google AI Studio key and try again.', 'Gemini non ha accettato la chiave API. Controlla la chiave Google AI Studio e riprova.')
        : timeout
          ? localized('Trip generation took too long. Please try again; if it persists, check the Vercel function duration limit.', 'La creazione dell’itinerario ha richiesto troppo tempo. Riprova; se il problema persiste, controlla il limite di durata della funzione Vercel.')
          : localized('Gemini could not complete this vacation plan. Please try again and check the Vercel function logs if it persists.', 'Gemini non è riuscito a creare l’itinerario. Riprova e, se il problema persiste, controlla i log della funzione Vercel.')

    return NextResponse.json({
      error: localizedError,
      ...(quotaExceeded ? { helpUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits' } : {}),
      ...(invalidKey ? { helpUrl: 'https://aistudio.google.com/apikey' } : {}),
    }, { status: quotaExceeded ? 429 : invalidKey ? 401 : timeout ? 504 : 502 })
  }
}

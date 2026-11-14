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
const daySchema = z.object({ title: z.string(), theme: z.string(), activities: z.array(activitySchema).min(2).max(3) })
const restaurantSchema = z.object({ name: z.string(), cuisine: z.string(), whyItFits: z.string(), priceLevel: z.string(), area: z.string() })
const excursionSchema = z.object({ name: z.string(), description: z.string(), duration: z.string(), effort: z.string() })
const travelEssentialsSchema = z.object({
  localTransport: z.string(),
  paymentAndCurrency: z.string(),
  connectivity: z.string(),
  safety: z.string(),
  accessibility: z.string(),
  bookAhead: z.array(z.string()).min(2).max(5),
})
const planSchema = (duration: number) => z.object({
  headline: z.string(), overview: z.string(), destinationFit: z.string(), bestTimeNote: z.string(),
  days: z.array(daySchema).length(duration),
  restaurants: z.array(restaurantSchema).min(3).max(5),
  excursions: z.array(excursionSchema).min(2).max(4),
  stayAdvice: z.object({ area: z.string(), reason: z.string(), style: z.string() }),
  transportAdvice: z.string(),
  travelEssentials: travelEssentialsSchema,
  budgetBreakdown: z.array(z.object({ category: z.string(), estimate: z.string() })).min(3).max(7),
  budgetNote: z.string(),
})

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
  } catch { return null }
}

export async function POST(request: Request) {
  const access = await requireActiveSubscription(request)
  if (!access.ok) return access.response

  let input: Record<string, unknown>
  try { input = await request.json() } catch { return NextResponse.json({ error: 'Please submit valid trip preferences.' }, { status: 400 }) }

  const locale = resolveLocale(input.language === 'it' ? 'it' : 'en')
  const localized = (english: string, italian: string) => locale === 'it' ? italian : english
  const responseLanguage = locale === 'it' ? 'Italian' : 'English'
  const destination = typeof input.destination === 'string' ? input.destination.trim().slice(0, 120) : ''
  const requestedDuration = Number(input.duration)
  const allowedDurations = [3, 5, 7, 10, 14]
  const duration = allowedDurations.includes(requestedDuration) ? requestedDuration : 5
  const travelers = Math.min(12, Math.max(1, Number(input.travelers) || 2))
  const budget = typeof input.budget === 'string' ? input.budget.slice(0, 40) : 'mid-range'
  const travelStyles = Array.isArray(input.travelStyles) ? input.travelStyles.filter((value): value is string => typeof value === 'string').slice(0, 8).map((value) => value.slice(0, 40)) : []
  const interests = Array.isArray(input.interests) ? input.interests.filter((value): value is string => typeof value === 'string').slice(0, 8).map((value) => value.slice(0, 60)) : []
  const dates = typeof input.dates === 'string' ? input.dates.slice(0, 80) : 'Flexible dates'
  const needs = typeof input.needs === 'string' ? input.needs.trim().slice(0, 400) : ''
  if (!destination) return NextResponse.json({ error: localized('Enter a destination to build your vacation plan.', 'Inserisci una destinazione per creare il tuo itinerario.') }, { status: 400 })
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      error: localized('Gemini API key is missing. Add a Google AI Studio key to use the free-tier model.', 'La chiave API di Gemini non è configurata. Aggiungi una chiave Google AI Studio per usare il modello gratuito.'),
      helpUrl: 'https://aistudio.google.com/apikey',
    }, { status: 503 })
  }

  try {
    const google = createGoogle({ apiKey: process.env.GEMINI_API_KEY })
    const { output } = await generateText({
      model: google('gemini-3.1-flash-lite'),
      output: Output.object({ schema: planSchema(duration), name: 'personal_vacation_plan' }),
      temperature: 0.55,
      maxOutputTokens: 8192,
      prompt: `You are a meticulous independent AI travel planner. Create a coherent high-quality vacation for the traveler below. Return exactly ${duration} days. Every day must include 2-3 real, distinctive sights or places with realistic geographic grouping and sensible morning/afternoon/evening rhythm. Name only real places and restaurants you are reasonably confident exist; do not claim live availability or fabricate opening hours, prices, transit timetables, or booking status. Restaurant recommendations must be recognizable real venues only when confident; otherwise make the name explicitly cuisine-and-area based. Explain why each choice fits. Include 3-5 restaurants, 2-4 excursions, practical hotel-area advice, transport, and an estimated per-person budget breakdown appropriate to budget and duration. Clearly label estimates and exclusions. Adapt to travelers, dates, interests, style, budget, accessibility and other needs. Mention reasonable assumptions briefly. For every activity, add gettingThere with practical, approximate advice for reaching that specific place from the previous stop. Do not invent route durations, live transit departures, exact fares, or service availability. State when advice is general and recommend checking a live map or official transit source. For travelEssentials, cover local transport options, payment/currency, connectivity, safety, accessibility, and 2-5 things worth booking ahead. Avoid unsupported destination-specific claims; say what the traveler should verify. Write the complete plan in polished, warm ${responseLanguage}. Preserve proper names of places and venues.\n\nTraveler preferences: ${JSON.stringify({ destination, durationDays: duration, travelers, budget, travelStyles, interests, dates, additionalNeeds: needs })}`,
    })
    const photoDays = await Promise.all(output.days.map(async (day) => {
      const photo = await findWikimediaPhoto(`${day.activities[0]?.place || day.title} ${destination}`)
      return { ...day, photo }
    }))
    return NextResponse.json({ plan: { ...output, days: photoDays } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[v0] Unable to build vacation plan:', error)
    const message = error instanceof Error ? error.message : ''
    const quotaExceeded = /429|RESOURCE_EXHAUSTED|quota|rate limit/i.test(message)
    const invalidKey = /API_KEY_INVALID|API key not valid|unauthenticated|401/i.test(message)
    return NextResponse.json({
      error: quotaExceeded
        ? localized('Gemini free-tier quota reached. Please wait before trying again.', 'Hai raggiunto il limite gratuito di Gemini. Attendi prima di riprovare.')
        : invalidKey
          ? localized('Gemini rejected the API key. Check your Google AI Studio key and try again.', 'Gemini non ha accettato la chiave API. Controlla la chiave Google AI Studio e riprova.')
          : localized('Gemini could not complete this vacation plan. Please try again.', 'Gemini non è riuscito a creare l’itinerario. Riprova.'),
      ...(quotaExceeded
        ? { helpUrl: 'https://ai.google.dev/gemini-api/docs/rate-limits' }
        : invalidKey
          ? { helpUrl: 'https://aistudio.google.com/apikey' }
          : {}),
    }, { status: quotaExceeded ? 429 : invalidKey ? 401 : 502 })
  }
}

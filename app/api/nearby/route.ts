import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 15

type OverpassElement = {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type NearbyPlace = {
  id: string
  name: string
  kind: 'food' | 'visit'
  type: string
  latitude: number
  longitude: number
  distanceMeters: number
}

function distanceBetween(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const latitudeDelta = radians(latitudeB - latitudeA)
  const longitudeDelta = radians(longitudeB - longitudeA)
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(longitudeDelta / 2) ** 2

  return 6371000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

function classify(tags: Record<string, string>): Pick<NearbyPlace, 'kind' | 'type'> | null {
  if (tags.amenity && ['restaurant', 'cafe', 'fast_food', 'bar', 'pub'].includes(tags.amenity)) {
    return {
      kind: 'food',
      type: tags.amenity === 'fast_food' ? 'quick bite' : tags.amenity,
    }
  }

  if (tags.tourism && ['museum', 'gallery', 'attraction', 'viewpoint', 'zoo'].includes(tags.tourism)) {
    return { kind: 'visit', type: tags.tourism === 'attraction' ? 'attraction' : tags.tourism }
  }

  if (tags.historic && ['monument', 'memorial', 'castle', 'archaeological_site'].includes(tags.historic)) {
    return { kind: 'visit', type: tags.historic === 'archaeological_site' ? 'historic site' : tags.historic }
  }

  if (tags.leisure === 'park') return { kind: 'visit', type: 'park' }
  return null
}

export async function POST(request: Request) {
  let input: { latitude?: unknown; longitude?: unknown }
  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > 512) return NextResponse.json({ error: 'Invalid location.' }, { status: 400 })
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Please provide a valid location.' }, { status: 400 })
  }

  const latitude = input.latitude
  const longitude = input.longitude
  if (typeof latitude !== 'number' || typeof longitude !== 'number'
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ error: 'Please provide valid coordinates.' }, { status: 400 })
  }

  const radius = 1500
  const query = `
    [out:json][timeout:10];
    (
      nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub)$"](around:${radius},${latitude},${longitude});
      nwr["tourism"~"^(museum|gallery|attraction|viewpoint|zoo)$"](around:${radius},${latitude},${longitude});
      nwr["historic"~"^(monument|memorial|castle|archaeological_site)$"](around:${radius},${latitude},${longitude});
      nwr["leisure"="park"](around:${radius},${latitude},${longitude});
    );
    out center tags 60;
  `

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': 'travelAI nearby places/1.0',
      },
      body: new URLSearchParams({ data: query }),
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) {
      return NextResponse.json({ error: 'Nearby places are temporarily unavailable.' }, { status: 502 })
    }

    const data = await response.json() as { elements?: OverpassElement[] }
    const places = new Map<string, NearbyPlace>()

    for (const element of data.elements || []) {
      const tags = element.tags || {}
      const name = (tags.name || tags['name:en'] || tags.brand || '').trim()
      const coordinates = element.center || { lat: element.lat, lon: element.lon }
      const kind = classify(tags)
      if (!name || !kind || typeof coordinates.lat !== 'number' || typeof coordinates.lon !== 'number') continue

      const distanceMeters = Math.round(distanceBetween(latitude, longitude, coordinates.lat, coordinates.lon))
      const id = `${element.type}-${element.id}`
      places.set(id, {
        id,
        name: name.slice(0, 140),
        ...kind,
        latitude: coordinates.lat,
        longitude: coordinates.lon,
        distanceMeters,
      })
    }

    const results = Array.from(places.values())
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 30)

    return NextResponse.json({ places: results }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'Nearby places are temporarily unavailable.' }, { status: 502 })
  }
}

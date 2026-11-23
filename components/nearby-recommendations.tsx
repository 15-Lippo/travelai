'use client'

import { useState } from 'react'
import { ArrowUpRight, Compass, Crosshair, MapPin, Utensils } from 'lucide-react'
import { useLocale } from '@/components/locale-provider'

type Place = {
  id: string
  name: string
  kind: 'food' | 'visit'
  type: string
  latitude: number
  longitude: number
  distanceMeters: number
}

type NearbyFilter = 'all' | 'food' | 'visit'
type GeolocationError = { code: number }
type Coordinates = { latitude: number; longitude: number }

function mapsSearchUrl(query: string, coordinates: Coordinates) {
  const search = `${query} near ${coordinates.latitude},${coordinates.longitude}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(search)}`
}

function mapUrl(place: Place) {
  return `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=17/${place.latitude}/${place.longitude}`
}

function distanceLabel(distance: number) {
  if (distance < 1000) return `${Math.max(50, Math.round(distance / 50) * 50)} m`
  return `${(distance / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`
}

export function NearbyRecommendations() {
  const { t } = useLocale()
  const [places, setPlaces] = useState<Place[]>([])
  const [filter, setFilter] = useState<NearbyFilter>('all')
  const [status, setStatus] = useState<'idle' | 'locating' | 'searching'>('idle')
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)

  function searchNearby() {
    setError('')
    setPlaces([])
    setStatus('locating')

    if (!navigator.geolocation) {
      setError(t('Location access is unavailable in this browser.'))
      setStatus('idle')
      return
    }

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const currentCoordinates = { latitude: coords.latitude, longitude: coords.longitude }
      setCoordinates(currentCoordinates)
      setStatus('searching')
      try {
        const response = await fetch('/api/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude }),
        })
        const data = await response.json() as { places?: Place[]; error?: string }
        if (!response.ok) throw new Error(data.error || t('We could not find nearby places right now. Please try again.'))
        setPlaces(data.places || [])
        setHasSearched(true)
      } catch {
        setError(t('We could not find nearby places right now. Please try again.'))
      } finally {
        setStatus('idle')
      }
    }, (locationError: GeolocationError) => {
      setError(locationError.code === 1
        ? t('Location is blocked. In your browser site settings, allow Location for this site, then reload and try again.')
        : t('Location unavailable. Check your device settings and try again.'))
      setStatus('idle')
    }, { enableHighAccuracy: false, maximumAge: 120000, timeout: 12000 })
  }

  const visiblePlaces = places.filter((place) => filter === 'all' || place.kind === filter)

  return (
    <section className="nearby-section" id="nearby" aria-labelledby="nearby-title">
      <div className="nearby-heading">
        <div>
          <p className="nearby-eyebrow"><Compass size={14} aria-hidden="true" /> {t('EXPLORE YOUR SURROUNDINGS')}</p>
          <h2 id="nearby-title">{t('Good places, right around you.')}</h2>
          <p className="nearby-intro">{t('Find nearby restaurants, cafes, and interesting places to visit within about 1.5 km.')}</p>
        </div>
        <button className="nearby-search-button" type="button" onClick={searchNearby} disabled={status !== 'idle'}>
          {status === 'idle' ? <Crosshair size={17} aria-hidden="true" /> : <span className="nearby-spinner" aria-hidden="true" />}
          {status === 'locating' ? t('Finding your location…') : status === 'searching' ? t('Looking nearby…') : t('Use my location')}
        </button>
      </div>

      <p className="nearby-privacy"><MapPin size={13} aria-hidden="true" /> {t('Your location is sent to OpenStreetMap for this search; travelAI does not store it.')}</p>

      {error && (
        <div className="nearby-error" role="alert">
          <p>{error}</p>
          {coordinates && (
            <div className="nearby-map-fallback">
              <a href={mapsSearchUrl('restaurants and cafes', coordinates)} target="_blank" rel="noopener noreferrer">{t('Find restaurants on Google Maps')} <ArrowUpRight size={14} aria-hidden="true" /></a>
              <a href={mapsSearchUrl('museums and attractions', coordinates)} target="_blank" rel="noopener noreferrer">{t('Find things to see on Google Maps')} <ArrowUpRight size={14} aria-hidden="true" /></a>
              <small>{t('Google Maps receives your coordinates only if you open one of these links.')}</small>
            </div>
          )}
        </div>
      )}

      {hasSearched && !error && (
        <>
          <div className="nearby-filter" role="group" aria-label={t('Filter nearby places')}>
            {(['all', 'food', 'visit'] as const).map((value) => (
              <button key={value} type="button" className={filter === value ? 'nearby-filter-button is-active' : 'nearby-filter-button'} onClick={() => setFilter(value)} aria-pressed={filter === value}>
                {value === 'all' ? t('All places') : value === 'food' ? t('Food and drink') : t('Things to see')}
              </button>
            ))}
          </div>
          {visiblePlaces.length > 0 ? (
            <div className="nearby-grid">
              {visiblePlaces.map((place) => (
                <article className="nearby-card" key={place.id}>
                  <span className={place.kind === 'food' ? 'nearby-card-icon food' : 'nearby-card-icon visit'}>
                    {place.kind === 'food' ? <Utensils size={17} aria-hidden="true" /> : <MapPin size={17} aria-hidden="true" />}
                  </span>
                  <div className="nearby-card-copy">
                    <span className="nearby-card-type">{t(place.type)}</span>
                    <h3>{place.name}</h3>
                    <p>{t('About')} {distanceLabel(place.distanceMeters)} {t('away')}</p>
                  </div>
                  <a className="nearby-map-link" href={mapUrl(place)} target="_blank" rel="noopener noreferrer" aria-label={`${t('Open map for')} ${place.name}`}>
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <p className="nearby-empty" role="status">{t('No places in this category were found nearby.')}</p>
          )}
          <p className="nearby-attribution">{t('Place data from OpenStreetMap contributors. Check current opening hours before you go.')}</p>
        </>
      )}
    </section>
  )
}

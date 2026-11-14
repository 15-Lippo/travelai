'use client'

import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowRight, CalendarDays, CarFront, Check, ChevronRight, Compass, Heart, Hotel, MapPin, Menu, Plane, ShieldCheck, Sparkles, Utensils, Users, Wallet, Wifi, X } from 'lucide-react'
import { AccountActions } from '@/components/account-actions'
import { LanguageSwitcher } from '@/components/language-switcher'
import { SubscriptionGate } from '@/components/subscription-gate'
import { useLocale } from '@/components/locale-provider'

type Photo = { url: string; attribution: string; sourceUrl: string } | null
type Activity = { time: string; title: string; place: string; details: string; duration: string; gettingThere: string }
type TravelEssentials = {
  localTransport: string
  paymentAndCurrency: string
  connectivity: string
  safety: string
  accessibility: string
  bookAhead: string[]
}
type Day = { title: string; theme: string; activities: Activity[]; photo: Photo }
type Plan = {
  headline: string
  overview: string
  destinationFit: string
  bestTimeNote: string
  days: Day[]
  restaurants: { name: string; cuisine: string; whyItFits: string; priceLevel: string; area: string }[]
  excursions: { name: string; description: string; duration: string; effort: string }[]
  stayAdvice: { area: string; reason: string; style: string }
  transportAdvice: string
  travelEssentials: TravelEssentials
  budgetBreakdown: { category: string; estimate: string }[]
  budgetNote: string
}

const travelStyles = ['Culture', 'Food & wine', 'Nature', 'Adventure', 'Relaxation', 'Family', 'Romantic', 'Luxury']
const interests = ['Landmarks', 'Local neighborhoods', 'Museums', 'Beaches', 'Markets', 'Nightlife', 'Shopping', 'Outdoor activities']
const travelExtras = [
  {
    name: 'Klook',
    category: 'ACTIVITIES & TOURS',
    description: 'Explore tours and activities for your trip.',
    href: 'https://klook.tpk.mx/xQgfSFs9',
    Icon: Compass,
  },
  {
    name: 'KKday',
    category: 'LOCAL EXPERIENCES',
    description: 'Discover activities and local experiences.',
    href: 'https://kkday.tpk.mx/sYRiuHtU',
    Icon: Compass,
  },
  {
    name: 'Kiwitaxi',
    category: 'AIRPORT TRANSFERS',
    description: 'Arrange an airport transfer.',
    href: 'https://kiwitaxi.tpk.mx/nQonwRuO',
    Icon: CarFront,
  },
  {
    name: 'GetTransfer',
    category: 'CITY TRANSFERS',
    description: 'Explore private transfer options.',
    href: 'https://gettransfer.tpk.mx/n7JQGjnI',
    Icon: CarFront,
  },
  {
    name: 'Localrent',
    category: 'CAR RENTAL',
    description: 'Explore car rental options at your destination.',
    href: 'https://localrent.tpk.mx/NAQS6NwU',
    Icon: CarFront,
  },
  {
    name: 'Airalo',
    category: 'MOBILE DATA',
    description: 'Explore eSIM data plans before you travel.',
    href: 'https://airalo.tpk.mx/S43lKSoo',
    Icon: Wifi,
  },
  {
    name: 'AirHelp',
    category: 'FLIGHT SUPPORT',
    description: 'Find support for delayed or cancelled flights.',
    href: 'https://airhelp.tpk.mx/crWJPUJD',
    Icon: ShieldCheck,
  },
  {
    name: 'Aviasales',
    category: 'FLIGHTS',
    description: 'Search for flights to your destination.',
    href: 'https://aviasales.tpk.mx/PG3KT8Gi',
    Icon: Plane,
  },
]

function partnerLink(template: string | undefined, fallback: string, query: string) {
  return template ? template.replaceAll('{query}', encodeURIComponent(query)) : fallback
}

function directionsUrl(origin: string, destination: string) {
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'transit',
  })

  return `https://www.google.com/maps/dir/?${params.toString()}`
}

type PlannerUser = { name: string; email: string }
type PlannerProps = {
  user: PlannerUser | null
  subscriptionStatus: 'active' | 'inactive' | 'unavailable'
  canManageBilling: boolean
}

export function TravelPlanner({ user, subscriptionStatus, canManageBilling }: PlannerProps) {
  const { locale, t } = useLocale()
  const hasActiveSubscription = subscriptionStatus === 'active'
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState('5')
  const [travelers, setTravelers] = useState('2')
  const [dates, setDates] = useState('')
  const [budget, setBudget] = useState('mid-range')
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['Culture', 'Food & wine'])
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Landmarks', 'Local neighborhoods'])
  const [needs, setNeeds] = useState('')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorHelpUrl, setErrorHelpUrl] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const toggle = (value: string, list: string[], setter: (next: string[]) => void) =>
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!destination.trim()) {
      setError(t('Add a destination to get started.'))
      setErrorHelpUrl(null)
      return
    }

    setLoading(true)
    setError('')
    setErrorHelpUrl(null)
    setPlan(null)

    try {
      const response = await fetch('/api/vacation-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, duration, travelers, dates, budget, travelStyles: selectedStyles, interests: selectedInterests, needs, language: locale }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || t('We could not create your plan.'))
        setErrorHelpUrl(result.helpUrl || null)
        return
      }

      setPlan(result.plan as Plan)
      window.setTimeout(() => document.getElementById('your-trip')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('Something went wrong. Please try again.'))
      setErrorHelpUrl(null)
    } finally {
      setLoading(false)
    }
  }

  const expediaUrl = partnerLink(
    process.env.NEXT_PUBLIC_TP_HOTEL_URL,
    `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(destination)}`,
    destination,
  )

  const flightUrl = 'https://aviasales.tpk.mx/PG3KT8Gi'
  const klookUrl = 'https://klook.tpk.mx/xQgfSFs9'

  return (
    <div className="premium-workspace" id="top">
      <header className="workspace-header">
        <a className="workspace-brand" href="#top" aria-label={t('travel AI home')}>
          <span className="brand-mark"><Plane size={16} /></span>
          <span>travel<span className="brand-ai">AI</span></span>
        </a>
        <nav id="primary-nav" className={menuOpen ? 'workspace-nav workspace-nav-open' : 'workspace-nav'} aria-label={t('Main navigation')}>
          <a href="#planner">{t('Trip designer')}</a>
          <a href="#your-trip">{t('Itinerary')}</a>
          <a href="#booking">{t('Booking hub')}</a>
          <a href="#travel-essentials">{t('Travel extras')}</a>
        </nav>
        <div className="workspace-header-actions">
          <span className="workspace-status"><span aria-hidden="true" /> {t('AI TRIP DESIGNER')}</span>
          <LanguageSwitcher />
          <AccountActions user={user} canManageBilling={canManageBilling} />
          <button className="workspace-mobile-menu" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? t('Close menu') : t('Open menu')} aria-expanded={menuOpen} aria-controls="primary-nav">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <section className="workspace-hero">
        <div className="workspace-hero-image" aria-hidden="true" />
        <div className="workspace-hero-shade" aria-hidden="true" />
        <div className="workspace-hero-content">
          <div className="workspace-breadcrumb"><span>{t('WORKSPACE')}</span><ChevronRight size={13} /><span>{t('NEW TRIP')}</span></div>
          <div className="workspace-hero-copy">
            <div>
              <p className="workspace-overline"><Sparkles size={14} /> {t('YOUR PERSONAL TRAVEL STUDIO')}</p>
              <h1>{t('Somewhere wonderful')}<br /><em>{t('starts here.')}</em></h1>
              <p>{t("One thoughtful plan for the places, flavors and moments you'll remember long after you're home.")}</p>
            </div>
            <div className="hero-assurance">
              <span className="assurance-icon"><Heart size={17} /></span>
              <span><strong>{t('Designed around you')}</strong><small>{t('Not another one-size-fits-all itinerary')}</small></span>
            </div>
          </div>
        </div>
      </section>

      <main className="workspace-main" id="planner">
        {hasActiveSubscription ? (
          <>
        <div className="workspace-section-title">
          <div><span className="section-step">{t('01 / THE BRIEF')}</span><h2>{t('Tell us what feels like')} <em>{t('your kind of trip.')}</em></h2><p>{t('A few details help your AI travel designer find the right rhythm.')}</p></div>
          <span className="private-badge"><Check size={13} /> {t('PERSONALIZED')}</span>
        </div>
        <form className="workspace-form" onSubmit={createPlan}>
          <div className="form-card-heading">
            <span className="form-card-icon"><Compass size={18} /></span>
            <div><strong>{t('Your trip brief')}</strong><small>{t('All fields can be adjusted as your plans take shape.')}</small></div>
            <span className="step-pill">{t('STEP 1 OF 1')}</span>
          </div>
          <div className="workspace-destination">
            <label className="premium-field"><span>{t('Where to?')}</span><div className="destination-input"><MapPin size={18} /><input required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={t('A city, region, or country')} /><span className="input-hint">{t('DESTINATION')}</span></div></label>
          </div>
          <div className="workspace-fields-grid">
            <label className="premium-field"><span><CalendarDays size={14} /> {t('Travel dates')}</span><input type="text" value={dates} onChange={(event) => setDates(event.target.value)} placeholder={t('Exact dates or flexible')} /></label>
            <label className="premium-field"><span><Compass size={14} /> {t('Trip length')}</span><select value={duration} onChange={(event) => setDuration(event.target.value)}>{[3, 5, 7, 10, 14].map((days) => <option key={days} value={days}>{days} {t('days')}</option>)}</select></label>
            <label className="premium-field"><span><Users size={14} /> {t('Travelers')}</span><select value={travelers} onChange={(event) => setTravelers(event.target.value)}>{[1, 2, 3, 4, 5, 6, 8, 10, 12].map((count) => <option key={count} value={count}>{count} {t(count === 1 ? 'traveler' : 'travelers')}</option>)}</select></label>
            <label className="premium-field"><span><Wallet size={14} /> {t('Travel budget')}</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="budget">{t('Value conscious')}</option><option value="mid-range">{t('Comfortable')}</option><option value="premium">{t('Premium')}</option><option value="luxury">{t('Luxury')}</option></select></label>
          </div>
          <div className="form-divider" />
          <fieldset className="preference-group"><legend><span>01</span> {t('Your travel mood')}</legend><p>{t('Choose the feeling you want the trip to have.')}</p><div className="preference-chips">{travelStyles.map((style) => <button type="button" key={style} className={selectedStyles.includes(style) ? 'preference-chip is-selected' : 'preference-chip'} aria-pressed={selectedStyles.includes(style)} onClick={() => toggle(style, selectedStyles, setSelectedStyles)}>{selectedStyles.includes(style) && <Check size={13} />} {t(style)}</button>)}</div></fieldset>
          <fieldset className="preference-group"><legend><span>02</span> {t('What are you drawn to?')}</legend><p>{t("We'll give your priorities more room in the itinerary.")}</p><div className="preference-chips">{interests.map((interest) => <button type="button" key={interest} className={selectedInterests.includes(interest) ? 'preference-chip is-selected' : 'preference-chip'} aria-pressed={selectedInterests.includes(interest)} onClick={() => toggle(interest, selectedInterests, setSelectedInterests)}>{selectedInterests.includes(interest) && <Check size={13} />} {t(interest)}</button>)}</div></fieldset>
          <label className="premium-field needs-field"><span>{t('Anything else we should know?')} <small>{t('Accessibility, must-sees, pace, dietary needs…')}</small></span><textarea rows={3} maxLength={400} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder={t('The more we know, the more personal the plan.')} /></label>
          {error && <p className="workspace-error" role="alert">{error}{errorHelpUrl && <> <a href={errorHelpUrl} target="_blank" rel="noopener noreferrer">View Gemini setup or usage limits</a></>}</p>}
          <div className="form-submit-row">
            <div><span className="submit-spark"><Sparkles size={15} /></span><span><strong>{t('Your first draft, made for you.')}</strong><small>{t('Gemini free tier; quotas apply. Preferences are sent to Google.')}</small></span></div>
            <button className="workspace-submit" type="submit" disabled={loading} aria-busy={loading}>{loading ? <><span className="workspace-loader" /> {t('Designing your trip…')}</> : <>{t('Create my trip')} <ArrowRight size={17} /></>}</button>
          </div>
        </form>
          </>
        ) : (
          <SubscriptionGate user={user} status={subscriptionStatus} canManageBilling={canManageBilling} />
        )}
      </main>

      {hasActiveSubscription && plan && <section className="workspace-results" id="your-trip" aria-label={t('Your itinerary')}>
        <div className="results-topline"><div><span className="section-step">{t('02 / YOUR ITINERARY')}</span><span className="live-badge"><span aria-hidden="true" /> {t('PERSONALIZED PLAN')}</span></div><button className="edit-brief" type="button" onClick={() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' })}>{t('Edit trip brief')} <ArrowDown size={14} /></button></div>
        <div className="results-overview"><div className="results-overview-text"><p className="results-location"><MapPin size={14} />{destination}<span /> {duration} {t('DAYS')} <span /> {travelers} {t('TRAVELERS')}</p><h2>{plan.headline}</h2><p className="results-description">{plan.overview}</p><div className="fit-note"><span><Heart size={17} /></span><div><strong>{t('Why this trip fits')}</strong><p>{plan.destinationFit}</p></div></div><p className="season-note"><CalendarDays size={15} />{plan.bestTimeNote}</p></div><div className="overview-photo"><img src={plan.days[0]?.photo?.url || '/travel-hero.png'} alt={`${destination} travel inspiration`} /><span>{t('YOUR DESTINATION')}</span><small>{t('Photo via Wikimedia Commons')}</small></div></div>

        <div className="results-section-heading"><div><span>{t('THE JOURNEY')}</span><h3>{t('Days with a sense of place')}</h3></div><p>{t('Thoughtful pacing, memorable stops, room to wander.')}</p></div>
        <div className="premium-day-list">{plan.days.map((day, index) => <article className="premium-day" key={`${index}-${day.title}`}><div className="premium-day-image">{day.photo ? <><img src={day.photo.url} alt={`${day.activities[0]?.place || day.title} in ${destination}`} loading={index < 2 ? 'eager' : 'lazy'} /><a className="premium-photo-credit" href={day.photo.sourceUrl} target="_blank" rel="noopener noreferrer">{day.photo.attribution}</a></> : <div className="premium-photo-fallback"><MapPin size={24} /><span>{destination}</span></div>}<span className="premium-day-count">{t('DAY {day}', { day: String(index + 1).padStart(2, '0') })}</span></div><div className="premium-day-body"><div className="premium-day-title"><div><span>{day.theme}</span><h4>{day.title}</h4></div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${day.activities[0]?.place}, ${destination}`)}`} target="_blank" rel="noopener noreferrer" aria-label={t('View day {day} on Maps', { day: index + 1 })}><MapPin size={16} /></a></div><div className="premium-timeline">{day.activities.map((activity, i) => {
          const origin = i === 0 ? plan.stayAdvice.area : day.activities[i - 1].place

          return (
            <div className="premium-timeline-item" key={`${activity.time}-${i}`}>
              <span className="timeline-time">{activity.time}</span>
              <div>
                <strong>{activity.title}</strong>
                <p className="timeline-place">
                  <MapPin size={12} />
                  {activity.place}
                  <span>· {activity.duration}</span>
                </p>
                <p>{activity.details}</p>
                <div className="day-mobility">
                  <p><strong>{t('Getting there')}</strong> {activity.gettingThere}</p>
                  <a
                    href={directionsUrl(`${origin}, ${destination}`, `${activity.place}, ${destination}`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('Open route in Google Maps')} <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          )
        })}</div></div></article>)}</div>

        <div className="results-section-heading"><div><span>{t('CURATED FOR YOUR TASTE')}</span><h3>{t('Good tables, local flavor')}</h3></div><Utensils size={20} /></div>
        <div className="premium-recommendations">{plan.restaurants.map((restaurant, index) => <article className="premium-rec-card" key={`${restaurant.name}-${index}`}><div className="rec-card-top"><span>{t('DINING · {number}', { number: `0${index + 1}` })}</span><span>{restaurant.priceLevel}</span></div><h4>{restaurant.name}</h4><p className="rec-detail">{restaurant.cuisine} <i /> {restaurant.area}</p><p>{restaurant.whyItFits}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${restaurant.area} ${destination}`)}`} target="_blank" rel="noopener noreferrer">{t('View on Maps')} <ArrowRight size={14} /></a></article>)}</div>

        <div className="results-section-heading"><div><span>{t('MAKE A DAY OF IT')}</span><h3>{t('Experiences beyond the city')}</h3></div><Compass size={20} /></div>
        <div className="premium-excursions">{plan.excursions.map((excursion, index) => <article className="premium-excursion" key={`${excursion.name}-${index}`}><span>0{index + 1} <i /> {excursion.duration} <i /> {excursion.effort} {t('EFFORT')}</span><h4>{excursion.name}</h4><p>{excursion.description}</p><a href={klookUrl} target="_blank" rel="sponsored noopener noreferrer">{t('Find on Klook')} <ArrowRight size={14} /></a></article>)}</div>

        <div className="results-section-heading"><div><span>{t('THE DETAILS THAT MAKE IT WORK')}</span><h3>{t('A little practical magic')}</h3></div></div>
        <div className="premium-practical"><article><span className="practical-icon"><Hotel size={18} /></span><span className="practical-label">{t('YOUR HOME BASE')}</span><h4>{plan.stayAdvice.area}</h4><p>{plan.stayAdvice.reason}</p><small>{t('Best for:')} {plan.stayAdvice.style}</small></article><article><span className="practical-icon"><Plane size={18} /></span><span className="practical-label">{t('GETTING AROUND')}</span><h4>{t('Move at your own pace')}</h4><p>{plan.transportAdvice}</p></article><article className="premium-budget"><span className="practical-icon"><Wallet size={18} /></span><span className="practical-label">{t('BUDGET, WITHOUT SURPRISES')}</span><h4>{t('Estimated trip costs')}</h4><div>{plan.budgetBreakdown.map((item, index) => <p key={`${item.category}-${index}`}><span>{item.category}</span><strong>{item.estimate}</strong></p>)}</div><small>{plan.budgetNote}</small></article></div>

        <section className="travel-essentials" aria-labelledby="essentials-title">
          <div className="travel-essentials-heading">
            <div>
              <span className="section-step">{t('TRAVEL SMARTER')}</span>
              <h3 id="essentials-title">{t('Know before you go')}</h3>
              <p>{t('Practical notes to help the trip run smoothly.')}</p>
            </div>
          </div>

          <div className="travel-practical-grid">
            <article className="essential-card">
              <strong>{t('Getting around')}</strong>
              <p>{plan.travelEssentials.localTransport}</p>
            </article>
            <article className="essential-card">
              <strong>{t('Money & payments')}</strong>
              <p>{plan.travelEssentials.paymentAndCurrency}</p>
            </article>
            <article className="essential-card">
              <strong>{t('Connectivity')}</strong>
              <p>{plan.travelEssentials.connectivity}</p>
            </article>
            <article className="essential-card">
              <strong>{t('Safety')}</strong>
              <p>{plan.travelEssentials.safety}</p>
            </article>
            <article className="essential-card">
              <strong>{t('Accessibility')}</strong>
              <p>{plan.travelEssentials.accessibility}</p>
            </article>
            <article className="essential-card">
              <strong>{t('Book ahead')}</strong>
              <ul>{plan.travelEssentials.bookAhead.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
            </article>
          </div>
          <p className="travel-extras-note">
            {t('AI-generated travel guidance is not live transit or safety data. Confirm current details with official local sources.')}
          </p>
        </section>

        <section className="premium-booking" id="booking"><div className="booking-decoration" aria-hidden="true"><Sparkles size={20} /></div><div className="premium-booking-copy"><span>{t("03 / WHEN YOU'RE READY")}</span><h3>{t('Bring the plan to life.')}</h3><p>{t('Partner links may not prefill this destination. Search for {destination} on the partner site where needed, and confirm current prices directly with providers.', { destination })}</p></div><div className="premium-booking-actions">
            <a href={expediaUrl} target="_blank" rel="sponsored noopener noreferrer">
              <Hotel size={17} />
              <span>
                <strong>{t('Find a stay')}</strong>
                <small>{t('Hotels & places to stay')}</small>
              </span>
              <ArrowRight size={15} />
            </a>

            <a href={flightUrl} target="_blank" rel="sponsored noopener noreferrer">
              <Plane size={17} />
              <span>
                <strong>{t('Compare flights')}</strong>
                <small>{t('Search with Aviasales')}</small>
              </span>
              <ArrowRight size={15} />
            </a>

            <a href={klookUrl} target="_blank" rel="sponsored noopener noreferrer">
              <Compass size={17} />
              <span>
                <strong>{t('Discover experiences')}</strong>
                <small>{t('Activities with Klook')}</small>
              </span>
              <ArrowRight size={15} />
            </a>
          </div><p className="premium-affiliate-note">{t('Some booking links may be affiliate links. Prices, availability and booking terms are controlled by providers.')}</p></section>
        <p className="premium-disclaimer">{t('AI-generated travel inspiration, not live booking data. Verify opening hours, accessibility, advisories and current costs with official sources.')}</p>
      </section>}
      <section className="travel-essentials" id="travel-essentials" aria-labelledby="travel-essentials-heading">
        <div className="travel-essentials-heading"><div><span className="section-step">{t('04 / TRAVEL EXTRAS')}</span><h3 id="travel-essentials-heading">{t('The little details, taken care of.')}</h3><p>{t('Useful options for before and during your trip.')}</p></div></div>
        <div className="travel-essentials-grid">
          {travelExtras.map(({ name, category, description, href, Icon }) => (
            <a
              className="travel-extra-link"
              key={name}
              href={href}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              <span className="travel-extra-icon">
                <Icon size={18} />
              </span>
              <span className="travel-extra-copy">
                <small>{t(category)}</small>
                <strong>{name}</strong>
                <span>{t(description)}</span>
              </span>
              <ArrowRight size={15} />
            </a>
          ))}
        </div>
        <p className="travel-extras-note">{t('Partner links may be affiliate links. Check provider coverage, eligibility, prices and terms before purchase.')}</p>
      </section>

      {(!hasActiveSubscription || !plan) && (
        <section className="workspace-value-row"><article><span>01</span><div><strong>{t('Your pace, not a template')}</strong><p>{t('Build days around how you like to travel.')}</p></div></article><article><span>02</span><div><strong>{t('Places worth remembering')}</strong><p>{t('See the places and the story behind them.')}</p></div></article><article><span>03</span><div><strong>{t('Plan, then book with confidence')}</strong><p>{t('Keep recommendations and booking links together.')}</p></div></article></section>
      )}
      <footer className="workspace-footer"><div className="footer-brand"><span className="brand-mark"><Plane size={16} /></span><span>travel AI</span></div><p>{t('Less searching. More somewhere wonderful.')}</p><span>© 2026 travel AI</span></footer>
    </div>
  )
}

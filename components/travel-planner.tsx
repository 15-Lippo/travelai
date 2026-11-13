'use client'

import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowRight, CalendarDays, CarFront, Check, ChevronRight, Compass, Heart, Hotel, MapPin, Menu, Plane, ShieldCheck, Sparkles, Utensils, Users, Wallet, Wifi, X } from 'lucide-react'
import { AccountActions } from '@/components/account-actions'
import { SubscriptionGate } from '@/components/subscription-gate'

type Photo = { url: string; attribution: string; sourceUrl: string } | null
type Activity = { time: string; title: string; place: string; details: string; duration: string }
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
  budgetBreakdown: { category: string; estimate: string }[]
  budgetNote: string
}

const travelStyles = ['Culture', 'Food & wine', 'Nature', 'Adventure', 'Relaxation', 'Family', 'Romantic', 'Luxury']
const interests = ['Landmarks', 'Local neighborhoods', 'Museums', 'Beaches', 'Markets', 'Nightlife', 'Shopping', 'Outdoor activities']
const travelExtras = [
  { name: 'AirHelp', category: 'FLIGHT SUPPORT', description: 'Find support for delayed or cancelled flights.', href: 'https://airhelp.tpk.mx/sBkFfXpv', Icon: ShieldCheck },
  { name: 'Kiwitaxi', category: 'AIRPORT TRANSFERS', description: 'Arrange a ride to or from your accommodation.', href: 'https://kiwitaxi.tpk.mx/JOOOZCke', Icon: CarFront },
  { name: 'Airalo', category: 'MOBILE DATA', description: 'Explore eSIM data plans before you travel.', href: 'https://airalo.tpk.mx/fdteoZQE', Icon: Wifi },
]

function partnerLink(template: string | undefined, fallback: string, query: string) {
  return template ? template.replaceAll('{query}', encodeURIComponent(query)) : fallback
}

type PlannerUser = { name: string; email: string }
type PlannerProps = {
  user: PlannerUser | null
  subscriptionStatus: 'active' | 'inactive' | 'unavailable'
  canManageBilling: boolean
}

export function TravelPlanner({ user, subscriptionStatus, canManageBilling }: PlannerProps) {
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
      setError('Add a destination to get started.')
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
        body: JSON.stringify({ destination, duration, travelers, dates, budget, travelStyles: selectedStyles, interests: selectedInterests, needs }),
      })
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'We could not create your plan.')
        setErrorHelpUrl(result.helpUrl || null)
        return
      }

      setPlan(result.plan as Plan)
      window.setTimeout(() => document.getElementById('your-trip')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.')
      setErrorHelpUrl(null)
    } finally {
      setLoading(false)
    }
  }

  const expediaUrl = partnerLink(process.env.NEXT_PUBLIC_TP_HOTEL_URL, `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(destination)}`, destination)
  const flightUrl = partnerLink(process.env.NEXT_PUBLIC_TP_FLIGHT_URL, `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights to ${destination}`)}`, destination)
  const klookUrl = partnerLink(process.env.NEXT_PUBLIC_TP_ACTIVITY_URL, 'https://klook.tpk.mx/qObGvP9b', destination)

  return (
    <div className="premium-workspace" id="top">
      <header className="workspace-header">
        <a className="workspace-brand" href="#top" aria-label="travel AI home">
          <span className="brand-mark"><Plane size={16} /></span>
          <span>travel<span className="brand-ai">AI</span></span>
        </a>
        <nav id="primary-nav" className={menuOpen ? 'workspace-nav workspace-nav-open' : 'workspace-nav'} aria-label="Main navigation">
          <a href="#planner">Trip designer</a>
          <a href="#your-trip">Itinerary</a>
          <a href="#booking">Booking hub</a>
          <a href="#travel-essentials">Travel extras</a>
        </nav>
        <div className="workspace-header-actions">
          <span className="workspace-status"><span aria-hidden="true" /> AI TRIP DESIGNER</span>
          <AccountActions user={user} canManageBilling={canManageBilling} />
          <button className="workspace-mobile-menu" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="primary-nav">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <section className="workspace-hero">
        <div className="workspace-hero-image" aria-hidden="true" />
        <div className="workspace-hero-shade" aria-hidden="true" />
        <div className="workspace-hero-content">
          <div className="workspace-breadcrumb"><span>WORKSPACE</span><ChevronRight size={13} /><span>NEW TRIP</span></div>
          <div className="workspace-hero-copy">
            <div>
              <p className="workspace-overline"><Sparkles size={14} /> YOUR PERSONAL TRAVEL STUDIO</p>
              <h1>Somewhere wonderful<br /><em>starts here.</em></h1>
              <p>One thoughtful plan for the places, flavors and moments you&apos;ll remember long after you&apos;re home.</p>
            </div>
            <div className="hero-assurance">
              <span className="assurance-icon"><Heart size={17} /></span>
              <span><strong>Designed around you</strong><small>Not another one-size-fits-all itinerary</small></span>
            </div>
          </div>
        </div>
      </section>

      <main className="workspace-main" id="planner">
        {hasActiveSubscription ? (
          <>
        <div className="workspace-section-title">
          <div><span className="section-step">01 / THE BRIEF</span><h2>Tell us what feels like <em>your kind of trip.</em></h2><p>A few details help your AI travel designer find the right rhythm.</p></div>
          <span className="private-badge"><Check size={13} /> PERSONALIZED</span>
        </div>
        <form className="workspace-form" onSubmit={createPlan}>
          <div className="form-card-heading">
            <span className="form-card-icon"><Compass size={18} /></span>
            <div><strong>Your trip brief</strong><small>All fields can be adjusted as your plans take shape.</small></div>
            <span className="step-pill">STEP 1 OF 1</span>
          </div>
          <div className="workspace-destination">
            <label className="premium-field"><span>Where to?</span><div className="destination-input"><MapPin size={18} /><input required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="A city, region, or country" /><span className="input-hint">DESTINATION</span></div></label>
          </div>
          <div className="workspace-fields-grid">
            <label className="premium-field"><span><CalendarDays size={14} /> Travel dates</span><input type="text" value={dates} onChange={(event) => setDates(event.target.value)} placeholder="Exact dates or flexible" /></label>
            <label className="premium-field"><span><Compass size={14} /> Trip length</span><select value={duration} onChange={(event) => setDuration(event.target.value)}>{[3, 5, 7, 10, 14].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label>
            <label className="premium-field"><span><Users size={14} /> Travelers</span><select value={travelers} onChange={(event) => setTravelers(event.target.value)}>{[1, 2, 3, 4, 5, 6, 8, 10, 12].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'traveler' : 'travelers'}</option>)}</select></label>
            <label className="premium-field"><span><Wallet size={14} /> Travel budget</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="budget">Value conscious</option><option value="mid-range">Comfortable</option><option value="premium">Premium</option><option value="luxury">Luxury</option></select></label>
          </div>
          <div className="form-divider" />
          <fieldset className="preference-group"><legend><span>01</span> Your travel mood</legend><p>Choose the feeling you want the trip to have.</p><div className="preference-chips">{travelStyles.map((style) => <button type="button" key={style} className={selectedStyles.includes(style) ? 'preference-chip is-selected' : 'preference-chip'} aria-pressed={selectedStyles.includes(style)} onClick={() => toggle(style, selectedStyles, setSelectedStyles)}>{selectedStyles.includes(style) && <Check size={13} />} {style}</button>)}</div></fieldset>
          <fieldset className="preference-group"><legend><span>02</span> What are you drawn to?</legend><p>We&apos;ll give your priorities more room in the itinerary.</p><div className="preference-chips">{interests.map((interest) => <button type="button" key={interest} className={selectedInterests.includes(interest) ? 'preference-chip is-selected' : 'preference-chip'} aria-pressed={selectedInterests.includes(interest)} onClick={() => toggle(interest, selectedInterests, setSelectedInterests)}>{selectedInterests.includes(interest) && <Check size={13} />} {interest}</button>)}</div></fieldset>
          <label className="premium-field needs-field"><span>Anything else we should know? <small>Accessibility, must-sees, pace, dietary needs…</small></span><textarea rows={3} maxLength={400} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder="The more we know, the more personal the plan." /></label>
          {error && <p className="workspace-error" role="alert">{error}{errorHelpUrl && <> <a href={errorHelpUrl} target="_blank" rel="noopener noreferrer">View Gemini setup or usage limits</a></>}</p>}
          <div className="form-submit-row">
            <div><span className="submit-spark"><Sparkles size={15} /></span><span><strong>Your first draft, made for you.</strong><small>Gemini free tier; quotas apply. Preferences are sent to Google.</small></span></div>
            <button className="workspace-submit" type="submit" disabled={loading} aria-busy={loading}>{loading ? <><span className="workspace-loader" /> Designing your trip…</> : <>Create my trip <ArrowRight size={17} /></>}</button>
          </div>
        </form>
          </>
        ) : (
          <SubscriptionGate user={user} status={subscriptionStatus} canManageBilling={canManageBilling} />
        )}
      </main>

      {hasActiveSubscription && plan && <section className="workspace-results" id="your-trip" aria-label="Your itinerary">
        <div className="results-topline"><div><span className="section-step">02 / YOUR ITINERARY</span><span className="live-badge"><span aria-hidden="true" /> PERSONALIZED PLAN</span></div><button className="edit-brief" type="button" onClick={() => document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' })}>Edit trip brief <ArrowDown size={14} /></button></div>
        <div className="results-overview"><div className="results-overview-text"><p className="results-location"><MapPin size={14} />{destination}<span /> {duration} DAYS <span /> {travelers} TRAVELERS</p><h2>{plan.headline}</h2><p className="results-description">{plan.overview}</p><div className="fit-note"><span><Heart size={17} /></span><div><strong>Why this trip fits</strong><p>{plan.destinationFit}</p></div></div><p className="season-note"><CalendarDays size={15} />{plan.bestTimeNote}</p></div><div className="overview-photo"><img src={plan.days[0]?.photo?.url || '/travel-hero.png'} alt={`${destination} travel inspiration`} /><span>YOUR DESTINATION</span><small>Photo via Wikimedia Commons</small></div></div>

        <div className="results-section-heading"><div><span>THE JOURNEY</span><h3>Days with a sense of place</h3></div><p>Thoughtful pacing, memorable stops, room to wander.</p></div>
        <div className="premium-day-list">{plan.days.map((day, index) => <article className="premium-day" key={`${index}-${day.title}`}><div className="premium-day-image">{day.photo ? <><img src={day.photo.url} alt={`${day.activities[0]?.place || day.title} in ${destination}`} loading={index < 2 ? 'eager' : 'lazy'} /><a className="premium-photo-credit" href={day.photo.sourceUrl} target="_blank" rel="noopener noreferrer">{day.photo.attribution}</a></> : <div className="premium-photo-fallback"><MapPin size={24} /><span>{destination}</span></div>}<span className="premium-day-count">DAY {String(index + 1).padStart(2, '0')}</span></div><div className="premium-day-body"><div className="premium-day-title"><div><span>{day.theme}</span><h4>{day.title}</h4></div><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${day.activities[0]?.place}, ${destination}`)}`} target="_blank" rel="noopener noreferrer" aria-label={`View day ${index + 1} on Maps`}><MapPin size={16} /></a></div><div className="premium-timeline">{day.activities.map((activity, i) => <div className="premium-timeline-item" key={`${activity.time}-${i}`}><span className="timeline-time">{activity.time}</span><div><strong>{activity.title}</strong><p className="timeline-place"><MapPin size={12} />{activity.place}<span>· {activity.duration}</span></p><p>{activity.details}</p></div></div>)}</div></div></article>)}</div>

        <div className="results-section-heading"><div><span>CURATED FOR YOUR TASTE</span><h3>Good tables, local flavor</h3></div><Utensils size={20} /></div>
        <div className="premium-recommendations">{plan.restaurants.map((restaurant, index) => <article className="premium-rec-card" key={`${restaurant.name}-${index}`}><div className="rec-card-top"><span>DINING · 0{index + 1}</span><span>{restaurant.priceLevel}</span></div><h4>{restaurant.name}</h4><p className="rec-detail">{restaurant.cuisine} <i /> {restaurant.area}</p><p>{restaurant.whyItFits}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${restaurant.area} ${destination}`)}`} target="_blank" rel="noopener noreferrer">View on Maps <ArrowRight size={14} /></a></article>)}</div>

        <div className="results-section-heading"><div><span>MAKE A DAY OF IT</span><h3>Experiences beyond the city</h3></div><Compass size={20} /></div>
        <div className="premium-excursions">{plan.excursions.map((excursion, index) => <article className="premium-excursion" key={`${excursion.name}-${index}`}><span>0{index + 1} <i /> {excursion.duration} <i /> {excursion.effort} EFFORT</span><h4>{excursion.name}</h4><p>{excursion.description}</p><a href={klookUrl} target="_blank" rel="sponsored noopener noreferrer">Find on Klook <ArrowRight size={14} /></a></article>)}</div>

        <div className="results-section-heading"><div><span>THE DETAILS THAT MAKE IT WORK</span><h3>A little practical magic</h3></div></div>
        <div className="premium-practical"><article><span className="practical-icon"><Hotel size={18} /></span><span className="practical-label">YOUR HOME BASE</span><h4>{plan.stayAdvice.area}</h4><p>{plan.stayAdvice.reason}</p><small>Best for: {plan.stayAdvice.style}</small></article><article><span className="practical-icon"><Plane size={18} /></span><span className="practical-label">GETTING AROUND</span><h4>Move at your own pace</h4><p>{plan.transportAdvice}</p></article><article className="premium-budget"><span className="practical-icon"><Wallet size={18} /></span><span className="practical-label">BUDGET, WITHOUT SURPRISES</span><h4>Estimated trip costs</h4><div>{plan.budgetBreakdown.map((item, index) => <p key={`${item.category}-${index}`}><span>{item.category}</span><strong>{item.estimate}</strong></p>)}</div><small>{plan.budgetNote}</small></article></div>

        <section className="premium-booking" id="booking"><div className="booking-decoration" aria-hidden="true"><Sparkles size={20} /></div><div className="premium-booking-copy"><span>03 / WHEN YOU&apos;RE READY</span><h3>Bring the plan to life.</h3><p>Search Expedia for stays, compare flights, and explore Klook activities for {destination}. Compare details and confirm current prices directly with providers.</p></div><div className="premium-booking-actions"><a href={expediaUrl} target="_blank" rel="sponsored noopener noreferrer"><Hotel size={17} /><span><strong>Search Expedia stays</strong><small>Hotels & places to stay</small></span><ArrowRight size={15} /></a><a href={flightUrl} target="_blank" rel="sponsored noopener noreferrer"><Plane size={17} /><span><strong>Compare flights</strong><small>Routes & fares</small></span><ArrowRight size={15} /></a><a href={klookUrl} target="_blank" rel="sponsored noopener noreferrer"><Compass size={17} /><span><strong>Browse Klook</strong><small>Tours & activities</small></span><ArrowRight size={15} /></a></div><p className="premium-affiliate-note">Some booking links may be affiliate links. Prices, availability and booking terms are controlled by providers.</p></section>
        <p className="premium-disclaimer">AI-generated travel inspiration, not live booking data. Verify opening hours, accessibility, advisories and current costs with official sources.</p>
      </section>}
      <section className="travel-essentials" id="travel-essentials" aria-labelledby="travel-essentials-heading">
        <div className="travel-essentials-heading"><div><span className="section-step">04 / TRAVEL EXTRAS</span><h3 id="travel-essentials-heading">The little details, taken care of.</h3><p>Useful options for before and during your trip.</p></div></div>
        <div className="travel-essentials-grid">{travelExtras.map(({ name, category, description, href, Icon }) => <a className="travel-extra-link" key={name} href={href} target="_blank" rel="sponsored noopener noreferrer" aria-label={`${name}: ${description}`}><span className="travel-extra-icon"><Icon size={18} /></span><span className="travel-extra-copy"><small>{category}</small><strong>{name}</strong><span>{description}</span></span><ArrowRight size={16} /></a>)}</div>
        <p className="travel-extras-note">Partner links may be affiliate links. Check provider coverage, eligibility, prices and terms before purchase.</p>
      </section>

      {(!hasActiveSubscription || !plan) && (
        <section className="workspace-value-row"><article><span>01</span><div><strong>Your pace, not a template</strong><p>Build days around how you like to travel.</p></div></article><article><span>02</span><div><strong>Places worth remembering</strong><p>See the places and the story behind them.</p></div></article><article><span>03</span><div><strong>Plan, then book with confidence</strong><p>Keep recommendations and booking links together.</p></div></article></section>
      )}
      <footer className="workspace-footer"><div className="footer-brand"><span className="brand-mark"><Plane size={16} /></span><span>travel AI</span></div><p>Less searching. More somewhere wonderful.</p><span>© 2026 travel AI</span></footer>
    </div>
  )
}

'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, CalendarDays, Check, Compass, Hotel, MapPin, Menu, Plane, Sparkles, Utensils, Users, Wallet, X, Heart } from 'lucide-react'

type Photo = { url: string; attribution: string; sourceUrl: string } | null
type Activity = { time: string; title: string; place: string; details: string; duration: string }
type Plan = {
  headline: string; overview: string; destinationFit: string; bestTimeNote: string
  days: { title: string; theme: string; activities: Activity[]; photo: Photo }[]
  restaurants: { name: string; cuisine: string; whyItFits: string; priceLevel: string; area: string }[]
  excursions: { name: string; description: string; duration: string; effort: string }[]
  stayAdvice: { area: string; reason: string; style: string }; transportAdvice: string
  budgetBreakdown: { category: string; estimate: string }[]; budgetNote: string
}

const travelStyles = ['Culture', 'Food & wine', 'Nature', 'Adventure', 'Relaxation', 'Family', 'Romantic', 'Luxury']
const interests = ['Landmarks', 'Local neighborhoods', 'Museums', 'Beaches', 'Markets', 'Nightlife', 'Shopping', 'Outdoor activities']

function partnerLink(template: string | undefined, fallback: string, query: string) {
  return template ? template.replaceAll('{query}', encodeURIComponent(query)) : fallback
}

export function TravelPlanner() {
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
  if (!destination.trim()) { setError('Add a destination to get started.'); setErrorHelpUrl(null); return }
  setLoading(true); setError(''); setErrorHelpUrl(null); setPlan(null)
    try {
      const response = await fetch('/api/vacation-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
  } finally { setLoading(false) }
  }

  const hotelUrl = partnerLink(process.env.NEXT_PUBLIC_TP_HOTEL_URL, `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(destination)}`, destination)
  const flightUrl = partnerLink(process.env.NEXT_PUBLIC_TP_FLIGHT_URL, `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights to ${destination}`)}`, destination)
  const activityUrl = partnerLink(process.env.NEXT_PUBLIC_TP_ACTIVITY_URL, 'https://klook.tpk.mx/qObGvP9b', destination)

  return <main className="travel-app vacation-app">
    <header className="site-header">
      <a className="brand" href="#top" aria-label="travel AI home"><span className="brand-mark"><Plane size={16} /></span><span>travel AI</span></a>
      <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation"><a href="#how">How it works</a><a href="#your-trip">Your trip</a><a href="#booking">Book your trip</a></nav>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
    </header>

    <section className="agent-hero" id="top"><div className="agent-hero-image" aria-hidden="true"/><div className="agent-hero-shade" aria-hidden="true"/><div className="agent-hero-inner">
      <p className="agent-kicker"><Sparkles size={15}/> YOUR PERSONAL AI TRAVEL DESIGNER</p><h1>A remarkable trip,<br/><em>made yours.</em></h1><p className="agent-lede">Tell us what makes a holiday unforgettable. Get a thoughtful, photo-rich plan built around your people, pace and priorities.</p>
      <form className="agent-form" onSubmit={createPlan}>
        <label className="agent-field agent-destination"><span>Where would you like to go?</span><div><MapPin size={18}/><input required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="A city, region, or country" /></div></label>
        <div className="agent-form-row">
          <label className="agent-field"><span><CalendarDays size={14}/> When?</span><input type="text" value={dates} onChange={(event) => setDates(event.target.value)} placeholder="Dates or flexible" /></label>
          <label className="agent-field"><span><Compass size={14}/> How long?</span><select value={duration} onChange={(event) => setDuration(event.target.value)}>{[3,5,7,10,14].map((days) => <option key={days} value={days}>{days} days</option>)}</select></label>
          <label className="agent-field"><span><Users size={14}/> Travelers</span><select value={travelers} onChange={(event) => setTravelers(event.target.value)}>{[1,2,3,4,5,6,8,10,12].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'traveler' : 'travelers'}</option>)}</select></label>
          <label className="agent-field"><span><Wallet size={14}/> Budget</span><select value={budget} onChange={(event) => setBudget(event.target.value)}><option value="budget">Value conscious</option><option value="mid-range">Comfortable</option><option value="premium">Premium</option><option value="luxury">Luxury</option></select></label>
        </div>
        <fieldset className="agent-choices"><legend>Your travel mood</legend><div>{travelStyles.map((style) => <button type="button" key={style} className={selectedStyles.includes(style) ? 'agent-chip selected' : 'agent-chip'} aria-pressed={selectedStyles.includes(style)} onClick={() => toggle(style, selectedStyles, setSelectedStyles)}>{selectedStyles.includes(style) && <Check size={13}/>} {style}</button>)}</div></fieldset>
        <fieldset className="agent-choices"><legend>What are you drawn to?</legend><div>{interests.map((interest) => <button type="button" key={interest} className={selectedInterests.includes(interest) ? 'agent-chip selected' : 'agent-chip'} aria-pressed={selectedInterests.includes(interest)} onClick={() => toggle(interest, selectedInterests, setSelectedInterests)}>{selectedInterests.includes(interest) && <Check size={13}/>} {interest}</button>)}</div></fieldset>
        <label className="agent-field agent-needs"><span>Anything else we should know? <small>Accessibility, must-sees, pace, dietary needs…</small></span><textarea rows={2} maxLength={400} value={needs} onChange={(event) => setNeeds(event.target.value)} placeholder="Help us get the details right"/></label>
        {error && <p className="agent-error" role="alert">{error}{errorHelpUrl && <> <a href={errorHelpUrl} target="_blank" rel="noopener noreferrer">Open AI Gateway settings</a></>}</p>}
        <button className="agent-submit" type="submit" disabled={loading}>{loading ? <><span className="agent-loader"/> Designing your trip…</> : <><Sparkles size={17}/> Design my vacation <ArrowRight size={17}/></>}</button>
        <p className="agent-privacy">A considered first draft, shaped around you. You can refine it anytime.</p>
      </form>
    </div></section>

    {plan && <section className="trip-results" id="your-trip"><div className="trip-intro"><p className="agent-kicker dark"><Sparkles size={14}/> YOUR TRIP, THOUGHTFULLY DESIGNED</p><h2>{plan.headline}</h2><p className="trip-overview">{plan.overview}</p><div className="trip-fit"><Heart size={17}/><span><strong>Why it suits you</strong>{plan.destinationFit}</span></div><p className="trip-season"><CalendarDays size={16}/>{plan.bestTimeNote}</p></div>
      <div className="trip-section-heading"><div><span>THE JOURNEY</span><h3>Your days, beautifully paced</h3></div><p>Real places, sensible pacing, and room to wander.</p></div>
      <div className="agent-days">{plan.days.map((day, index) => <article className="agent-day" key={`${index}-${day.title}`}>
        <div className="agent-day-photo">{day.photo ? <><img src={day.photo.url} alt={`${day.activities[0]?.place || day.title} in ${destination}`} loading={index < 2 ? 'eager' : 'lazy'}/><a className="photo-credit" href={day.photo.sourceUrl} target="_blank" rel="noreferrer">Photo: {day.photo.attribution}</a></> : <div className="photo-fallback"><MapPin size={27}/><span>Discover {destination}</span></div>}<span className="day-number">DAY {String(index + 1).padStart(2, '0')}</span></div>
        <div className="agent-day-copy"><p className="day-theme">{day.theme}</p><h3>{day.title}</h3><div className="agent-activities">{day.activities.map((activity, i) => <div className="agent-activity" key={`${activity.time}-${i}`}><span>{activity.time}</span><div><strong>{activity.title}</strong><p><MapPin size={13}/>{activity.place} <span>· {activity.duration}</span></p><p>{activity.details}</p></div></div>)}</div><a className="day-map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${day.activities[0]?.place}, ${destination}`)}`} target="_blank" rel="noreferrer">Explore this day on Maps <ArrowRight size={14}/></a></div>
      </article>)}</div>

      <div className="trip-section-heading"><div><span>GOOD TASTE, WELL FOUND</span><h3>Tables worth seeking out</h3></div><Utensils size={22}/></div><div className="recommendation-grid">{plan.restaurants.map((restaurant, index) => <article className="recommendation-card" key={`${restaurant.name}-${index}`}><span className="recommendation-index">0{index + 1} · {restaurant.priceLevel}</span><h4>{restaurant.name}</h4><p className="recommendation-meta">{restaurant.cuisine} · {restaurant.area}</p><p>{restaurant.whyItFits}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${restaurant.name} ${restaurant.area} ${destination}`)}`} target="_blank" rel="noreferrer">View on Maps <ArrowRight size={14}/></a></article>)}</div>

      <div className="trip-section-heading"><div><span>BEYOND THE EVERYDAY</span><h3>Worth going a little further</h3></div><Compass size={22}/></div><div className="excursion-grid">{plan.excursions.map((excursion, index) => <article className="excursion-card" key={`${excursion.name}-${index}`}><span>{excursion.duration} · {excursion.effort} effort</span><h4>{excursion.name}</h4><p>{excursion.description}</p><a href={activityUrl} target="_blank" rel="sponsored noopener noreferrer">Find experiences <ArrowRight size={14}/></a></article>)}</div>

      <section className="trip-practical"><article className="stay-card"><Hotel size={20}/><span>WHERE TO STAY</span><h3>{plan.stayAdvice.area}</h3><p>{plan.stayAdvice.reason}</p><small>Best for: {plan.stayAdvice.style}</small></article><article className="transport-card"><Plane size={20}/><span>GETTING AROUND</span><h3>Move at your own pace</h3><p>{plan.transportAdvice}</p></article><article className="budget-card"><Wallet size={20}/><span>THE MONEY, MADE CLEAR</span><h3>A realistic budget guide</h3><div>{plan.budgetBreakdown.map((item, index) => <p key={`${item.category}-${index}`}><span>{item.category}</span><strong>{item.estimate}</strong></p>)}</div><small>{plan.budgetNote}</small></article></section>

      <section className="booking-panel" id="booking"><div><p className="agent-kicker dark"><Sparkles size={14}/> WHEN YOU&apos;RE READY</p><h3>Make the lovely parts happen.</h3><p>Explore stays, flights and experiences for {destination}. Check current availability and prices with providers before booking.</p></div><div className="booking-actions"><a href={hotelUrl} target="_blank" rel="sponsored noopener noreferrer"><Hotel size={17}/> Find stays <ArrowRight size={15}/></a><a href={flightUrl} target="_blank" rel="sponsored noopener noreferrer"><Plane size={17}/> Compare flights <ArrowRight size={15}/></a><a href={activityUrl} target="_blank" rel="sponsored noopener noreferrer"><Compass size={17}/> Browse experiences <ArrowRight size={15}/></a></div><small className="affiliate-note">Some booking links may be affiliate links. Prices and availability are set by booking partners.</small></section>
      <p className="plan-disclaimer">AI-generated inspiration, not live booking data. Verify venue details, operating hours, accessibility, travel advisories, and current costs with official sources.</p>
    </section>}

    <section className="agent-how" id="how"><div><span>01</span><p>Tell us what a great holiday means to you.</p></div><div><span>02</span><p>Get a considered itinerary with real places and destination imagery.</p></div><div><span>03</span><p>Explore travel partners when you&apos;re ready to book.</p></div></section>
    <footer><div className="footer-brand"><span className="brand-mark"><Plane size={16}/></span><span>travel AI</span></div><p>Less searching. More somewhere wonderful.</p><span>© 2026 travel AI</span></footer>
  </main>
}

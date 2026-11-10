'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Compass,
  Gem,
  Globe2,
  HeartHandshake,
  Lightbulb,
  LoaderCircle,
  LogIn,
  LockKeyhole,
  MapPin,
  Menu,
  Moon,
  Plane,
  Sparkles,
  Utensils,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

type Guide = {
  introduction: string
  schedule: { time: string; title: string; details: string }[]
  localTips: string[]
  gettingAround: string
  foodNearby: string
  estimatedBudget: string
}

const styles = [
  { name: 'Adventure', detail: 'Hikes & thrills', icon: Compass },
  { name: 'Budget', detail: 'Smart & savvy', icon: WalletCards },
  { name: 'Luxury', detail: 'Refined stays', icon: Gem },
  { name: 'Foodie', detail: 'Eat like a local', icon: Utensils },
  { name: 'Family', detail: 'All ages welcome', icon: Users },
  { name: 'Relaxation', detail: 'Slow & restful', icon: HeartHandshake },
]

const itineraryDays = [
  { title: 'Arrival & first impressions', stops: ['Check in to your hotel', 'Sunset viewpoint walk', 'Local trattoria dinner'] },
  { title: 'The essential sights', stops: ['Guided city highlights tour', 'Lunch at a neighborhood market', 'Evening food experience'] },
  { title: 'A day beyond the city', stops: ['Scenic day trip', 'Small-group excursion', 'Return transfer'] },
  { title: 'Local life & hidden corners', stops: ['Neighborhood coffee walk', 'Independent shops and makers', 'Golden-hour aperitivo'] },
  { title: 'Culture, coast & cuisine', stops: ['Museum or landmark visit', 'Market-to-table lunch', 'Dinner with a local view'] },
  { title: 'The slow travel day', stops: ['A relaxed morning in the old town', 'Regional tasting experience', 'Sunset by the water'] },
  { title: 'Final favourites', stops: ['Revisit your favourite place', 'Last-minute local discoveries', 'Farewell dinner'] },
  { title: 'A little further out', stops: ['Countryside or island escape', 'Small-group day excursion', 'Return to your stay'] },
  { title: 'The food trail', stops: ['Local bakery breakfast', 'Chef-led food experience', 'Night market stroll'] },
  { title: 'Goodbye, for now', stops: ['Pack and check out', 'One final viewpoint', 'Airport or station transfer'] },
  { title: 'Parks & open-air discoveries', stops: ['Morning in a city park', 'Riverside or garden stroll', 'Dinner in a local neighborhood'] },
  { title: 'Architecture & design', stops: ['Historic streets walk', 'Design district visit', 'Cocktails with a view'] },
  { title: 'A taste of the region', stops: ['Local produce market', 'Regional cooking experience', 'Evening at a neighborhood café'] },
  { title: 'One last adventure', stops: ['Choose a favorite day trip', 'Browse local crafts', 'Farewell meal'] },
]

const bookingLink = (destination: string) => `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(destination)}`
const activityLink = () => 'https://klook.tpk.mx/qObGvP9b'
const transportLink = () => 'https://klook.tpk.mx/qObGvP9b'
const mapLink = (destination: string, stop: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stop}, ${destination}`)}`

export function TravelPlanner() {
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState('5 days')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [savedTrips, setSavedTrips] = useState<string[]>([])
  const [freeItineraryUsed, setFreeItineraryUsed] = useState(false)
  const [unlimitedAccess, setUnlimitedAccess] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [guideDay, setGuideDay] = useState<{ title: string; stops: string[]; number: number } | null>(null)
  const [guide, setGuide] = useState<Guide | null>(null)
  const [guideLoading, setGuideLoading] = useState(false)
  const [guideError, setGuideError] = useState('')
  const guideRequest = useRef(0)

  const toggleStyle = (name: string) => {
    setSelectedStyles((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])
  }

  const openGuide = async (item: (typeof itineraryDays)[number], index: number) => {
    const requestId = ++guideRequest.current
    setGuideDay({ ...item, number: index + 1 })
    setGuide(null)
    setGuideError('')
    setGuideLoading(true)
    try {
      const response = await fetch('/api/day-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          dayNumber: index + 1,
          title: item.title,
          activities: item.stops,
          travelStyles: selectedStyles,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'The guide could not be created. Please try again.')
      if (guideRequest.current === requestId) setGuide(result.guide as Guide)
    } catch (error) {
      if (guideRequest.current === requestId) setGuideError(error instanceof Error ? error.message : 'The guide could not be created. Please try again.')
    } finally {
      if (guideRequest.current === requestId) setGuideLoading(false)
    }
  }

  const closeGuide = () => {
    guideRequest.current += 1
    setGuideDay(null)
    setGuideLoading(false)
  }

  useEffect(() => {
    if (!guideDay) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeGuide() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [guideDay])

  const submit = () => {
    if (!destination.trim()) return
    if (freeItineraryUsed && !unlimitedAccess) {
      setPaywallOpen(true)
      return
    }
    setSubmitted(true)
    setFreeItineraryUsed(true)
    setSavedTrips((current) => current.includes(destination.trim()) ? current : [...current, destination.trim()])
    window.setTimeout(() => document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <main className={darkMode ? 'travel-app dark-mode' : 'travel-app'}>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="travel AI home"><span className="brand-mark"><Plane size={16} strokeWidth={2.5} /></span><span>travel AI</span></a>
        <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
          <a href="#how">How it works</a><a href="#about">About</a><a href="#saved">My trips</a>
          <button className="theme-button" aria-label="Toggle theme" aria-pressed={darkMode} onClick={() => setDarkMode((current) => !current)}><Moon size={17} /></button>
          <button className="sign-in" onClick={() => setSignInOpen(true)}><LogIn size={16} /> Sign in</button>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
      </header>

      <section className="hero" id="top"><div className="hero-overlay" /><div className="hero-content">
        <p className="eyebrow"><Sparkles size={14} /> Your next adventure starts here</p>
        <h1>Travel, <em>beautifully</em> planned.</h1>
        <p className="hero-copy">Tell us where and how you like to travel. Get a day-by-day itinerary with local insider tips in seconds.</p>
        <section className="planner-card" aria-label="Trip planner">
          <div className="form-grid">
            <label className="field destination-field"><span>Destination</span><div className="input-shell"><MapPin size={17} /><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="e.g., Tokyo, Iceland, Amalfi Coast" /></div></label>
            <label className="field"><span>Trip duration</span><select value={duration} onChange={(event) => setDuration(event.target.value)}><option>3 days</option><option>5 days</option><option>7 days</option><option>10 days</option><option>14 days</option></select></label>
          </div>
          <div className="style-heading"><span>Travel style</span><button onClick={() => setSelectedStyles([])}>Choose any</button></div>
          <div className="style-grid">{styles.map(({ name, detail, icon: Icon }) => <button key={name} className={selectedStyles.includes(name) ? 'style-option selected' : 'style-option'} onClick={() => toggleStyle(name)} aria-pressed={selectedStyles.includes(name)}><span className="style-icon"><Icon size={16} /></span><strong>{name}</strong><small>{detail}</small></button>)}</div>
          <div className="access-status" role="status">{unlimitedAccess ? <><Sparkles size={15} /> Unlimited access active</> : freeItineraryUsed ? <><LockKeyhole size={15} /> Free itinerary used · <button type="button" onClick={() => setPaywallOpen(true)}>Unlock unlimited</button></> : <><Sparkles size={15} /> Your first itinerary is free</>}</div>
          <button className="generate-button" onClick={submit}>{freeItineraryUsed && !unlimitedAccess ? 'Unlock unlimited itineraries' : 'Generate Itinerary'} <ArrowRight size={18} /></button>
          {submitted && <p className="success-message" role="status">Your {duration} {destination} adventure is ready to explore.</p>}
        </section>
      </div></section>

      {submitted && <section className="itinerary-section" id="itinerary" aria-live="polite">
        <div className="itinerary-heading"><div><p className="eyebrow warm">Your personal route</p><h2>{destination}, thoughtfully planned.</h2><p>{duration} {selectedStyles.length ? `with a ${selectedStyles.join(', ').toLowerCase()} spirit` : 'at your own pace'}. Open any day for a detailed local guide.</p></div><div className="itinerary-actions"><a className="outline-button" href={bookingLink(destination)} target="_blank" rel="noreferrer">Find Hotels for this trip <ArrowRight size={15} /></a></div></div>
        <div className="itinerary-days">{itineraryDays.slice(0, Number.parseInt(duration, 10)).map((item, index) => <article className="day-card" key={`${item.title}-${index}`}>
          <div className="day-label">Day {index + 1}</div><h3>{item.title}</h3><ul>{item.stops.map((stop) => <li key={stop}>{stop}</li>)}</ul>
          <div className="booking-links"><a href={mapLink(destination, item.stops[0])} target="_blank" rel="noreferrer">How to get there</a><a href={activityLink()} target="_blank" rel="noreferrer">Tickets &amp; tours</a></div>
          <button className="day-guide-button" type="button" onClick={() => openGuide(item, index)}><BookOpenText size={16} /> Explore this day <ArrowRight size={15} /></button>
        </article>)}</div>
        <div className="route-note"><Sparkles size={17} /><span><strong>Smart routing</strong> Groups nearby places together to reduce transit time.</span></div>
        <div className="itinerary-footer-links"><a href={bookingLink(destination)} target="_blank" rel="noreferrer">Find Hotels for this trip</a><a href={`https://www.google.com/travel/flights?q=${encodeURIComponent(`flights to ${destination}`)}`} target="_blank" rel="noreferrer">Find flights</a><a href={transportLink()} target="_blank" rel="noreferrer">Transfers &amp; local transport</a></div>
      </section>}

      <section className="benefits" id="how">{[['Morning to night', 'Every day split into morning, afternoon, and evening blocks.', Lightbulb], ['In-depth day guides', 'Practical local context, timing, transport, food, and budget when you need it.', BookOpenText], ['Smart routing', 'Keep nearby places together and spend more time exploring.', Globe2]].map(([title, copy, Icon]) => { const BenefitIcon = Icon as typeof Lightbulb; return <article className="benefit-card" key={title as string}><BenefitIcon size={22} /><h2>{title as string}</h2><p>{copy as string}</p></article> })}</section>
      <section className="story-section" id="about"><div><p className="eyebrow warm">Made for curious travelers</p><h2>More than a plan.<br /><em>A feeling to follow.</em></h2></div><p>We turn your travel style into a thoughtful day-by-day plan, with useful local guides whenever you want to explore a little deeper.</p></section>
      <section className="saved-section" id="saved" aria-live="polite"><div><p className="eyebrow warm">Your saved trips</p><h2>Keep the <em>wonder</em> close.</h2></div>{savedTrips.length === 0 ? <p>Your saved destinations will appear here after you create an itinerary.</p> : <ul>{savedTrips.map((trip) => <li key={trip}><MapPin size={15} />{trip}</li>)}</ul>}</section>
      <footer><div className="footer-brand"><span className="brand-mark"><Plane size={16} /></span><span>travel AI</span></div><p>Thoughtful trips, beautifully planned.</p><span>© 2026 travel AI</span></footer>

      {signInOpen && <div className="modal-backdrop" role="presentation" onClick={() => setSignInOpen(false)}><section className="sign-in-modal" role="dialog" aria-modal="true" aria-labelledby="sign-in-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSignInOpen(false)} aria-label="Close"><X size={19} /></button><p className="eyebrow warm">Welcome back</p><h2 id="sign-in-title">Your trips, together.</h2><p>Sign-in will be available soon. Your current trip stays in this browser.</p><button className="generate-button" onClick={() => setSignInOpen(false)}>Continue planning</button></section></div>}
      {paywallOpen && <div className="modal-backdrop" role="presentation" onClick={() => setPaywallOpen(false)}><section className="sign-in-modal paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setPaywallOpen(false)} aria-label="Close"><X size={19} /></button><p className="eyebrow warm">Travel without limits</p><h2 id="paywall-title">Unlock unlimited itineraries</h2><p>One year of unlimited trip planning for</p><div className="paywall-price"><strong>$9</strong><span>per year</span></div><p>Secure checkout is not configured in this repository yet. Please contact the site owner to activate billing.</p><button className="generate-button" onClick={() => setPaywallOpen(false)}>Got it</button></section></div>}

      {guideDay && <div className="guide-backdrop" role="presentation" onClick={closeGuide}><section className="guide-dialog" role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={(event) => event.stopPropagation()}>
        <button className="guide-close" onClick={closeGuide} aria-label="Close day guide"><X size={20} /></button><p className="eyebrow warm"><BookOpenText size={15} /> Your local guide · Day {guideDay.number}</p><h2 id="guide-title">{guideDay.title}</h2><p className="guide-destination"><MapPin size={15} /> {destination}</p>
        {guideLoading && <div className="guide-loading" role="status"><LoaderCircle className="guide-spinner" size={24} /><strong>Putting together your day...</strong><span>Checking the plan and tailoring practical tips for {destination}.</span></div>}
        {guideError && <div className="guide-error" role="alert"><p>{guideError}</p><button className="outline-button" onClick={() => openGuide(guideDay, guideDay.number - 1)}>Try again</button></div>}
        {guide && <div className="guide-content"><p className="guide-intro">{guide.introduction}</p><h3><CalendarDays size={18} /> A thoughtful schedule</h3><div className="guide-schedule">{guide.schedule.map((item, index) => <article key={`${item.time}-${index}`}><span>{item.time}</span><div><strong>{item.title}</strong><p>{item.details}</p></div></article>)}</div><h3><Lightbulb size={18} /> Local tips</h3><ul className="guide-tips">{guide.localTips.map((tip, index) => <li key={index}>{tip}</li>)}</ul><div className="guide-info-grid"><article><h3><Plane size={17} /> Getting around</h3><p>{guide.gettingAround}</p></article><article><h3><Utensils size={17} /> Food nearby</h3><p>{guide.foodNearby}</p></article><article><h3><WalletCards size={17} /> Estimated budget</h3><p>{guide.estimatedBudget}</p></article></div><p className="guide-disclaimer">Opening hours, prices, and availability can change. Check official sources before setting out.</p></div>}
      </section></div>}
    </main>
  )
}

'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Gem,
  Globe2,
  HeartHandshake,
  Lightbulb,
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

  const toggleStyle = (name: string) => {
    setSelectedStyles((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])
  }

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
        <a className="brand" href="#top" aria-label="travel AI home">
          <span className="brand-mark"><Plane size={16} strokeWidth={2.5} /></span>
          <span>travel AI</span>
        </a>
        <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
          <a href="#how">How it works</a>
          <a href="#about">About</a>
          <a href="#saved">My trips</a>
          <button className="theme-button" aria-label="Toggle theme" aria-pressed={darkMode} onClick={() => setDarkMode((current) => !current)}><Moon size={17} /></button>
          <button className="sign-in" onClick={() => setSignInOpen(true)}><LogIn size={16} /> Sign in</button>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="eyebrow"><Sparkles size={14} /> Your next adventure starts here</p>
          <h1>Travel, <em>beautifully</em> planned.</h1>
          <p className="hero-copy">Tell us where and how you like to travel. Get a day-by-day itinerary with local insider tips in seconds.</p>

          <section className="planner-card" aria-label="Trip planner">
            <div className="form-grid">
              <label className="field destination-field">
                <span>Destination</span>
                <div className="input-shell"><MapPin size={17} /><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="e.g., Tokyo, Iceland, Amalfi Coast" /></div>
              </label>
              <label className="field">
                <span>Trip duration</span>
                <select value={duration} onChange={(event) => setDuration(event.target.value)}>
                  <option>3 days</option><option>5 days</option><option>7 days</option><option>10 days</option><option>14 days</option>
                </select>
              </label>
            </div>
            <div className="style-heading"><span>Travel style</span><button onClick={() => setSelectedStyles([])}>Choose any</button></div>
            <div className="style-grid">
              {styles.map(({ name, detail, icon: Icon }) => <button key={name} className={selectedStyles.includes(name) ? 'style-option selected' : 'style-option'} onClick={() => toggleStyle(name)} aria-pressed={selectedStyles.includes(name)}><span className="style-icon"><Icon size={17} /></span><strong>{name}</strong><small>{detail}</small></button>)}
            </div>
            <div className="access-status" role="status">
              {unlimitedAccess ? <><Sparkles size={15} /> Unlimited access active</> : freeItineraryUsed ? <><LockKeyhole size={15} /> Free itinerary used · <button type="button" onClick={() => setPaywallOpen(true)}>Unlock access</button></> : <><Sparkles size={15} /> Your first itinerary is free</>}
            </div>
            <button className="generate-button" onClick={submit}>{freeItineraryUsed && !unlimitedAccess ? 'Unlock unlimited itineraries' : 'Generate itinerary'} <ArrowRight size={18} /></button>
            {submitted && <p className="success-message" role="status">Your {duration} {destination} adventure is ready to explore.</p>}
          </section>
        </div>
      </section>

      {submitted && <section className="itinerary-section" id="itinerary" aria-live="polite">
        <div className="itinerary-heading"><div><p className="eyebrow warm">Your personal route</p><h2>{destination}, thoughtfully planned.</h2><p>{duration} with {selectedStyles.length ? selectedStyles.join(', ').toLowerCase() : 'a balanced mix of'} experiences, stays, and local moments.</p></div><div className="itinerary-actions"><img src="/travel-hero.png" alt={`${destination} travel illustration`} /><button className="outline-button" onClick={() => window.print()}><CalendarDays size={16} /> Save itinerary</button></div></div>
        <div className="itinerary-days">{itineraryDays.slice(0, Number.parseInt(duration, 10)).map((item, index) => <article className="day-card" key={`${item.title}-${index}`}><div className="day-label">Day {index + 1}</div><h3>{item.title}</h3><ul>{item.stops.map((stop) => <li key={stop}><a href={mapLink(destination, stop)} target="_blank" rel="noreferrer"><MapPin size={14} />{stop}<ArrowRight size={13} /></a></li>)}</ul><div className="booking-links"><a href={bookingLink(destination)} target="_blank" rel="noreferrer">Book stays <ArrowRight size={14} /></a><a href={activityLink()} target="_blank" rel="noreferrer">Tickets & tours <ArrowRight size={14} /></a><a href={`https://www.google.com/travel/flights?q=flights%20to%20${encodeURIComponent(destination)}`} target="_blank" rel="noreferrer">Find flights <ArrowRight size={14} /></a><a href={transportLink()} target="_blank" rel="noreferrer">Transfers & local transport <ArrowRight size={14} /></a></div></article>)}</div>
        <div className="route-note"><Sparkles size={17} /><span><strong>Smart routing</strong> Groups nearby places together to reduce transit time.</span></div>
      </section>}

      <section className="benefits" id="how">
        {[['Morning to night', 'Every day split into morning, afternoon, and evening blocks.', Lightbulb], ['Insider tips', 'One local secret per day that guidebooks miss.', Globe2], ['Smart routing', 'Nearby sights grouped together, so less time in transit.', Compass]].map(([title, text, Icon]) => <article className="benefit-card" key={title as string}><Icon size={21} /><h2>{title as string}</h2><p>{text as string}</p></article>)}
      </section>

      <section className="story-section" id="about"><div><p className="eyebrow warm">Made for curious travelers</p><h2>More than a plan.<br /><em>A feeling to follow.</em></h2></div><p>We turn the overwhelming parts of travel into a thoughtful route you will actually want to take. Less research, more wonder.</p></section>
      <section className="saved-section" id="saved" aria-live="polite"><div><p className="eyebrow warm">Your saved trips</p><h2>Keep the <em>wonder</em> close.</h2></div>{savedTrips.length === 0 ? <p className="empty-trips">Generate an itinerary and it will appear here.</p> : <div className="trip-list">{savedTrips.map((trip) => <button key={trip} className="trip-card" onClick={() => { setDestination(trip); setSubmitted(false); document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' }) }}><MapPin size={16} /><span>{trip}</span><ArrowRight size={16} /></button>)}</div>}</section>
      <footer><div className="footer-brand"><span className="brand-mark"><Plane size={16} /></span><span>travel AI</span></div><p>Thoughtful trips, beautifully planned.</p><span>© 2026 travel AI</span></footer>
      {signInOpen && <div className="modal-backdrop" role="presentation" onClick={() => setSignInOpen(false)}><section className="sign-in-modal" role="dialog" aria-modal="true" aria-labelledby="sign-in-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSignInOpen(false)} aria-label="Close sign in"><X size={18} /></button><p className="eyebrow">Welcome back</p><h2 id="sign-in-title">Sign in to travel AI</h2><p>Save your itineraries and pick up planning wherever you left off.</p><input aria-label="Email address" type="email" placeholder="you@example.com" /><button className="generate-button" onClick={() => setSignInOpen(false)}>Continue <ArrowRight size={18} /></button></section></div>}
      {paywallOpen && <div className="modal-backdrop" role="presentation" onClick={() => setPaywallOpen(false)}><section className="sign-in-modal paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setPaywallOpen(false)} aria-label="Close access offer"><X size={18} /></button><p className="eyebrow warm">Travel AI unlimited</p><h2 id="paywall-title">Keep planning without limits.</h2><p>Your first itinerary is free. Unlock unlimited trips, saved routes, photos, and local guides for one year.</p><div className="paywall-price"><strong>$9</strong><span>per year</span></div><a className="generate-button" href="https://klook.tpk.mx/qObGvP9b" target="_blank" rel="noreferrer" onClick={() => { setUnlimitedAccess(true); setPaywallOpen(false) }}>Unlock unlimited access <ArrowRight size={18} /></a></section></div>}
    </main>
  )
}

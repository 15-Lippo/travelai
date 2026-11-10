'use client'

import { useState } from 'react'
import {
  ArrowRight,
  Compass,
  Gem,
  Globe2,
  HeartHandshake,
  Lightbulb,
  LogIn,
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

export function TravelPlanner() {
  const [destination, setDestination] = useState('')
  const [duration, setDuration] = useState('5 days')
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [savedTrips, setSavedTrips] = useState<string[]>([])

  const toggleStyle = (name: string) => {
    setSelectedStyles((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])
  }

  const submit = () => {
    if (destination.trim()) {
      setSubmitted(true)
      setSavedTrips((current) => current.includes(destination.trim()) ? current : [...current, destination.trim()])
      window.setTimeout(() => document.getElementById('saved')?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
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
            <div className="free-note"><Sparkles size={15} /> Your first itinerary is free</div>
            <button className="generate-button" onClick={submit}>Generate itinerary <ArrowRight size={18} /></button>
            {submitted && <p className="success-message" role="status">Your {duration} {destination} adventure is ready to explore.</p>}
          </section>
        </div>
      </section>

      <section className="benefits" id="how">
        {[['Morning to night', 'Every day split into morning, afternoon, and evening blocks.', Lightbulb], ['Insider tips', 'One local secret per day that guidebooks miss.', Globe2], ['Smart routing', 'Nearby sights grouped together, so less time in transit.', Compass]].map(([title, text, Icon]) => <article className="benefit-card" key={title as string}><Icon size={21} /><h2>{title as string}</h2><p>{text as string}</p></article>)}
      </section>

      <section className="story-section" id="about"><div><p className="eyebrow warm">Made for curious travelers</p><h2>More than a plan.<br /><em>A feeling to follow.</em></h2></div><p>We turn the overwhelming parts of travel into a thoughtful route you will actually want to take. Less research, more wonder.</p></section>
      <section className="saved-section" id="saved" aria-live="polite"><div><p className="eyebrow warm">Your saved trips</p><h2>Keep the <em>wonder</em> close.</h2></div>{savedTrips.length === 0 ? <p className="empty-trips">Generate an itinerary and it will appear here.</p> : <div className="trip-list">{savedTrips.map((trip) => <button key={trip} className="trip-card" onClick={() => { setDestination(trip); setSubmitted(false); document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' }) }}><MapPin size={16} /><span>{trip}</span><ArrowRight size={16} /></button>)}</div>}</section>
      <footer><div className="footer-brand"><span className="brand-mark"><Plane size={16} /></span><span>travel AI</span></div><p>Thoughtful trips, beautifully planned.</p><span>© 2026 travel AI</span></footer>
      {signInOpen && <div className="modal-backdrop" role="presentation" onClick={() => setSignInOpen(false)}><section className="sign-in-modal" role="dialog" aria-modal="true" aria-labelledby="sign-in-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSignInOpen(false)} aria-label="Close sign in"><X size={18} /></button><p className="eyebrow">Welcome back</p><h2 id="sign-in-title">Sign in to travel AI</h2><p>Save your itineraries and pick up planning wherever you left off.</p><input aria-label="Email address" type="email" placeholder="you@example.com" /><button className="generate-button" onClick={() => setSignInOpen(false)}>Continue <ArrowRight size={18} /></button></section></div>}
    </main>
  )
}

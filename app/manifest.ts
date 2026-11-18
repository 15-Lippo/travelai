import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'travelAI — Your personal AI travel designer',
    short_name: 'travelAI',
    description: 'Create a thoughtful, personalized travel itinerary wherever you go.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#f7f6f2',
    theme_color: '#f7f6f2',
    categories: ['travel', 'lifestyle'],
    icons: [
      {
        src: '/travelai-pwa-icon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}

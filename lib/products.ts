export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  currency: 'eur'
  interval: 'year'
}

export const PRODUCTS: Product[] = [
  {
    id: 'travel-ai-annual',
    name: 'travelAI Annual',
    description: 'Annual access to personalized AI trip planning and travel guides.',
    priceInCents: 990,
    currency: 'eur',
    interval: 'year',
  },
]

export const ANNUAL_PLAN = PRODUCTS[0]

export const STRIPE_PAYMENT_LINK_ID = 'plink_1Uf7TALaasXzoWqGlQYKlKN4'
export const STRIPE_PAYMENT_LINK_URL = 'https://buy.stripe.com/28EcN69458C3evn3xX7kc05'

export function isLiveStripeBillingReady() {
  return process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') === true
    && Boolean(process.env.STRIPE_WEBHOOK_SECRET)
}

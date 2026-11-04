/** Facts about the company and its products, shared by the blog UI and structured data. */
export const site = {
  name: 'Le carnet Bento',
  company: 'Bento Solutions SARL',
  city: 'Casablanca',
  homeUrl: 'https://bento212.com',
  email: 'hello@bentosolutions.ma',
  logoPath: '/blog/icon.svg',
} as const

export const products = {
  bento212: { name: 'Bento212', url: 'https://lp.crmbento.com' },
  crm: { name: 'CRM Bento', url: 'https://crmbento.com' },
  core: { name: 'BentoCore ERP', url: 'https://core.crmbento.com' },
  orthoflow: { name: 'OrthoFlow', url: 'https://ortho.crmbento.com' },
} as const

export type ProductKey = keyof typeof products

export const siteUrl = (): string => (process.env.SITE_URL || 'http://localhost:3010').replace(/\/$/, '')

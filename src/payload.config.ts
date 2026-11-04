import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ar } from '@payloadcms/translations/languages/ar'
import { en } from '@payloadcms/translations/languages/en'
import { fr } from '@payloadcms/translations/languages/fr'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { editorsOnly } from './access/roles'
import { assistantEndpoints } from './assistant/endpoints'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { revalidateSiteAfterChange } from './hooks/revalidateSite'
import { siteUrl } from './lib/site'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const email = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ?? 'blog@bento212.com',
      defaultFromName: 'Le carnet Bento',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      },
    })
  : undefined

export default buildConfig({
  serverURL: process.env.CMS_URL || undefined,
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Le carnet Bento',
      icons: [{ rel: 'icon', type: 'image/svg+xml', url: '/blog/icon.svg' }],
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Logo#Icon',
      },
      afterDashboard: ['/components/admin/ReviewQueue#ReviewQueue', '/components/admin/WritingGuide#WritingGuide'],
    },
  },
  // The admin itself, in the language the team works in.
  i18n: {
    fallbackLanguage: 'fr',
    supportedLanguages: { fr, en, ar },
  },
  // Content. Each post is written in French first, and translated when it earns it.
  localization: {
    locales: [
      { code: 'fr', label: 'Français' },
      { code: 'en', label: 'English' },
      { code: 'ar', label: 'العربية', rtl: true },
    ],
    defaultLocale: 'fr',
    fallback: true,
  },
  collections: [Posts, Categories, Authors, Media, Users],
  endpoints: assistantEndpoints(),
  // Nothing uses GraphQL. Left on, it would be one more way in to guard.
  graphQL: { disable: true },
  editor: lexicalEditor(),
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Development syncs the schema by itself. Production applies the committed migrations on boot.
    push: process.env.DB_PUSH !== '0',
    prodMigrations: migrations,
  }),
  sharp,
  email,
  // Runs scheduled publications. `next start` is a long-lived process, so a cron works here.
  jobs: {
    autoRun: [{ cron: '* * * * *', limit: 10, queue: 'default' }],
    shouldAutoRun: () => process.env.NODE_ENV === 'production',
  },
  plugins: [
    seoPlugin({
      generateTitle: ({ doc }) => (doc as { title?: string })?.title ?? '',
      generateDescription: ({ doc }) => (doc as { excerpt?: string })?.excerpt?.slice(0, 160) ?? '',
      generateImage: ({ doc }) => (doc as { hero?: number | string })?.hero ?? '',
      generateURL: ({ doc, locale }) => {
        const prefix = locale && locale !== 'fr' ? `/${locale}` : ''
        return `${siteUrl()}${prefix}/blog/${(doc as { slug?: string })?.slug ?? ''}`
      },
    }),
    redirectsPlugin({
      collections: ['posts'],
      redirectTypes: ['301'],
      overrides: {
        labels: { singular: { fr: 'Redirection', en: 'Redirect' }, plural: { fr: 'Redirections', en: 'Redirects' } },
        admin: { group: { fr: 'Administration', en: 'Administration' } },
        access: { create: editorsOnly, update: editorsOnly, delete: editorsOnly },
        hooks: { afterChange: [revalidateSiteAfterChange] },
      },
    }),
  ],
})

# bento-web

*Le carnet*, the Bento Solutions blog, served at **bento212.com/blog**. Next.js 16 and Payload 3 on Postgres, in one container.

- Readers: `bento212.com/blog`, plus `/en/blog` and `/ar/blog` once a language has content
- The team: `cms.bento212.com/admin`, in French by default
- The brochure app keeps the homepage. Traefik sends this app only `/blog`, its assets, `robots.txt` and `sitemap.xml`

## Run it locally

```bash
docker compose -f docker-compose.local.yml up -d
cp .env.example .env
npm install
npm run seed
npm run dev
```

The blog is on http://localhost:3010/blog and the admin on http://localhost:3010/admin. The seed logins are in `.env`.
`SEED_TRANSLATIONS=1 npm run seed` adds an English and Arabic version of one post, which turns on the language links and hreflang.

**Launch articles:** `seed/content.ts` holds six articles, written with AI assistance. No accountant or lawyer has reviewed them. Five give practical advice. The sixth, on invoice requirements, makes tax claims and stays in review (`hold`) until an accountant signs off. `npm run seed` loads them locally: it wipes the blog first and refuses to run in production. `npm run publish:launch` loads them into production without deleting anything.

**A dev server quirk:** after some edits, the running dev server can throw `No intl context found` or `Cannot destructure property 'config'`. Restart it. Fresh servers and production builds do not have this.

## How the team works

| Role | Can do |
|---|---|
| Auteur | Writes and edits their own posts, submits them for review. Cannot publish or approve. |
| Éditeur | Reviews, edits any post, publishes or schedules, manages topics and bylines. |
| Administrateur | All of that, plus accounts and roles. |

1. An author writes. The draft saves itself, and the eye icon shows it in the real blog design.
2. The author sets **Relecture** to **En relecture**. Missing fields are listed, and the post appears under **À relire** on the editors' dashboard. Editors also get an email once SMTP is configured.
3. An editor publishes or schedules. The post gets its ledger number and pages refresh immediately.

Changing the slug of a published post leaves a permanent redirect behind.

**Référencement panel:** next to every post, a live checklist of 15 points (keyword, title, description, headings, links, cover). It gives advice and never blocks publishing.

**Assistant tab:** proposes outlines, drafts, titles, a standfirst, a Google description, a FAQ, proofreading and translations, and generates covers in the house style with Nano Banana. It never publishes. Using its text or cover ticks *Rédigé avec l'aide de l'IA*, and it is told to mark any figure or legal reference `[à vérifier]`. Each person gets 40 text requests and 10 images an hour.

To switch it on, add a key to the server's `.env` and recreate the container. `GEMINI_API_KEY` alone runs both text and images. With `ANTHROPIC_API_KEY` as well, text moves to Claude (`claude-opus-5-5`), and any request Claude's safety checks decline is retried on another model by Anthropic's API (`fallbacks: "default"`). `AI_TEXT_MODEL`, `AI_GEMINI_TEXT_MODEL` and `AI_IMAGE_MODEL` override the models.

**Translations:** switch the locale at the top of the admin and fill in the post. A language goes live for a post only when it has both a slug and a body, and a language appears on the site only once it has a post. Nothing else needs turning on.

## Design

The look comes from [`crm/DESIGN_SYSTEM.md`](../crm/DESIGN_SYSTEM.md): the same tokens, type families and easing, adapted for reading in `src/app/(frontend)/globals.css`.

- **Kept:** warm graphite neutrals, ink blue for anything interactive, weights 400/500/550, sentence-case labels, hairlines instead of shadows, light and dark themes.
- **The signature:** every post is a numbered entry in a ledger. See the register on the blog page, mono figures, numbered headings and registration marks on covers.
- **Added for readers:** large display type, a 19px text column, covers with motion and hover, solid category badges. Editors pick a named tone, never a hex code.

## Code layout

```
src/
├─ app/(frontend)/[locale]/   Public pages. They only display what the readers return.
├─ app/(payload)/             Payload's admin and API routes (generated).
├─ collections/ blocks/       The content model.
├─ hooks/ access/             Editorial rules, enforced on the server.
├─ domain/                    Types and the reader interfaces. No framework code.
├─ infrastructure/            Payload-backed readers, wired together in container.ts.
├─ seo/                       Metadata, hreflang, structured data, social cards.
└─ components/                Blog UI and admin overrides.
```

Pages depend on the interfaces in `domain/ports.ts`, never on Payload. The assistant follows the same pattern: `TextGenerator` and `ImageGenerator` in `domain/assistant.ts`, with one adapter per provider in `infrastructure/ai`.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

`npm test` needs the local Postgres. It creates its own `bento_web_test` database.

After changing a collection, run `npm run generate:types` and `npm run migrate:create <name>`, and commit the migration. Production applies migrations when it boots.

## Deploying

The pipeline matches bento-crm: `main` goes to production and `dev` to dev.bento212.com. The deploy job stays off until the repo variable `DEPLOY_ENABLED` is `true`.

First-time setup:

1. **DNS:** A records for `cms.bento212.com` (and `dev.bento212.com` for the dev stack) pointing to the VPS.
2. **Repo:** add the secrets `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS` and `DEPLOY_SSH_HOST`. `deploy.sh` assumes a public repo, like bento-crm. A private repo needs a deploy key on the server.
3. **Server:** clone into `/srv/bento/apps/bento-web` on `main`, and `/srv/bento/apps/bento-web-dev` on `dev`.
4. **`.env` in each directory:** use long random values, URL-safe for the password since it goes into a connection string.

   ```
   POSTGRES_PASSWORD=
   PAYLOAD_SECRET=
   PREVIEW_SECRET=
   SETUP_TOKEN=
   SMTP_HOST=
   SMTP_USER=
   SMTP_PASS=
   GEMINI_API_KEY=
   ANTHROPIC_API_KEY=
   ```

   The dev directory also needs `DEV_BASIC_AUTH`, an htpasswd line with every `$` doubled.
5. **Go live:** set `DEPLOY_ENABLED` to `true` and push.
6. **First administrator:** the form is hidden until someone opens the private link below. The first account created becomes the administrator, and after that the form is closed for good.

   ```bash
   ssh bento-prod 'echo "https://cms.bento212.com/admin/create-first-user?setup=$(grep ^SETUP_TOKEN= /srv/bento/apps/bento-web/.env | cut -d= -f2)"'
   ```

   Then create the team's accounts. Without SMTP, forgotten passwords cannot be reset by email: an administrator sets a new one from the user's page.

### Backups

`ops/backup.sh` runs every night from the `bento` user's crontab and writes the database and media to `/srv/bento/backups/bento-web`, keeping 14 days. These copies are on the same server as the blog, so they do not cover losing the server. Copy them elsewhere for that.

To restore (this replaces the current content):

```bash
cat db-<date>.dump | docker exec -i bento-web-postgres pg_restore -U bento_web -d bento_web --clean --if-exists
cat media-<date>.tgz | docker run --rm -i -v bento-web_bento-web-media:/media alpine:3 tar -xzf - -C /media
```

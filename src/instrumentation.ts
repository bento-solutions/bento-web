/**
 * Connects to Payload when the server starts, rather than on the first visit. Migrations run right
 * away, and the scheduler is live even if nobody opens the admin after a restart.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NEXT_PHASE === 'phase-production-build') return
  const [{ getPayload }, { default: config }] = await Promise.all([import('payload'), import('@payload-config')])
  await getPayload({ config, cron: true })
}

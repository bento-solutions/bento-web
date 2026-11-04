/**
 * Payload gives the first visitor of an empty database the form that creates the administrator.
 * On a public hostname that is a takeover waiting to happen, so with SETUP_TOKEN set the form and its
 * API answer only to a browser that came through the private setup link.
 *
 * Once an administrator exists, Payload itself refuses any further first-user registration.
 */
const FIRST_ADMIN_PATHS = /^\/(admin\/create-first-user|api\/users\/first-register)\/?$/

export const SETUP_COOKIE = 'bento-setup'
export const SETUP_PARAM = 'setup'

export type FirstAdminDecision = 'pass' | 'deny' | 'unlock'

export const firstAdminGate = (input: {
  pathname: string
  token: string | undefined
  cookie: string | undefined
  param: string | null
}): FirstAdminDecision => {
  if (!input.token || !FIRST_ADMIN_PATHS.test(input.pathname)) return 'pass'
  if (input.cookie === input.token) return 'pass'
  return input.param === input.token ? 'unlock' : 'deny'
}

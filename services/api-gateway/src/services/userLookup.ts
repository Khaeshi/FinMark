import { resolveUserByCognitoIdentity } from '@finmark/db'
import type { UserRole } from '@finmark/shared'

export interface ResolvedUser {
  email:    string
  role:     UserRole
  clientId?: string
}

const cache = new Map<string, { user: ResolvedUser; expiresAt: number }>()
const CACHE_TTL_MS = 30_000

export async function resolveUserFromDatabase(
  sub: string,
  emailHint?: string
): Promise<ResolvedUser | null> {
  const cacheKey = `${sub}:${emailHint ?? ''}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user
  }

  const user = await resolveUserByCognitoIdentity(sub, emailHint)

  if (!user?.isActive) return null

  const resolved: ResolvedUser = {
    email: user.email,
    role:  user.role as UserRole,
    clientId: user.clientId ?? undefined,
  }

  cache.set(cacheKey, { user: resolved, expiresAt: Date.now() + CACHE_TTL_MS })
  return resolved
}

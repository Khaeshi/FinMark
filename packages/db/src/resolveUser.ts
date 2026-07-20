import { prisma } from './client'
import type { User } from '@prisma/client'

/**
 * Resolve a user from Cognito JWT `sub` (UUID).
 * Falls back to email when legacy rows stored Username/email in cognitoId.
 * Re-links cognitoId to `sub` when a match is found.
 */
export async function resolveUserByCognitoIdentity(
  sub: string,
  emailHint?: string
): Promise<User | null> {
  const normalizedEmail = emailHint?.toLowerCase().trim()

  let user = await prisma.user.findUnique({ where: { cognitoId: sub } })

  if (!user && normalizedEmail) {
    user = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  }

  // Legacy rows: cognitoId was Cognito Username (often the email), not JWT sub
  if (!user && normalizedEmail) {
    user = await prisma.user.findUnique({ where: { cognitoId: normalizedEmail } })
  }

  if (user && user.cognitoId !== sub) {
    user = await prisma.user.update({
      where: { id: user.id },
      data:  { cognitoId: sub },
    })
  }

  return user
}

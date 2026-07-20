/**
 * @author Khaesey Angel Tablante
 */

import { prisma, resolveUserByCognitoIdentity } from '@finmark/db'
import { createLogger } from '@finmark/shared'
import type { UserRole } from '@finmark/shared'
import { getUserFromToken } from './cognitoService'

const logger = createLogger('user-auth-svc:session')

// sync Cognito user into our local DB on first login
export async function syncUserToDatabase(
  cognitoId: string,
  email: string,
  name: string
) {
  const displayName = name?.trim() || email.split('@')[0]

  // Cognito user may be re-created with the same email but a new sub
  const existingByEmail = await prisma.user.findUnique({ where: { email } })
  if (existingByEmail && existingByEmail.cognitoId !== cognitoId) {
    const user = await prisma.user.update({
      where: { email },
      data: { cognitoId, name: displayName, lastLoginAt: new Date() },
    })
    logger.info('User re-linked to new Cognito sub', { userId: user.id, email })
    return user
  }

  const user = await prisma.user.upsert({
    where: { cognitoId },
    update: {
      lastLoginAt: new Date(),
      name: displayName,
    },
    create: {
      cognitoId,
      email,
      name: displayName,
      role: 'VIEWER',   // default role — admin upgrades manually
    },
  })

  logger.info('User synced to DB', { userId: user.id, email })
  return user
}

// get full user profile from DB (includes role, clientId)
export async function getUserProfile(cognitoId: string, emailHint?: string) {
  const user = await resolveUserByCognitoIdentity(cognitoId, emailHint)

  if (!user) return null

  const withClient = await prisma.user.findUnique({
    where:   { id: user.id },
    include: { client: { select: { id: true, name: true, industry: true } } },
  })

  if (!withClient) return null

  return {
    id:        withClient.id,
    cognitoId: withClient.cognitoId,
    email:     withClient.email,
    name:      withClient.name,
    role:      withClient.role as UserRole,
    clientId:  withClient.clientId ?? undefined,
    client:    withClient.client ?? undefined,
    isActive:  withClient.isActive,
  }
}

// log audit event — called on login, logout, role changes
export async function logAuditEvent(
  userId: string,
  action: string,
  ipAddress?: string,
  userAgent?: string
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      resource:  'auth',
      ipAddress,
      userAgent,
    },
  })
}

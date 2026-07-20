/**
 * @author Khaesey Angel Tablante
 */

import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  GlobalSignOutCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider'
import { createLogger } from '@finmark/shared'

const logger = createLogger('user-auth-svc:cognito')

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
})

const CLIENT_ID     = process.env.COGNITO_CLIENT_ID!
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET

/**
 * Cognito requires SECRET_HASH when the app client has a client secret.
 * HMAC-SHA256(username + clientId, clientSecret) → base64
 */
function secretHash(username: string): string | undefined {
  if (!CLIENT_SECRET) return undefined
  return crypto
    .createHmac('sha256', CLIENT_SECRET)
    .update(username + CLIENT_ID)
    .digest('base64')
}

function withSecretHash(
  username: string,
  params: Record<string, string> = {}
): Record<string, string> {
  const hash = secretHash(username)
  return hash ? { ...params, SECRET_HASH: hash } : params
}

/**
 *  Login
 * @param email 
 * @param password 
 * @returns 
 */
export async function signIn(email: string, password: string) {
  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    ClientId: CLIENT_ID,
    AuthParameters: withSecretHash(email, {
      USERNAME: email,
      PASSWORD: password,
    }),
  })

  const response = await cognitoClient.send(command)

  if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return {
      challenge: 'NEW_PASSWORD_REQUIRED',
      session: response.Session,
    }
  }

  if (response.ChallengeName === 'SOFTWARE_TOKEN_MFA') {
    return {
      challenge: 'MFA_REQUIRED',
      session: response.Session,
    }
  }

  return {
    accessToken:  response.AuthenticationResult?.AccessToken,
    idToken:      response.AuthenticationResult?.IdToken,
    refreshToken: response.AuthenticationResult?.RefreshToken,
    expiresIn:    response.AuthenticationResult?.ExpiresIn,
  }
}

/**
 * Registration
 * @param email 
 * @param password 
 * @param name 
 * @returns 
 */
export async function signUp(email: string, password: string, name: string) {
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    SecretHash: secretHash(email),
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name',  Value: name },
    ],
  })

  const response = await cognitoClient.send(command)
  return {
    userSub:           response.UserSub,
    confirmationNeeded: !response.UserConfirmed,
  }
}

/**
 * Confirm Registration
 * @param email 
 * @param code 
 * @returns 
 */
export async function confirmSignUp(email: string, code: string) {
  const command = new ConfirmSignUpCommand({
    ClientId:         CLIENT_ID,
    Username:         email,
    ConfirmationCode: code,
    SecretHash:       secretHash(email),
  })

  await cognitoClient.send(command)
  return { confirmed: true }
}

/**
 * Refresh Token
 * @param refreshToken 
 * @returns accessToken, idToken, expiresIn.
 */
export async function refreshSession(refreshToken: string, username?: string) {
  // With a client secret, Cognito needs USERNAME + SECRET_HASH on refresh
  const params: Record<string, string> = {
    REFRESH_TOKEN: refreshToken,
  }
  if (username) {
    params.USERNAME = username
  }

  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
    ClientId: CLIENT_ID,
    AuthParameters: username ? withSecretHash(username, params) : params,
  })

  const response = await cognitoClient.send(command)
  return {
    accessToken: response.AuthenticationResult?.AccessToken,
    idToken:     response.AuthenticationResult?.IdToken,
    expiresIn:   response.AuthenticationResult?.ExpiresIn,
  }
}

/**
 * Get User from Token
 * @param accessToken 
 * @returns cognitoId (JWT sub), email, name.
 */
export async function getUserFromToken(accessToken: string) {
  const command = new GetUserCommand({ AccessToken: accessToken })
  const response = await cognitoClient.send(command)

  const attrs = Object.fromEntries(
    (response.UserAttributes || []).map(a => [a.Name, a.Value])
  )

  // Gateway authorizes using JWT `sub`, not Cognito Username (often the email)
  const decoded = jwt.decode(accessToken) as { sub?: string } | null
  const cognitoId = decoded?.sub || response.Username

  return {
    cognitoId,
    email: attrs['email'] || response.Username,
    name:  attrs['name'],
  }
}

/**
 * Forgot Password
 * @param email 
 * @returns 
 */
export async function forgotPassword(email: string) {
  const command = new ForgotPasswordCommand({
    ClientId:   CLIENT_ID,
    Username:   email,
    SecretHash: secretHash(email),
  })

  await cognitoClient.send(command)
  return { sent: true }
}

/**
 * Confirm New Passsword
 * @param email 
 * @param code 
 * @param newPassword 
 * @returns 
 */
export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
) {
  const command = new ConfirmForgotPasswordCommand({
    ClientId:         CLIENT_ID,
    Username:         email,
    ConfirmationCode: code,
    Password:         newPassword,
    SecretHash:       secretHash(email),
  })

  await cognitoClient.send(command)
  return { reset: true }
}

/**
 *  Sign Out
 * @param accessToken 
 * @returns true
 */
export async function signOut(accessToken: string) {
  const command = new GlobalSignOutCommand({ AccessToken: accessToken })
  await cognitoClient.send(command)
  return { signedOut: true }
}

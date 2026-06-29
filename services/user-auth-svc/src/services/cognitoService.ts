/**
 * @author Khaesey Angel Tablante
 */

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
 *  Login
 * @param email 
 * @param password 
 * @returns 
 */
export async function signIn(email: string, password: string) {
  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
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
  })

  await cognitoClient.send(command)
  return { confirmed: true }
}

/**
 * Refresh Token
 * @param refreshToken 
 * @returns accessToken, idToken, expiresIn.
 */
export async function refreshSession(refreshToken: string) {
  const command = new InitiateAuthCommand({
    AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
    ClientId: CLIENT_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
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
 * @returns cognitoId, email, name.
 */
export async function getUserFromToken(accessToken: string) {
  const command = new GetUserCommand({ AccessToken: accessToken })
  const response = await cognitoClient.send(command)

  const attrs = Object.fromEntries(
    (response.UserAttributes || []).map(a => [a.Name, a.Value])
  )

  return {
    cognitoId: response.Username,
    email:     attrs['email'],
    name:      attrs['name'],
  }
}

/**
 * Forgot Password
 * @param email 
 * @returns 
 */
export async function forgotPassword(email: string) {
  const command = new ForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
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

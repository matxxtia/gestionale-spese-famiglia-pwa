import crypto from 'crypto'

export type JWTUser = {
  id: string
  email?: string | null
  username?: string | null
  name?: string | null
  familyId?: string | null
  familyName?: string | null
  role?: string | null
}

export type JWTPayload = {
  user: JWTUser
  iat: number
  exp: number
}

function base64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function signToken(user: JWTUser, secret: string, expiresInSeconds = 60 * 60 * 24) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + expiresInSeconds
  const payload: JWTPayload = { user, iat, exp }

  const headerSegment = base64url(JSON.stringify(header))
  const payloadSegment = base64url(JSON.stringify(payload))
  const signingInput = `${headerSegment}.${payloadSegment}`
  const signature = crypto.createHmac('sha256', secret).update(signingInput).digest()
  const signatureSegment = base64url(signature)
  return `${signingInput}.${signatureSegment}`
}

export function verifyToken(token: string, secret: string): JWTPayload | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null
    const signingInput = `${headerB64}.${payloadB64}`
    const expectedSig = base64url(crypto.createHmac('sha256', secret).update(signingInput).digest())
    if (expectedSig !== signatureB64) return null
    const json = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const payload = JSON.parse(json) as JWTPayload
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function getBearerToken(authorizationHeader?: string | null) {
  if (!authorizationHeader) return null
  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token.trim()
}
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

const KEYCLOAK_URL = process.env.KEYCLOAK_INTERNAL_URL || process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = 'microservices-realm';

// Keycloak JWKS (JSON Web Key Set) endpoint containing public keys
const JWKS_URL = new URL(`${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`);

// createRemoteJWKSet caches Keycloak's public keys and handles key rotation automatically
const JWKS = createRemoteJWKSet(JWKS_URL);

export interface VerifiedToken {
  isValid: boolean;
  payload?: JWTPayload & {
    preferred_username?: string;
    email?: string;
    name?: string;
    realm_access?: { roles: string[] };
    customerId?: number | string;
  };
  error?: string;
}

export async function verifyTokenWithKeycloak(token: string): Promise<VerifiedToken> {
  if (!token) {
    return { isValid: false, error: 'No token provided' };
  }

  try {
    // Cryptographically verify token signature against Keycloak's public keys
    const { payload } = await jwtVerify(token, JWKS, {
      // Allow flexible issuer matching (keycloak or localhost)
      algorithms: ['RS256'],
    });

    return {
      isValid: true,
      payload: payload as VerifiedToken['payload'],
    };
  } catch (err: any) {
    console.warn('JWT verification failed against Keycloak public keys:', err.message);
    return {
      isValid: false,
      error: err.message,
    };
  }
}

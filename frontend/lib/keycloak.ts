import Keycloak from 'keycloak-js';

const KEYCLOAK_URL = process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080';

// Initialize singleton Keycloak instance
const keycloak = typeof window !== 'undefined'
  ? new Keycloak({
      url: KEYCLOAK_URL,
      realm: 'microservices-realm',
      clientId: 'nextjs-client',
    })
  : null;

export default keycloak;

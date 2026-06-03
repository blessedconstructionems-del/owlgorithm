import crypto from 'crypto';

const DEFAULT_FIREBASE_PROJECT_ID = 'owlgorithm-fdc26';
const FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certCache = {
  expiresAt: 0,
  certs: null,
};

function firebaseProjectId() {
  return `${process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID}`.trim();
}

function base64UrlDecode(value) {
  return Buffer.from(`${value}`.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function decodeJwtPart(value) {
  try {
    return JSON.parse(base64UrlDecode(value).toString('utf8'));
  } catch {
    return null;
  }
}

function cacheTtlMs(headers) {
  const cacheControl = headers.get('cache-control') || '';
  const maxAge = cacheControl.match(/max-age=(\d+)/i);
  if (!maxAge) return 60 * 60 * 1000;
  return Number(maxAge[1]) * 1000;
}

async function firebaseCerts() {
  if (certCache.certs && certCache.expiresAt > Date.now()) {
    return certCache.certs;
  }

  const response = await fetch(FIREBASE_CERTS_URL);
  if (!response.ok) {
    const error = new Error(`Could not fetch Firebase token certificates. HTTP ${response.status}`);
    error.code = 'firebase_unavailable';
    throw error;
  }

  const certs = await response.json();
  certCache = {
    certs,
    expiresAt: Date.now() + cacheTtlMs(response.headers),
  };
  return certs;
}

function verifySignature({ token, signature, signingInput, cert }) {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingInput);
  verifier.end();
  const ok = verifier.verify(cert, base64UrlDecode(signature));
  if (!ok) {
    const error = new Error('Firebase sign-in token signature is invalid.');
    error.code = 'invalid_token';
    throw error;
  }

  return token;
}

function validateClaims(payload, projectId) {
  const now = Math.floor(Date.now() / 1000);
  const issuer = `https://securetoken.google.com/${projectId}`;

  if (payload.aud !== projectId) {
    const error = new Error('Firebase sign-in token has the wrong audience.');
    error.code = 'invalid_token';
    throw error;
  }
  if (payload.iss !== issuer) {
    const error = new Error('Firebase sign-in token has the wrong issuer.');
    error.code = 'invalid_token';
    throw error;
  }
  if (!payload.sub || `${payload.sub}`.length > 128) {
    const error = new Error('Firebase sign-in token is missing a valid subject.');
    error.code = 'invalid_token';
    throw error;
  }
  if (!payload.exp || payload.exp <= now) {
    const error = new Error('Firebase sign-in token has expired.');
    error.code = 'invalid_token';
    throw error;
  }
  if (!payload.iat || payload.iat > now + 300) {
    const error = new Error('Firebase sign-in token is not valid yet.');
    error.code = 'invalid_token';
    throw error;
  }
}

export async function verifyFirebaseIdToken(idToken) {
  const token = `${idToken || ''}`.trim();
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) {
    const error = new Error('Firebase sign-in token is invalid.');
    error.code = 'invalid_token';
    throw error;
  }

  const header = decodeJwtPart(encodedHeader);
  const payload = decodeJwtPart(encodedPayload);
  if (!header || !payload || header.alg !== 'RS256' || !header.kid) {
    const error = new Error('Firebase sign-in token header is invalid.');
    error.code = 'invalid_token';
    throw error;
  }

  const certs = await firebaseCerts();
  const cert = certs[header.kid];
  if (!cert) {
    const error = new Error('Firebase sign-in token certificate is not recognized.');
    error.code = 'invalid_token';
    throw error;
  }

  verifySignature({
    token,
    signature,
    signingInput: `${encodedHeader}.${encodedPayload}`,
    cert,
  });

  const projectId = firebaseProjectId();
  validateClaims(payload, projectId);

  return {
    uid: payload.sub,
    email: payload.email || null,
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || payload.firebase?.identities?.email?.[0] || null,
    picture: payload.picture || null,
    phoneNumber: payload.phone_number || null,
    provider: payload.firebase?.sign_in_provider || 'firebase',
  };
}

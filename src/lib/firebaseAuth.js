import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { apiRequest } from '@/lib/api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAbu0mnx7hBMi45XBt4tQBlk6IuL1waFqo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'owlgorithm-fdc26.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'owlgorithm-fdc26',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'owlgorithm-fdc26.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1015807657200',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1015807657200:web:aa5036de883acdc3eeae35',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-NDDK160T31',
};

let app = null;
let auth = null;
let recaptchaVerifier = null;
let phoneConfirmation = null;

export function firebaseAuthConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

function firebaseAuth() {
  if (!firebaseAuthConfigured()) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
}

export function firebaseErrorMessage(error) {
  const code = error?.code || '';
  const messages = {
    'auth/admin-restricted-operation': 'That sign-in method is not enabled in Firebase yet.',
    'auth/captcha-check-failed': 'Phone verification failed. Try again.',
    'auth/email-already-in-use': 'That email already has an account. Check the password and try again.',
    'auth/invalid-credential': 'Those sign-in details did not match an account.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-phone-number': 'Enter a phone number with country code, like +12085551234.',
    'auth/missing-phone-number': 'Enter a phone number with country code.',
    'auth/operation-not-allowed': 'That sign-in method is not enabled in Firebase yet.',
    'auth/popup-blocked': 'Allow popups for Owlgorithm, then try Google sign-in again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/weak-password': 'Use a stronger password.',
    'auth/wrong-password': 'Those sign-in details did not match an account.',
  };

  return messages[code] || error?.message || 'Firebase sign-in failed.';
}

async function exchangeFirebaseUser(user) {
  const idToken = await user.getIdToken();
  return apiRequest('/api/auth/firebase', {
    method: 'POST',
    json: { idToken },
  });
}

async function createEmailUser({ name, email, password }) {
  const authClient = firebaseAuth();
  const credential = await createUserWithEmailAndPassword(authClient, email, password);
  const displayName = `${name || ''}`.trim();
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
}

export async function continueWithFirebaseEmail({ name, email, password }) {
  const authClient = firebaseAuth();
  const normalizedEmail = `${email || ''}`.trim().toLowerCase();

  try {
    const credential = await signInWithEmailAndPassword(authClient, normalizedEmail, password);
    return exchangeFirebaseUser(credential.user);
  } catch (signInError) {
    const code = signInError?.code || '';
    if (!['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password'].includes(code)) {
      throw signInError;
    }

    try {
      const user = await createEmailUser({ name, email: normalizedEmail, password });
      return exchangeFirebaseUser(user);
    } catch (createError) {
      if (createError?.code === 'auth/email-already-in-use') {
        throw signInError;
      }
      throw createError;
    }
  }
}

export async function continueWithFirebaseGoogle() {
  const authClient = firebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(authClient, provider);
  return exchangeFirebaseUser(credential.user);
}

export async function sendFirebasePhoneCode(phoneNumber, containerId = 'firebase-recaptcha-container') {
  const authClient = firebaseAuth();
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(authClient, containerId, {
      size: 'invisible',
    });
  }

  phoneConfirmation = await signInWithPhoneNumber(authClient, phoneNumber, recaptchaVerifier);
  return true;
}

export async function confirmFirebasePhoneCode(code) {
  if (!phoneConfirmation) {
    throw new Error('Send a phone code first.');
  }

  const credential = await phoneConfirmation.confirm(code);
  phoneConfirmation = null;
  return exchangeFirebaseUser(credential.user);
}

export async function sendFirebasePasswordReset(email) {
  const authClient = firebaseAuth();
  await sendPasswordResetEmail(authClient, `${email || ''}`.trim().toLowerCase());
  return true;
}

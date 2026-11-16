// Firebase Admin SDK (server-side) initialization
import { App, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

let adminApp: App | undefined

export function getAdminApp(): App {
  if (getApps().length) {
    // If already initialized, reuse existing app
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return (adminApp ||= getApps()[0]!)
  }

  // Cloud Run / GCP environments: Use Application Default Credentials (ADC)
  // This works automatically with Cloud Run's default service account
  const isCloudRun = process.env.K_SERVICE !== undefined
  const isGCP = process.env.GOOGLE_CLOUD_PROJECT !== undefined
  
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'paji-duolingo.firebasestorage.app'
  
  if (isCloudRun || isGCP || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Initialize with ADC (no credentials needed - uses service account automatically)
    adminApp = initializeApp({
      storageBucket,
    })
    return adminApp
  }

  // Local development: Use explicit credentials from environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or GOOGLE_APPLICATION_CREDENTIALS')
  }

  adminApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket,
  })

  return adminApp
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

export function getAdminDb() {
  return getFirestore(getAdminApp())
}

export function getAdminStorage() {
  return getStorage(getAdminApp())
}

/**
 * Verify Firebase ID token
 * Used for authenticating API requests
 */
export async function verifyIdToken(token: string) {
  const auth = getAdminAuth()
  // SECURITY: The caller's role is taken ONLY from the verified custom claim
  // on the token. It must never be backfilled from the Firestore user
  // document: that document is writable by its owner through the client SDK,
  // so trusting it here would let any user promote themselves to admin by
  // editing their own document (see pentest breakdown F-01).
  // checkRevoked=true so tokens of disabled or revoked users stop working
  // immediately instead of living out their full lifetime (F-14).
  return auth.verifyIdToken(token, true)
}

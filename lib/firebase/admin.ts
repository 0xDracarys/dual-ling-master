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
  const decodedToken = await auth.verifyIdToken(token)

  if (!(decodedToken as { role?: string }).role) {
    try {
      const userDoc = await getAdminDb().collection('users').doc(decodedToken.uid).get()
      const userRole = userDoc.exists ? (userDoc.data() as { role?: string } | undefined)?.role : undefined

      if (userRole) {
        ;(decodedToken as { role?: string }).role = userRole

        try {
          const userRecord = await auth.getUser(decodedToken.uid)
          const currentClaims = userRecord.customClaims || {}

          if (currentClaims.role !== userRole) {
            await auth.setCustomUserClaims(decodedToken.uid, {
              ...currentClaims,
              role: userRole,
            })
          }
        } catch (claimsError) {
          console.error('[Auth] Failed to sync custom claims during verifyIdToken', claimsError)
        }
      }
    } catch (error) {
      console.error('[Auth] Failed to backfill role from Firestore', error)
    }
  }

  return decodedToken
}

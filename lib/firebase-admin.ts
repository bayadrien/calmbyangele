import admin from "firebase-admin"

console.log("PROJECT ID ENV:", process.env.FIREBASE_PROJECT_ID)
console.log("CLIENT EMAIL ENV:", process.env.FIREBASE_CLIENT_EMAIL)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

export const adminDb = admin.firestore()
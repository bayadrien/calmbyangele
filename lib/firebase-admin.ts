import * as admin from "firebase-admin";

const hasServiceAccount = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY,
);

if (!admin.apps.length) {
  admin.initializeApp(
    hasServiceAccount
      ? {
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(/^"|"$/g, ""),
          }),
        }
      : { projectId: process.env.FIREBASE_PROJECT_ID },
  );
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

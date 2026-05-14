import admin from "firebase-admin";

// ✅ FIREBASE SERVICE ACCOUNT FROM ENV
const serviceAccount = {
  projectId:
    process.env.FIREBASE_PROJECT_ID,

  clientEmail:
    process.env.FIREBASE_CLIENT_EMAIL,

  privateKey:
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    ),
};

// ✅ PREVENT MULTIPLE INITIALIZATION
if (!admin.apps.length) {

  admin.initializeApp({
    credential:
      admin.credential.cert(
        serviceAccount
      ),

    // ✅ REALTIME DATABASE URL
    databaseURL:
      "https://consultant-app-a08eb-default-rtdb.firebaseio.com",
  });
}

// ✅ REALTIME DATABASE
const db = admin.database();

export default db;
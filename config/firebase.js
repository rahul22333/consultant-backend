import dotenv from "dotenv";

dotenv.config();

import admin from "firebase-admin";

// ✅ DEBUG
console.log(
  "PROJECT ID:",
  process.env.FIREBASE_PROJECT_ID
);

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

// ✅ PREVENT MULTIPLE INIT
if (!admin.apps.length) {

  admin.initializeApp({

    credential:
      admin.credential.cert(
        serviceAccount
      ),

    databaseURL:
      "https://consultant-app-a08eb-default-rtdb.firebaseio.com",
  });
}

const db = admin.database();

export default db;
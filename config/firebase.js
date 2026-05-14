import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./firebaseKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),

    // 🔥 ADD THIS (IMPORTANT)
    databaseURL: "https://consultant-app-a08eb-default-rtdb.firebaseio.com",
  });
}

const db = admin.database(); // ✅ Realtime DB

export default db;
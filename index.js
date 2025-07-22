const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");


// Prevent re-initialization if already initialized
if (!admin.apps.length) {
  const serviceAccount = require("./serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const app = express();
const port = 3000;

app.use(
  cors({
    origin: "https://explified-home.web.app",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"], // Allow PATCH method
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.json());

// ✅ Route: Get all usernames from `users` collection
// app.use("/api/users", userRouter);
app.get("/api/users/all", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();

    const usernames = snapshot.docs
      .map(doc => doc.data().firstName || doc.data().username)
      .filter(name => typeof name === "string")
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const uniqueUsernames = [...new Set(usernames)];

    res.status(200).json({ users: uniqueUsernames });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ✅ Route: Get all usernames from `AdminUsers` collection
app.get("/api/AdminUsers/all", async (req, res) => {
  try {
    const snapshot = await db.collection("AdminUsers").get();

    const usernames = snapshot.docs
      .map(doc => doc.data().firstName || doc.data().username)
      .filter(name => typeof name === "string")
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const uniqueUsernames = [...new Set(usernames)];

    res.status(200).json({ users: uniqueUsernames });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({ error: "Failed to fetch admin users" });
  }
});

// ✅ Route: Get email and name for a given username (from both collections)
app.get("/api/user-details", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const collectionsToSearch = ["users", "AdminUsers"];

    for (const collection of collectionsToSearch) {
      const snapshot = await db.collection(collection).get();

      const matchedUser = snapshot.docs
        .map(doc => doc.data())
        .find(
          doc => doc.username === username || doc.firstName === username
        );

      if (matchedUser) {
        return res.status(200).json({
          firstName: matchedUser.firstName || matchedUser.username,
          email: matchedUser.email || "",
        });
      }
    }

    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Only run when script.js is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Script API server running`);
  });
}

// Export the app if used by another file (e.g. index.js)
module.exports = app;

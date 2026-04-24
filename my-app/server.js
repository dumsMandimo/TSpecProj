const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

// =====================
// Middleware
// =====================
app.use(express.json());

// IMPORTANT: path to React build
const buildPath = path.join(__dirname, "build");

// Serve React static files
app.use(express.static(buildPath));

// =====================
// Temporary in-memory store (replace with DB later)
// =====================
let profiles = {};

// =====================
// API ROUTES (must come BEFORE catch-all)
// =====================

// Create profile
app.post("/api/profile", (req, res) => {
  const { userId, name, education, skills, cv } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  profiles[userId] = { name, education, skills, cv };

  res.json({
    message: "Profile saved",
    profile: profiles[userId],
  });
});

// Update profile
app.put("/api/profile/:userId", (req, res) => {
  const { userId } = req.params;

  if (!profiles[userId]) {
    return res.status(404).json({ message: "Profile not found" });
  }

  profiles[userId] = {
    ...profiles[userId],
    ...req.body,
  };

  res.json({
    message: "Profile updated",
    profile: profiles[userId],
  });
});

// =====================
// React SPA CATCH-ALL ROUTE
// =====================
// THIS FIXES /login 404, /dashboard 404, etc.

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

// =====================
// Start server
// =====================
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
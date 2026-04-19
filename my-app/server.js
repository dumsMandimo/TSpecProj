const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// React fallback route

// Serve React build files
app.use(express.static(path.join(__dirname, "build")));

// Temporary in-memory store (replace with DB later)
let profiles = {};

// Create profile (Save)
app.post("/api/profile", (req, res) => {
  const { userId, name, education, skills, cv } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }
  profiles[userId] = { name, education, skills, cv };
  res.json({ message: "Profile saved", profile: profiles[userId] });
});

// Update profile
app.put("/api/profile/:userId", (req, res) => {
  const { userId } = req.params;
  if (!profiles[userId]) {
    return res.status(404).json({ message: "Profile not found" });
  }
  profiles[userId] = { ...profiles[userId], ...req.body };
  res.json({ message: "Profile updated", profile: profiles[userId] });
});

// Catch-all route for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

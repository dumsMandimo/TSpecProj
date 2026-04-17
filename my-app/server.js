const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// Catch-all handler to serve index.html for all routes (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
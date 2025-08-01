const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// This line tells Express to serve any static files (like HTML, CSS, and JS)
// from a directory named 'public'. The 'path.join' ensures it works on any OS.
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

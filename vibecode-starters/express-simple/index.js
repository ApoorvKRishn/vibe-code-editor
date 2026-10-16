const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <main style="font-family: system-ui; text-align: center; padding: 3rem">
      <h1>Express</h1>
      <p>Edit <code>index.js</code> and save — nodemon restarts the server automatically.</p>
      <p>Try the JSON endpoint: <a href="/api/hello">/api/hello</a></p>
    </main>
  `);
});

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express!", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) =>
  c.html(`
    <main style="font-family: system-ui; text-align: center; padding: 3rem">
      <h1>Hono</h1>
      <p>Edit <code>src/index.js</code> and save — nodemon restarts the server automatically.</p>
      <p>Try the JSON endpoint: <a href="/api/hello">/api/hello</a></p>
    </main>
  `)
);

app.get("/api/hello", (c) =>
  c.json({ message: "Hello from Hono!", time: new Date().toISOString() })
);

const port = Number(process.env.PORT) || 3000;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

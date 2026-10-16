"use client";

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="container">
      <h1>Next.js</h1>
      <p>Edit <code>app/page.js</code>, save, and watch the preview update.</p>
      <button onClick={() => setCount((c) => c + 1)}>Count is {count}</button>
    </main>
  );
}

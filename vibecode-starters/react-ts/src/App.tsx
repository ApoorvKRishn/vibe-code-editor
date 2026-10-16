import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="container">
      <h1>React + TypeScript</h1>
      <p>Edit <code>src/App.tsx</code>, save, and watch the preview update.</p>
      <button onClick={() => setCount((c) => c + 1)}>Count is {count}</button>
    </main>
  );
}

export default App;

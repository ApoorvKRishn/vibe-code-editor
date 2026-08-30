"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CreateWorkspaceParams {
  name: string;
  description?: string;
  language: string;
}

const TEMPLATES: Record<string, { name: string; path: string; content: string }[]> = {
  javascript: [
    {
      name: "index.js",
      path: "/index.js",
      content: `// JavaScript Playground\n\nfunction greet(name) {\n  return \`Hello, \${name}! Welcome to Vibe Code Editor.\`;\n}\n\nconsole.log(greet("Developer"));\n\n// Try writing an algorithm or API simulation below:\nconst items = [10, 20, 30, 40, 50];\nconst sum = items.reduce((acc, curr) => acc + curr, 0);\nconsole.log("Sum of items:", sum);\n`,
    },
    {
      name: "README.md",
      path: "/README.md",
      content: `# JavaScript Project\n\nRun this file by pressing **Run (Ctrl + Enter)** or the Run button in the top toolbar.`,
    },
  ],
  typescript: [
    {
      name: "index.ts",
      path: "/index.ts",
      content: `// TypeScript Playground\n\ninterface User {\n  id: number;\n  name: string;\n  role: string;\n}\n\nconst user: User = {\n  id: 1,\n  name: "Alex",\n  role: "Software Engineer",\n};\n\nconsole.log(\`User: \${user.name} (\${user.role})\`);\n`,
    },
  ],
  python: [
    {
      name: "main.py",
      path: "/main.py",
      content: `# Python 3 Script\n\ndef fibonacci(n):\n    sequence = [0, 1]\n    while len(sequence) < n:\n        sequence.append(sequence[-1] + sequence[-2])\n    return sequence\n\nprint("Welcome to Vibe Code Editor - Python Environment")\nprint("Fibonacci series (first 10 numbers):", fibonacci(10))\n`,
    },
    {
      name: "README.md",
      path: "/README.md",
      content: `# Python Workspace\n\nPress **Run** to execute this script in a sandboxed runtime.`,
    },
  ],
  cpp: [
    {
      name: "main.cpp",
      path: "/main.cpp",
      content: `#include <iostream>\n#include <vector>\n#include <numeric>\n\nusing namespace std;\n\nint main() {\n    cout << "=== Vibe Code Editor C++ Runner ===" << endl;\n    \n    vector<int> nums = {1, 2, 3, 4, 5};\n    int sum = accumulate(nums.begin(), nums.end(), 0);\n    \n    cout << "Array Sum: " << sum << endl;\n    cout << "Execution Successful!" << endl;\n    return 0;\n}\n`,
    },
  ],
  java: [
    {
      name: "Main.java",
      path: "/Main.java",
      content: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Vibe Code Editor in Java!");\n        \n        int a = 15;\n        int b = 27;\n        System.out.println("Result of " + a + " + " + b + " = " + (a + b));\n    }\n}\n`,
    },
  ],
  html: [
    {
      name: "index.html",
      path: "/index.html",
      content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>My Web Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <div class="container">\n    <h1>Hello Vibe World 🚀</h1>\n    <p>Built with Vibe Code Editor</p>\n    <button id="btn">Click Me</button>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>\n`,
    },
    {
      name: "style.css",
      path: "/style.css",
      content: `body {\n  font-family: system-ui, sans-serif;\n  background: #0f172a;\n  color: #f8fafc;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}\n.container {\n  text-align: center;\n  padding: 2rem;\n  border-radius: 12px;\n  background: #1e293b;\n  box-shadow: 0 10px 25px rgba(0,0,0,0.5);\n}\nbutton {\n  padding: 10px 20px;\n  border-radius: 8px;\n  border: none;\n  background: #3b82f6;\n  color: white;\n  cursor: pointer;\n  font-weight: 600;\n}\nbutton:hover {\n  background: #2563eb;\n}\n`,
    },
    {
      name: "script.js",
      path: "/script.js",
      content: `document.getElementById('btn')?.addEventListener('click', () => {\n  alert('Button clicked in Vibe Code Editor preview!');\n});\n`,
    },
  ],
};

export async function createWorkspace(params: CreateWorkspaceParams) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const workspace = await db.workspace.create({
    data: {
      name: params.name,
      description: params.description || "",
      language: params.language,
      userId: session.user.id,
    },
  });

  // Seed default files based on selected language
  const templateFiles = TEMPLATES[params.language] || TEMPLATES.javascript;
  for (const file of templateFiles) {
    await db.fileItem.create({
      data: {
        name: file.name,
        path: file.path,
        content: file.content,
        isFolder: false,
        workspaceId: workspace.id,
      },
    });
  }

  revalidatePath("/");
  return workspace;
}

export async function getUserWorkspaces() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return db.workspace.findMany({
    where: { userId: session.user.id },
    include: {
      files: {
        select: { id: true, name: true, path: true, isFolder: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getWorkspaceById(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return db.workspace.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      files: true,
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}

export async function deleteWorkspace(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await db.workspace.delete({
    where: {
      id,
      userId: session.user.id,
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateWorkspace(id: string, name: string, description?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const updated = await db.workspace.update({
    where: { id, userId: session.user.id },
    data: {
      name,
      description: description ?? "",
    },
  });

  revalidatePath("/");
  return updated;
}

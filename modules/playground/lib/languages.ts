import type { Templates } from "@prisma/client";
import type { TemplateFolder } from "./types";

export interface RunnableLanguage {
  label: string;
  /** Language id used by the Judge0 API (GET https://ce.judge0.com/languages). */
  judge0Id: number;
}

// Which language a file runs as is decided by its extension.
export const RUNNABLE_LANGUAGES: Record<string, RunnableLanguage> = {
  cpp: { label: "C++ (GCC 14)", judge0Id: 105 },
  py: { label: "Python 3.12", judge0Id: 100 },
  java: { label: "Java (JDK 17)", judge0Id: 91 },
  js: { label: "JavaScript (Node 22)", judge0Id: 102 },
  ts: { label: "TypeScript 5.6", judge0Id: 101 },
  go: { label: "Go 1.23", judge0Id: 107 },
  rs: { label: "Rust 1.85", judge0Id: 108 },
};

export const getRunnableLanguage = (fileExtension: string) =>
  RUNNABLE_LANGUAGES[fileExtension.toLowerCase()] ?? null;

const file = (name: string, content: string) => {
  const dot = name.lastIndexOf(".");
  return { filename: name.slice(0, dot), fileExtension: name.slice(dot + 1), content };
};

const project = (...files: ReturnType<typeof file>[]): TemplateFolder => ({
  folderName: "root",
  items: files,
});

interface Starter {
  label: string;
  description: string;
  /** The file opened when a new project is first loaded. */
  mainFile: string;
  files: TemplateFolder;
}

// Every new project starts from one of these small file trees.
export const STARTERS: Record<Templates, Starter> = {
  CPP: {
    label: "C++",
    description: "Compiled with GCC 14",
    mainFile: "main.cpp",
    files: project(
      file(
        "main.cpp",
        `#include <iostream>
using namespace std;

int main() {
    string name;
    cin >> name;
    cout << "Hello, " << name << "!" << endl;
    return 0;
}
`
      )
    ),
  },
  PYTHON: {
    label: "Python",
    description: "Python 3.12",
    mainFile: "main.py",
    files: project(file("main.py", `name = input()\nprint(f"Hello, {name}!")\n`)),
  },
  JAVA: {
    label: "Java",
    description: "JDK 17 — the class must be named Main",
    mainFile: "Main.java",
    files: project(
      file(
        "Main.java",
        `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.next();
        System.out.println("Hello, " + name + "!");
    }
}
`
      )
    ),
  },
  JAVASCRIPT: {
    label: "JavaScript",
    description: "Node.js 22",
    mainFile: "main.js",
    files: project(
      file(
        "main.js",
        `const input = require("fs").readFileSync(0, "utf8").trim();\nconsole.log(\`Hello, \${input}!\`);\n`
      )
    ),
  },
  TYPESCRIPT: {
    label: "TypeScript",
    description: "TypeScript 5.6",
    mainFile: "main.ts",
    files: project(
      file(
        "main.ts",
        `declare const require: any;\n\nconst input: string = require("fs").readFileSync(0, "utf8").trim();\nconsole.log(\`Hello, \${input}!\`);\n`
      )
    ),
  },
  GO: {
    label: "Go",
    description: "Go 1.23",
    mainFile: "main.go",
    files: project(
      file(
        "main.go",
        `package main

import "fmt"

func main() {
\tvar name string
\tfmt.Scan(&name)
\tfmt.Printf("Hello, %s!\\n", name)
}
`
      )
    ),
  },
  RUST: {
    label: "Rust",
    description: "Rust 1.85",
    mainFile: "main.rs",
    files: project(
      file(
        "main.rs",
        `use std::io;

fn main() {
    let mut name = String::new();
    io::stdin().read_line(&mut name).unwrap();
    println!("Hello, {}!", name.trim());
}
`
      )
    ),
  },
  WEB: {
    label: "HTML / CSS / JS",
    description: "Static web page with a live preview",
    mainFile: "index.html",
    files: project(
      file(
        "index.html",
        `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>Hello, web!</h1>
    <button id="btn">Click me</button>
    <script src="script.js"></script>
  </body>
</html>
`
      ),
      file("style.css", `body {\n  font-family: sans-serif;\n  padding: 2rem;\n}\n`),
      file(
        "script.js",
        `document.getElementById("btn").addEventListener("click", () => {\n  alert("It works!");\n});\n`
      )
    ),
  },
};

// New files get the matching starter file's code, keyed by extension
// (main.cpp's code for any .cpp file, style.css's for any .css file, ...).
const STARTER_CONTENT_BY_EXTENSION: Record<string, string> = {};
for (const starter of Object.values(STARTERS)) {
  for (const item of starter.files.items) {
    if ("fileExtension" in item) {
      STARTER_CONTENT_BY_EXTENSION[item.fileExtension.toLowerCase()] ??= item.content;
    }
  }
}

/** Default code for a new file with this extension, or "" if there is none. */
export const getStarterContent = (fileExtension: string) =>
  STARTER_CONTENT_BY_EXTENSION[fileExtension.toLowerCase()] ?? "";

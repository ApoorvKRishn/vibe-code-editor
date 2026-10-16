# Vibe Code Editor

A cloud-based code editor that runs in the browser. Write code in multiple files,
run it in **7 languages** with custom input, preview HTML/CSS/JS pages live, and ask
a **Google Gemini** AI pair-programmer to explain, debug or fix your code — and apply
the fix with one click.

## Features

- **Virtual File System** — create, rename and delete files and folders; the whole
  project tree is stored as one JSON document in MongoDB.
- **Multi-tab editor** — Monaco (the editor behind VS Code) with one tab per open file.
- **Auto-save** — changes are saved 1.5 s after you stop typing (debounced); `Ctrl+S`
  saves immediately.
- **Code execution** — C++, Python, Java, JavaScript, TypeScript, Go and Rust run in
  the [Judge0](https://judge0.com) sandbox, with stdin input, execution time and memory.
- **Live web preview** — HTML/CSS/JS projects render in a sandboxed iframe as you type.
- **AI pair-programmer** — Gemini sees the open file and your last run output;
  "Explain", "Find bugs" and "Fix it" actions, plus an **Apply** button that writes
  the AI's fix into the editor.
- **Google and GitHub login** with NextAuth; every project is private to its owner.

## Tech stack

| Layer     | Technology                                 |
| --------- | ------------------------------------------ |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| UI        | Tailwind CSS, shadcn/ui                    |
| Editor    | Monaco Editor                              |
| State     | Zustand (open files, file tree)            |
| Auth      | NextAuth v5 (Google + GitHub OAuth, JWT sessions) |
| Database  | MongoDB via Prisma                         |
| Execution | Judge0 API                                 |
| AI        | Google Gemini API                          |
| Hosting   | Vercel                                     |

## Architecture

```
Browser (React)                         Next.js server                 External
───────────────                         ──────────────                 ────────
Monaco editor + tabs ─┐
File explorer (Zustand)├─ auto-save ──▶ Server Action SaveUpdatedCode ─▶ MongoDB
                      │                 (checks the user owns it)
Run panel ────────────┼─ POST /api/run ▶ auth → rate limit → validate ─▶ Judge0 sandbox
AI panel ─────────────┼─ POST /api/ai ─▶ auth → rate limit → validate ─▶ Gemini API
Preview (iframe srcdoc)┘  (built in the browser, no server call)
```

### Data model

- `User` / `Account` — created by NextAuth on first login.
- `Playground` — a project: title, language template, owner.
- `TemplateFile` — the project's whole file tree as one JSON document
  (one per playground).
- `StarMark` — projects a user has starred.

### Key design decisions

- **Why Judge0 instead of running code on my server?** Running untrusted code on
  the web server could let a user read secrets or crash the server. Judge0 runs
  each submission in an isolated sandbox with CPU-time and memory limits.
- **Why store the file tree as one JSON document?** Projects are small, and the
  editor always loads and saves the whole project, so one read and one write per
  save is simplest. For large projects I would store one document per file.
- **Why debounce auto-save?** Saving on every keystroke would send hundreds of
  writes; waiting until typing pauses sends one.
- **How does "Apply fix" work?** The AI route asks Gemini for *structured output*:
  JSON with a `reply` (markdown explanation) and `fixedCode` (the full corrected
  file). The Apply button writes `fixedCode` into the editor, so nothing has to be
  parsed out of free text. If the main model is overloaded, the server retries once
  on a lighter model.
- **Why is the preview iframe sandboxed?** `sandbox="allow-scripts"` without
  `allow-same-origin` runs the user's JavaScript in an isolated origin, so it
  cannot read the app's cookies or call the API as the user.
- **Security** — every API route and server action checks the session, and every
  database query filters by `userId`, so users can only see their own projects.
  Inputs are validated with Zod, and run/AI requests are rate-limited per user.

### Limitations / what I'd improve

- Only the open file is executed (Judge0 runs a single file), not multi-file programs.
- The rate limiter is in memory, so on Vercel it is per server instance; Redis would
  make it global.
- No real-time collaboration; version history would be a good next feature.

## Getting started

```bash
git clone https://github.com/ApoorvKRishn/vibe-code-editor.git
cd vibe-code-editor
npm install
cp .env.example .env   # fill in the values
npm run dev
```

Open http://localhost:3000.

You need:

1. A MongoDB database (free tier on MongoDB Atlas) → `DATABASE_URL`
2. A GitHub OAuth app → `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
   (callback URL `http://localhost:3000/api/auth/callback/github`)
3. A Google OAuth client → `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   (redirect URI `http://localhost:3000/api/auth/callback/google`)
4. `AUTH_SECRET` — generate with `npx auth secret`
5. A Gemini API key from Google AI Studio → `GEMINI_API_KEY`

The public Judge0 instance is used by default and needs no key.

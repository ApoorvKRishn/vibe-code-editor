import { auth } from "@/auth";
import { getUserWorkspaces } from "@/modules/workspaces/actions";
import { CreateWorkspaceDialog } from "@/modules/workspaces/components/create-workspace-dialog";
import { WorkspaceCard } from "@/modules/workspaces/components/workspace-card";
import UserButton from "@/modules/auth/components/user-button";
import {
  Code2,
  Sparkles,
  Terminal,
  FolderPlus,
  Cpu,
  Layers,
  Zap,
} from "lucide-react";

const QUICK_STARTERS = [
  {
    title: "Python 3 Script",
    language: "python",
    icon: "🐍",
    desc: "Data structures, algorithms & scripting",
    color: "from-amber-500/10 to-yellow-500/5 hover:border-yellow-500/40",
  },
  {
    title: "C++ (DSA)",
    language: "cpp",
    icon: "⚡",
    desc: "Competitive programming & low-level algorithms",
    color: "from-blue-500/10 to-cyan-500/5 hover:border-blue-500/40",
  },
  {
    title: "JavaScript (Node)",
    language: "javascript",
    icon: "🟨",
    desc: "Modern JS runtime with full async support",
    color: "from-yellow-500/10 to-amber-500/5 hover:border-amber-500/40",
  },
  {
    title: "TypeScript App",
    language: "typescript",
    icon: "🔷",
    desc: "Type-safe runtime with interface autocomplete",
    color: "from-blue-500/10 to-indigo-500/5 hover:border-indigo-500/40",
  },
  {
    title: "Web Starter",
    language: "html",
    icon: "🌐",
    desc: "HTML5, CSS3, JS playground with live preview",
    color: "from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/40",
  },
  {
    title: "Java OOP",
    language: "java",
    icon: "☕",
    desc: "Object-oriented programming environment",
    color: "from-orange-500/10 to-red-500/5 hover:border-orange-500/40",
  },
];

export default async function Home() {
  const session = await auth();
  const workspaces = await getUserWorkspaces();

  return (
    <div className="min-h-screen bg-[#090d16] text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-[#090d16]/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              Vibe Code Editor
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Cloud IDE
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <CreateWorkspaceDialog />
          <UserButton />
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-10">
        {/* Welcome Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Next-Gen Cloud IDE & AI Pair Programmer
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Welcome back, {session?.user?.name || "Developer"} ⚡
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Create multi-file projects, execute code in 10+ sandboxed runtimes, collaborate with peers in real-time, and vibe-code with built-in AI assistance.
            </p>
          </div>

          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-zinc-800/80">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-xs font-medium text-zinc-400">Execution Engine</div>
                <div className="text-sm font-semibold text-zinc-200">Sandboxed Piston API</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Cpu className="h-5 w-5 text-blue-400" />
              <div>
                <div className="text-xs font-medium text-zinc-400">Editor Core</div>
                <div className="text-sm font-semibold text-zinc-200">Monaco (VS Code Engine)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-purple-400" />
              <div>
                <div className="text-xs font-medium text-zinc-400">File System</div>
                <div className="text-sm font-semibold text-zinc-200">Virtual VFS + DB Sync</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-amber-400" />
              <div>
                <div className="text-xs font-medium text-zinc-400">AI Assistant</div>
                <div className="text-sm font-semibold text-zinc-200">Streaming Vibe Copilot</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Starter Templates */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Quick Starters
            </h3>
            <span className="text-xs text-zinc-400">Select a template to spin up a new workspace</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {QUICK_STARTERS.map((item) => (
              <CreateWorkspaceDialog key={item.language} defaultLanguage={item.language}>
                <button
                  type="button"
                  className={`w-full p-4 rounded-xl border border-zinc-800 bg-gradient-to-br ${item.color} text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-between cursor-pointer group`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-semibold text-sm text-zinc-200 group-hover:text-white">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 group-hover:text-zinc-300">
                      {item.desc}
                    </p>
                  </div>
                  <FolderPlus className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 transition-colors ml-2 shrink-0" />
                </button>
              </CreateWorkspaceDialog>
            ))}
          </div>
        </section>

        {/* User Workspaces Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-400" />
              Your Workspaces ({workspaces.length})
            </h3>
          </div>

          {workspaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center space-y-4 bg-zinc-900/30">
              <div className="mx-auto h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Code2 className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-semibold text-white">No workspaces yet</h4>
                <p className="text-xs text-zinc-400">
                  Get started by selecting one of the starter templates above or create a custom workspace.
                </p>
              </div>
              <CreateWorkspaceDialog />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspaces.map((ws) => (
                <WorkspaceCard key={ws.id} workspace={ws} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

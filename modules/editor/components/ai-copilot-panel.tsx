"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  RotateCcw,
  Copy,
  Check,
  Code,
  Zap,
  Bug,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AICopilotPanelProps {
  activeFileName?: string;
  activeFileContent?: string;
  language?: string;
  onApplyCode?: (newCode: string) => void;
}

const QUICK_ACTIONS = [
  { label: "Explain Code", icon: BookOpen, prompt: "Explain how this code works step-by-step." },
  { label: "Find Bugs", icon: Bug, prompt: "Analyze this code for bugs, edge cases, or syntax errors." },
  { label: "Optimize", icon: Zap, prompt: "Optimize this code for better time and space complexity." },
  { label: "Add Tests", icon: Code, prompt: "Generate comprehensive unit tests for this code." },
];

export function AICopilotPanel({
  activeFileName,
  activeFileContent,
  language,
  onApplyCode,
}: AICopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `👋 Hi! I'm **Vibe AI**, your pair programmer.\n\nI have full context of \`${activeFileName || "your active file"}\`. Ask me to explain, optimize, write tests, or fix bugs!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const userMessage: Message = { role: "user", content: messageText.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          codeContext: activeFileContent,
          language,
          activeFileName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          const last = next[lastIdx];
          if (last && last.role === "assistant") {
            next[lastIdx] = {
              ...last,
              content: last.content + chunk,
            };
          }
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Sorry, I encountered an error communicating with the AI service. Please check your API keys or try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] border-l border-zinc-800 text-zinc-200 select-none">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-[#0d1220]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-white">Vibe Copilot</h3>
            <span className="text-[10px] text-zinc-400 font-mono">
              Context: {activeFileName || "None"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                role: "assistant",
                content: `Chat cleared. How can I help with \`${activeFileName || "your code"}\`?`,
              },
            ])
          }
          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
          title="Clear Chat"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick Action Chips */}
      <div className="p-2.5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => handleSendMessage(action.prompt)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800/80 hover:bg-blue-600/20 hover:border-blue-500/40 border border-zinc-700 text-[11px] text-zinc-300 hover:text-blue-300 whitespace-nowrap transition-all"
            >
              <Icon className="h-3 w-3 text-blue-400" />
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3.5 font-sans select-text text-xs">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="h-6 w-6 rounded-md bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`p-3 rounded-xl max-w-[88%] leading-relaxed ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-bl-none shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {!isUser && msg.content.includes("```") && onApplyCode && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const codeMatch = msg.content.match(/```[\w]*\n([\s\S]*?)```/);
                        if (codeMatch && codeMatch[1]) {
                          onApplyCode(codeMatch[1]);
                        }
                      }}
                      className="h-6 px-2 text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Apply Code to Editor
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.content, idx)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-6 w-6 rounded-md bg-zinc-700 text-zinc-200 flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-2.5 items-center text-xs text-zinc-400">
            <Bot className="h-4 w-4 text-blue-400 animate-spin" />
            <span>Vibe AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-2.5 border-t border-zinc-800 bg-[#0d1220] flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask Vibe AI anything about this code..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading || !input.trim()}
          className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  /** The complete corrected file, when the AI proposed a fix. */
  fixedCode?: string | null;
}

const QUICK_ACTIONS = [
  { label: "Explain", prompt: "Explain what this code does, step by step." },
  { label: "Find bugs", prompt: "Find bugs or problems in this code and explain them." },
  {
    label: "Fix it",
    prompt: "Fix the errors in this code (use the run output if there is one).",
  },
];

interface AIPanelProps {
  fileName: string | null;
  code: string;
  runOutput: string;
  onApplyCode: (code: string) => void;
}

export function AIPanel({ fileName, code, runOutput, onApplyCode }: AIPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (!fileName) {
      toast.info("Open a file first so the AI can see your code");
      return;
    }

    const history: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          code,
          runOutput,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");
      setMessages([
        ...history,
        { role: "assistant", content: data.reply, fixedCode: data.fixedCode },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI request failed");
      setMessages(messages); // drop the unanswered question
      setInput(text);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground pt-8 space-y-2">
            <Bot className="h-8 w-8 mx-auto" />
            <p>Ask Gemini about {fileName ?? "your code"}.</p>
            <p className="text-xs">It sees the open file and the output of your last run.</p>
          </div>
        )}

        {messages.map((message, i) => {
          const fix = message.fixedCode ?? null;
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg p-3 text-sm",
                message.role === "user" ? "bg-primary text-primary-foreground ml-8" : "bg-muted mr-2"
              )}
            >
              {message.role === "user" ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="space-y-2 [&_pre]:overflow-x-auto [&_pre]:bg-background [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs [&_code]:font-mono [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}
              {fix !== null && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    onApplyCode(fix);
                    toast.success(`Applied to ${fileName}`);
                  }}
                >
                  <Check className="h-4 w-4" /> Apply to {fileName}
                </Button>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 space-y-2">
        <div className="flex gap-2 flex-wrap">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={() => send(action.prompt)}
            >
              {action.label}
            </Button>
          ))}
          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => setMessages([])}
              aria-label="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about your code... (Enter to send)"
            className="min-h-10 max-h-32 text-sm"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

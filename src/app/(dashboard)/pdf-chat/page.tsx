"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Database, Globe, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type AnswerType = "final" | "ask_global" | "ask_general";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  answerType?: AnswerType;
};

function QuickReplyButtons({ onReply }: { onReply: (text: string) => void }) {
  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      <button
        onClick={() => onReply("Yes")}
        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full transition-colors"
      >
        ✅ Yes, go ahead
      </button>
      <button
        onClick={() => onReply("No")}
        className="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-full border border-border transition-colors"
      >
        ❌ No, thanks
      </button>
    </div>
  );
}

function MessageBubble({ message, onQuickReply, isLast }: {
  message: Message;
  onQuickReply: (text: string) => void;
  isLast: boolean;
}) {
  // Show Yes/No only when answerType requires it AND it's the last message
  const showButtons = isLast &&
    message.role === "assistant" &&
    (message.answerType === "ask_global" || message.answerType === "ask_general");

  const isGeneralMode = message.content.startsWith("[GENERAL KNOWLEDGE MODE]");
  const displayContent = isGeneralMode
    ? message.content.replace("[GENERAL KNOWLEDGE MODE]", "").trim()
    : message.content;

  const isFromDocs = !isGeneralMode && (
    message.content.toLowerCase().includes("found in") ||
    message.content.toLowerCase().includes("according to")
  );

  return (
    <div className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}>
      <div className={cn("flex flex-col max-w-[80%]", message.role === "user" ? "items-end" : "items-start")}>
        <div className={cn(
          "flex rounded-2xl px-5 py-4",
          message.role === "user" ? "bg-indigo-600 text-white ml-auto" : "bg-muted text-foreground"
        )}>
          <div className="mr-3 mt-0.5 flex-shrink-0">
            {message.role === "user"
              ? <User className="w-5 h-5 opacity-80" />
              : <Bot className="w-5 h-5 text-indigo-500" />}
          </div>
          <div className="flex flex-col gap-2">
            {isGeneralMode && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit">
                <Globe className="w-3 h-3" /> General Knowledge
              </span>
            )}
            {isFromDocs && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">
                <BookOpen className="w-3 h-3" /> From your documents
              </span>
            )}
            <p className="whitespace-pre-wrap leading-relaxed text-sm">{displayContent}</p>
          </div>
        </div>
        {showButtons && (
          <div className="mt-2 ml-8">
            <QuickReplyButtons onReply={onQuickReply} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function PdfChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your PDF Chat Assistant. Ask me anything about your uploaded documents.",
      answerType: "final",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/pdf-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text.trim() }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: (response.ok && data.success)
          ? data.answer
          : (data.error || "Sorry, an error occurred. Please try again."),
        answerType: data.answerType || "final",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "A network error occurred. Please try again.",
        answerType: "final",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex flex-col flex-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center px-6 py-4 border-b border-border bg-muted/30 gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <Database className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">PDF Chat Assistant</h1>
            <p className="text-xs text-muted-foreground">Powered by Pinecone RAG + LLM fallback</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, i) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLast={i === messages.length - 1}
              onQuickReply={sendMessage}
            />
          ))}
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="flex max-w-[80%] rounded-2xl px-5 py-4 bg-muted text-foreground items-center gap-3">
                <Bot className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Searching documents…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border bg-background">
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(input); }}
            className="flex items-center gap-3 bg-muted/50 p-2 rounded-full border border-border focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question about your PDFs…"
              className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm text-foreground placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "I'm going from Yelahanka to Indiranagar, what can I eat on the way?",
  "Best biryani spots in Bengaluru?",
  "Underrated cafes near Koramangala",
  "Which spots are overhyped right now?",
];

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hey! I'm **NammaNomNom**, your Bangalore food guide. Ask me things like *\"I'm driving from Yelahanka to Indiranagar, what's good on the way?\"* or *\"underrated coffee in Indiranagar\"*. I'll recommend from real community-loved spots.",
};

export function ChatPane() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || loading) return;
    setError(null);

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: clean },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      // Strip the canned welcome from history sent to the model.
      const history = nextMessages.filter((m) => m !== WELCOME);
      const { content } = await api.ask(history);
      setMessages([...nextMessages, { role: "assistant", content }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-1/2 right-0 -translate-y-1/2 z-[1001] bg-white/92 dark:bg-slate-950/92 backdrop-blur-xl border-y border-l border-slate-900/10 dark:border-white/[0.09] rounded-l-xl px-3 py-4 shadow-[0_10px_48px_rgba(15,23,42,0.18)] dark:shadow-[0_10px_48px_rgba(0,0,0,0.55)] hover:bg-slate-50/95 dark:hover:bg-slate-900/95 transition group"
        aria-label="Open Ask NammaNomNom"
      >
        <div className="flex flex-col items-center gap-2 [writing-mode:vertical-rl] rotate-180">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
            Ask NammaNomNom
          </span>
          <span className="text-amber-500 dark:text-amber-400 text-sm">✨</span>
        </div>
      </button>
    );
  }

  return (
    <aside className="absolute top-0 right-0 z-[1001] h-screen w-[440px] max-w-[90vw] bg-white/92 dark:bg-slate-950/92 backdrop-blur-xl border-l border-slate-900/10 dark:border-white/[0.09] shadow-[0_10px_48px_rgba(15,23,42,0.18)] dark:shadow-[0_10px_48px_rgba(0,0,0,0.55)] flex flex-col">
      <header className="px-5 pt-5 pb-4 border-b border-slate-900/5 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 text-[11px] font-bold shadow-[0_0_14px_rgba(250,204,21,0.4)]">
            ✨
          </span>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Ask NammaNomNom
          </h2>
          <button
            onClick={() => setCollapsed(true)}
            className="ml-auto text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-sm w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-900/10 dark:hover:bg-white/10"
            aria-label="Collapse chat"
            title="Collapse"
          >
            ›
          </button>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
          Powered by Claude Haiku 4.5 · grounded in the community dataset.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2 items-center text-slate-500 dark:text-slate-400 text-xs pl-1"
            >
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse [animation-delay:120ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse [animation-delay:240ms]" />
              </span>
              <span className="text-slate-500">Thinking…</span>
            </motion.div>
          )}
        </AnimatePresence>
        {error && (
          <div className="text-[11px] text-red-700 dark:text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {messages.length <= 1 && !loading && (
        <div className="px-4 pb-2 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Try one of these
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[11px] text-left px-2.5 py-1.5 rounded-lg bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-slate-100 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-slate-900/5 dark:border-white/[0.06]">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder="Ask about routes, cuisines, dishes…"
            className="w-full resize-none text-sm pl-3 pr-10 py-2.5 rounded-lg bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:bg-slate-900/[0.06] dark:focus:bg-white/[0.06] focus:border-amber-500/50 dark:focus:border-amber-400/40 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 w-7 h-7 rounded-md bg-amber-500 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-400 dark:hover:bg-amber-300 transition flex items-center justify-center"
            aria-label="Send"
          >
            →
          </button>
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-600 mt-1.5 flex justify-between">
          <span>Enter to send · Shift+Enter for newline</span>
          {messages.length > 1 && (
            <button
              onClick={() => {
                setMessages([WELCOME]);
                setError(null);
              }}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={clsx("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={clsx(
          "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950 font-medium rounded-br-sm"
            : "bg-slate-900/[0.04] text-slate-900 border border-slate-900/10 dark:bg-white/[0.05] dark:text-slate-100 dark:border-white/[0.08] rounded-bl-sm"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...p }) => <p className="mb-2 last:mb-0" {...p} />,
              strong: ({ node, ...p }) => (
                <strong className="font-semibold text-amber-700 dark:text-amber-200" {...p} />
              ),
              em: ({ node, ...p }) => (
                <em className="italic text-slate-700 dark:text-slate-300" {...p} />
              ),
              ul: ({ node, ...p }) => (
                <ul className="list-disc pl-5 space-y-1 mb-2 last:mb-0" {...p} />
              ),
              ol: ({ node, ...p }) => (
                <ol className="list-decimal pl-5 space-y-1 mb-2 last:mb-0" {...p} />
              ),
              li: ({ node, ...p }) => <li className="text-slate-800 dark:text-slate-200" {...p} />,
              code: ({ node, ...p }) => (
                <code
                  className="bg-slate-200 text-amber-700 dark:bg-slate-800/80 dark:text-amber-200 px-1 py-0.5 rounded text-[11px]"
                  {...p}
                />
              ),
              a: ({ node, ...p }) => (
                <a className="text-amber-600 dark:text-amber-300 hover:underline" {...p} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

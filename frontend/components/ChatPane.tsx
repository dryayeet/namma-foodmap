"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import type { Theme } from "@/lib/theme";

const SUGGESTIONS = [
  "Yelahanka to Indiranagar, what's good on the way?",
  "Best biryani in Bengaluru",
  "Underrated cafes near Koramangala",
  "Overhyped right now?",
];

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hey! I'm **NammaNomNom**, your Bangalore food guide. Ask me things like *\"I'm driving from Yelahanka to Indiranagar, what's good on the way?\"* or *\"underrated coffee in Indiranagar\"*. I'll recommend from real community-loved spots.",
};

export function ChatPane({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasUserMessages = messages.some((m) => m.role === "user");

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
    setOpen(true);

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: clean },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
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

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const reset = () => {
    setMessages([WELCOME]);
    setError(null);
    setOpen(false);
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] w-[min(760px,calc(100vw-32px))]">
      {/* Brand + pill + actions */}
      <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 rounded-full border border-slate-900/10 dark:border-white/[0.09] shadow-[0_10px_36px_rgba(15,23,42,0.14)] dark:shadow-[0_10px_36px_rgba(0,0,0,0.55)] pl-3.5 pr-1.5 py-1.5">
        <span className="inline-flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-900/10 dark:border-white/[0.08]">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 text-[11px] font-bold shadow-[0_0_14px_rgba(250,204,21,0.4)]">
            ✨
          </span>
          <span className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
            NammaNomNom
          </span>
        </span>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about routes, cuisines, dishes…"
          className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 caret-amber-500 dark:caret-amber-400 focus:outline-none"
        />

        {hasUserMessages && !open && (
          <button
            onClick={() => setOpen(true)}
            className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 px-2"
            title="Show conversation"
          >
            History
          </button>
        )}

        {hasUserMessages && (
          <button
            onClick={reset}
            className="hidden sm:block text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 px-2"
            title="Clear conversation"
          >
            Clear
          </button>
        )}

        <button
          onClick={onToggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-white/10 transition"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-full bg-amber-500 dark:bg-amber-400 text-white dark:text-slate-950 font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-400 dark:hover:bg-amber-300 transition flex items-center justify-center shrink-0"
          aria-label="Send"
        >
          →
        </button>
      </div>

      {/* Suggestion chips (only when conversation hasn't started) */}
      {!hasUserMessages && (
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[11px] px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-900/10 dark:border-white/[0.09] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-[0_4px_16px_rgba(15,23,42,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Conversation drawer */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mt-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-900/10 dark:border-white/[0.09] shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900/5 dark:border-white/[0.06]">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                Conversation
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 text-sm w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-900/10 dark:hover:bg-white/10"
                aria-label="Close chat"
                title="Close"
              >
                ✕
              </button>
            </div>
            <div
              ref={scrollRef}
              className="px-4 py-4 space-y-3 max-h-[min(56vh,480px)] overflow-y-auto scrollbar-thin"
            >
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 items-center text-slate-500 dark:text-slate-400 text-xs pl-1"
                >
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse [animation-delay:120ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse [animation-delay:240ms]" />
                  </span>
                  <span>Thinking…</span>
                </motion.div>
              )}
              {error && (
                <div className="text-[11px] text-red-700 dark:text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950 font-medium rounded-br-sm"
            : "bg-slate-100 text-slate-900 border border-slate-900/10 dark:bg-slate-800 dark:text-slate-50 dark:border-white/[0.1] rounded-bl-sm"
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

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

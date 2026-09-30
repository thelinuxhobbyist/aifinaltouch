"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chat";
import type { ActionState } from "@/lib/validation";

const POLL_MS = 5000;

const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" });

type LastRead = { id: string; readAt: number } | null;

export function ChatThread({
  conversationId,
  initialMessages,
  initialLastRead,
  otherName,
  canSend,
  sendAction,
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
  initialLastRead: LastRead;
  otherName: string;
  canSend: boolean;
  sendAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [items, setItems] = useState(initialMessages);
  const [lastRead, setLastRead] = useState(initialLastRead);
  const [state, formAction, pending] = useActionState(sendAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const poll = useCallback(async () => {
    const last = itemsRef.current.at(-1)?.createdAt ?? 0;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?after=${last}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[]; lastRead: LastRead };
      if (data.messages.length > 0) {
        setItems((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
        });
      }
      setLastRead(data.lastRead);
    } catch {
      // Network blips are retried on the next tick.
    }
  }, [conversationId]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void poll();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      void poll();
    }
  }, [state, poll]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [items.length]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-1 overflow-y-auto px-1 py-6" aria-live="polite">
        {items.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">No messages yet. Say hello to {otherName}.</p>
        )}
        {items.map((m, i) => {
          const day = dayFmt.format(m.createdAt);
          const showDay = i === 0 || day !== dayFmt.format(items[i - 1].createdAt);
          return (
            <div key={m.id}>
              {showDay && <p className="py-4 text-center text-xs font-medium text-muted">{day}</p>}
              <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] sm:max-w-[70%]">
                  <div
                    className={`rounded-lg px-3.5 py-2.5 text-[15px] leading-6 whitespace-pre-wrap break-words ${
                      m.removed
                        ? "border border-dashed border-line text-muted italic"
                        : m.mine
                          ? "bg-brand text-white"
                          : "bg-mist text-ink"
                    }`}
                  >
                    {m.removed ? "Message removed by a moderator" : m.body}
                  </div>
                  <p className={`mt-1 text-[11px] text-muted ${m.mine ? "text-right" : ""}`}>
                    {timeFmt.format(m.createdAt)}
                    {m.mine && lastRead?.id === m.id && " · Seen"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {canSend ? (
        <form ref={formRef} action={formAction} className="border-t border-line-soft pt-4">
          <input type="hidden" name="conversationId" value={conversationId} />
          {state.error && (
            <p role="alert" className="mb-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          <div className="flex items-end gap-3">
            <label htmlFor="body" className="sr-only">
              Message
            </label>
            <textarea
              id="body"
              name="body"
              rows={2}
              maxLength={4000}
              required
              placeholder={`Message ${otherName}`}
              className="input mt-0 max-h-48 min-h-[48px] flex-1 resize-y"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            <button type="submit" disabled={pending} className="btn-primary h-12">
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="mt-2 hidden text-xs text-muted sm:block">Enter to send · Shift + Enter for a new line</p>
        </form>
      ) : (
        <p className="border-t border-line-soft pt-4 text-sm text-muted">You can read this conversation but not reply.</p>
      )}
    </div>
  );
}

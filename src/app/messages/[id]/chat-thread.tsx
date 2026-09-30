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
    <div className="chat__thread">
      <div className="chat__messages" aria-live="polite">
        {items.length === 0 && <p className="chat__empty">No messages yet. Say hello to {otherName}.</p>}
        {items.map((m, i) => {
          const day = dayFmt.format(m.createdAt);
          const showDay = i === 0 || day !== dayFmt.format(items[i - 1].createdAt);
          const bubble = m.removed ? "bubble--removed" : m.mine ? "bubble--mine" : "bubble--theirs";
          return (
            <div key={m.id}>
              {showDay && <p className="chat__day">{day}</p>}
              <div className={`msg${m.mine ? " msg--mine" : ""}`}>
                <div className="msg__inner">
                  <div className={`bubble ${bubble}`}>{m.removed ? "Message removed by a moderator" : m.body}</div>
                  <p className="msg__time">
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
        <form ref={formRef} action={formAction} className="composer">
          <input type="hidden" name="conversationId" value={conversationId} />
          {state.error && (
            <p role="alert" className="alert alert--error mb-6">
              {state.error}
            </p>
          )}
          <div className="composer__row">
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
              className="textarea composer__input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            <button type="submit" disabled={pending} className="btn btn--primary composer__send">
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="composer__hint">Enter to send · Shift + Enter for a new line</p>
        </form>
      ) : (
        <p className="composer small muted">You can read this conversation but not reply.</p>
      )}
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import ChengduMap from "@/components/ChengduMap/ChengduMap";
import styles from "./PortfolioAgent.module.css";

type Phase = "map" | "dissolving" | "restoring" | "ready" | "thinking" | "answer";
type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const CONTEXT_STORAGE_KEY = "ender-agent-context";
const MAX_CONTEXT_MESSAGES = 30;

const PIXEL_DELAYS = Array.from({ length: 9 }, (_, index) => {
  const row = Math.floor(index / 3);
  const column = index % 3;
  return (column + Math.abs(row - 1)) * 90;
});

const TRANSITION_PIXELS = Array.from({ length: 144 }, (_, index) => ({
  id: index,
  delay: ((index * 73 + index * index * 17) % 73) * 10,
  exitDelay: ((index * 31 + index * index * 11) % 73) * 5,
}));

function useElapsed() {
  const [deciseconds, setDeciseconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setDeciseconds((value) => value + 1), 100);
    return () => window.clearInterval(timer);
  }, []);

  const total = deciseconds / 10;
  if (total < 60) return `${total.toFixed(1)}s`;
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

function LoadingState() {
  const elapsed = useElapsed();

  return (
    <div className={styles.loadingState} role="status" aria-label={`Thinking for ${elapsed}`}>
      <span aria-hidden className={styles.pixelGrid}>
        {PIXEL_DELAYS.map((delay, index) => (
          <i key={index} style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
      <span className={styles.shimmerLabel} data-text="Thinking">Thinking</span>
      <span className={styles.elapsed}>{elapsed}</span>
    </div>
  );
}

export default function PortfolioAgent() {
  const [phase, setPhase] = useState<Phase>("map");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [hasAsked, setHasAsked] = useState(false);
  const [transitionCovered, setTransitionCovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transitionTimersRef = useRef<number[]>([]);
  const requestVersionRef = useRef(0);
  const restoreAllowedAtRef = useRef(0);
  const conversationRef = useRef<ConversationMessage[]>([]);

  useEffect(() => {
    try {
      const cached = window.sessionStorage.getItem(CONTEXT_STORAGE_KEY);
      if (!cached) return;
      const parsed = JSON.parse(cached) as unknown;
      if (!Array.isArray(parsed)) return;
      conversationRef.current = parsed
        .filter(
          (item): item is ConversationMessage =>
            typeof item === "object" &&
            item !== null &&
            (item as ConversationMessage).role !== undefined &&
            ["user", "assistant"].includes((item as ConversationMessage).role) &&
            typeof (item as ConversationMessage).content === "string",
        )
        .slice(-MAX_CONTEXT_MESSAGES);
    } catch {
      window.sessionStorage.removeItem(CONTEXT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (phase !== "ready") return;
    inputRef.current?.focus();
  }, [phase]);

  useEffect(() => () => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (phase === "map" || phase === "dissolving" || phase === "restoring") return;

    const scrollPositions = new WeakMap<Element, number>();
    let windowScrollPosition = window.scrollY;

    const restoreMap = () => {
      if (Date.now() < restoreAllowedAtRef.current) return;
      requestVersionRef.current += 1;
      transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      setTransitionCovered(false);
      setPhase("restoring");
      transitionTimersRef.current = [
        window.setTimeout(() => setTransitionCovered(true), 980),
        window.setTimeout(() => setPhase("map"), 1620),
      ];
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY > 2) restoreMap();
    };

    const handleScroll = (event: Event) => {
      if (event.target instanceof Element) {
        const current = event.target.scrollTop;
        const previous = scrollPositions.get(event.target) ?? 0;
        scrollPositions.set(event.target, current);
        if (current > previous + 1) restoreMap();
        return;
      }

      const current = window.scrollY;
      if (current > windowScrollPosition + 1) restoreMap();
      windowScrollPosition = current;
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [phase]);

  function enterAgent() {
    if (phase !== "map") return;
    setTransitionCovered(false);
    setPhase("dissolving");
    transitionTimersRef.current = [
      window.setTimeout(() => setTransitionCovered(true), 980),
      window.setTimeout(() => {
        restoreAllowedAtRef.current = Date.now() + 600;
        setPhase("ready");
      }, 1620),
    ];
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = question.trim();
    if (!value || phase === "thinking") return;
    const requestVersion = ++requestVersionRef.current;
    setError("");
    setHasAsked(true);
    setPhase("thinking");
    setQuestion("");
    const context = conversationRef.current.slice(-(MAX_CONTEXT_MESSAGES - 1));

    try {
      const [response] = await Promise.all([
        fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: value, context }),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 750)),
      ]);
      const data = (await response.json()) as { answer?: string; error?: string };
      if (requestVersion !== requestVersionRef.current) return;
      if (!response.ok || !data.answer) throw new Error(data.error ?? "暂时无法回答");
      const newMessages: ConversationMessage[] = [
        { role: "user", content: value },
        { role: "assistant", content: data.answer },
      ];
      conversationRef.current = [
        ...context,
        ...newMessages,
      ].slice(-MAX_CONTEXT_MESSAGES);
      window.sessionStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(conversationRef.current));
      setAnswer(data.answer);
      setPhase("answer");
    } catch (requestError) {
      if (requestVersion !== requestVersionRef.current) return;
      setError(requestError instanceof Error ? requestError.message : "连接中断，请稍后再试");
      setPhase("ready");
    }
  }

  const mapVisible =
    phase === "map" ||
    (phase === "dissolving" && !transitionCovered) ||
    (phase === "restoring" && transitionCovered);

  return (
    <section className={`${styles.stage} ${styles[phase]}`} aria-label="Ask Ender">
      {mapVisible && (
        <div
          className={styles.mapEntry}
          role="button"
          tabIndex={0}
          onMouseEnter={enterAgent}
          onFocus={enterAgent}
          onTouchStart={enterAgent}
          aria-label="Ask Ender anything"
        >
          <ChengduMap />
        </div>
      )}

      {(phase === "dissolving" || phase === "restoring") && (
        <div className={`${styles.pixelTransition} ${phase === "restoring" ? styles.pixelTransitionDark : ""}`} aria-hidden="true">
          {TRANSITION_PIXELS.map((pixel) => (
            <i key={pixel.id} style={{
              "--pixel-delay": `${pixel.delay}ms`,
              "--pixel-exit-delay": `${pixel.exitDelay}ms`,
            } as React.CSSProperties} />
          ))}
        </div>
      )}

      {!mapVisible && (
        <div className={styles.whiteboard}>
          <div className={`${styles.workspace} ${answer ? styles.hasResponse : ""}`}>
            <div className={styles.responseArea} aria-live="polite">
              {answer && (
                <div className={`${styles.answer} ${phase === "thinking" ? styles.answerExit : styles.answerEnter}`}>
                  <p>{answer}</p>
                </div>
              )}
            </div>
            {phase === "thinking" && <LoadingState />}
            <form className={styles.askForm} onSubmit={submit}>
              {!hasAsked && <label htmlFor="ender-question">What would you like to know?</label>}
              <textarea
                id="ender-question"
                aria-label="Ask Ender a question"
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={2}
                maxLength={500}
                aria-describedby="agent-hint"
              />
              <div className={styles.inputRule} />
              <div className={styles.formBottom}>
                <em id="agent-hint">Ask me anything you&apos;re curious about</em>
                <button type="submit" disabled={!question.trim() || phase === "thinking"} aria-label="Send question">↗</button>
              </div>
              {error && <p className={styles.error}>{error}</p>}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

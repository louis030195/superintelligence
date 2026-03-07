"use client";

import { useEffect, useState } from "react";

const LINES = [
  { prompt: true, text: "bb apps", delay: 0 },
  { prompt: false, text: '  Chrome, Arc, Slack, VS Code, Figma', delay: 400 },
  { prompt: true, text: 'bb click "New Tab" --app Arc', delay: 1200 },
  { prompt: false, text: '  {"clicked": "New Tab", "role": "button"}', delay: 600 },
  { prompt: true, text: 'bb type "github.com/louis030195/bigbrother"', delay: 1400 },
  { prompt: false, text: '  {"typed": "github.com/louis030195/bigbrother"}', delay: 500 },
  { prompt: true, text: "bb web launch --browser arc --headless", delay: 1600 },
  { prompt: false, text: '  injected 5048/5068 cookies, 20 skipped', delay: 800 },
  { prompt: false, text: '  {"profile": "arc/Default", "url": "about:blank"}', delay: 400 },
  { prompt: true, text: "bb record --name login-flow", delay: 1800 },
  { prompt: false, text: "  Recording... 42 events (Ctrl+C to stop)", delay: 600 },
  { prompt: true, text: "bb screenshot", delay: 1400 },
  { prompt: false, text: '  {"path": "screenshot.png"}', delay: 400 },
];

export default function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    let totalDelay = 800;
    const timers: NodeJS.Timeout[] = [];

    for (let i = 0; i < LINES.length; i++) {
      totalDelay += LINES[i].delay;
      const timer = setTimeout(() => {
        setVisibleLines(i + 1);
      }, totalDelay);
      timers.push(timer);
    }

    // Loop
    const loopTimer = setTimeout(() => {
      setVisibleLines(0);
      // Restart after reset
      setTimeout(() => {
        setVisibleLines(0);
      }, 500);
    }, totalDelay + 3000);
    timers.push(loopTimer);

    return () => timers.forEach(clearTimeout);
  }, [visibleLines === 0 ? Date.now() : 0]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "1.25rem",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.8rem",
        lineHeight: 1.8,
        color: "#ccc",
        overflow: "hidden",
      }}
    >
      {/* Title bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1rem" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ marginLeft: 8, fontSize: "0.7rem", color: "#666" }}>bbctl</span>
      </div>

      {LINES.slice(0, visibleLines).map((line, i) => (
        <div key={i} style={{ whiteSpace: "pre" }}>
          {line.prompt ? (
            <>
              <span style={{ color: "#43637d" }}>$ </span>
              <span style={{ color: "#faf8f3" }}>{line.text}</span>
            </>
          ) : (
            <span style={{ color: "#92897b" }}>{line.text}</span>
          )}
        </div>
      ))}

      {/* Blinking cursor */}
      {visibleLines > 0 && visibleLines < LINES.length && (
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 16,
            background: "#43637d",
            animation: "blink 1s step-end infinite",
            verticalAlign: "text-bottom",
          }}
        />
      )}

      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

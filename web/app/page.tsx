"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Terminal, Globe, Monitor, Cpu, Eye, Lock } from "lucide-react";
import TerminalDemo from "./components/TerminalDemo";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: React.CSSProperties = {
  maxWidth: "76rem",
  margin: "0 auto",
  padding: "0 1.5rem",
};

/* ────────────────────────── NAV ────────────────────────── */

function Nav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        background: "rgba(250,248,243,0.95)",
        backdropFilter: "blur(8px)",
        zIndex: 50,
        borderBottom: "2px solid #000",
      }}
    >
      <div style={{ ...container, display: "flex", justifyContent: "space-between", alignItems: "center", height: "3.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 28,
              height: 28,
              border: "2px solid #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            bb
          </div>
          <span style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
            BBCTL
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {["Features", "Install", "Docs"].map((l) => (
            <a
              key={l}
              href={l === "Docs" ? "https://github.com/louis030195/bigbrother" : `#${l.toLowerCase()}`}
              style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgba(0,0,0,0.55)", textDecoration: "none" }}
            >
              {l}
            </a>
          ))}
          <a
            href="https://github.com/louis030195/bigbrother"
            style={{
              border: "2px solid #000",
              padding: "0.375rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              fontFamily: "'IBM Plex Mono', monospace",
              background: "transparent",
              cursor: "pointer",
              textDecoration: "none",
              color: "#000",
            }}
          >
            GITHUB
          </a>
        </div>
      </div>
    </nav>
  );
}

/* ────────────────────────── HERO ────────────────────────── */

function Hero() {
  return (
    <section style={{ paddingTop: "7rem", paddingBottom: "4rem" }}>
      <div style={container}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                alignItems: "center",
                border: "2px solid #43637d",
                padding: "0.25rem 0.75rem",
                fontSize: "0.7rem",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.08em",
                color: "#43637d",
              }}
            >
              $ DESKTOP + BROWSER AUTOMATION
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease }}
              style={{ fontSize: "4.5rem", fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.02em" }}
            >
              AUTOMATE
              <br />
              <span style={{ fontStyle: "italic", color: "#43637d" }}>EVERYTHING.</span>
              <br />
              <span style={{ fontSize: "2rem", fontWeight: 500, color: "#92897b" }}>
                ONE CLI. EVERY PLATFORM.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              style={{ fontSize: "1rem", color: "#756d65", lineHeight: 1.7, maxWidth: "28rem" }}
            >
              Record and replay desktop workflows. Click, type, scroll through
              accessibility APIs. Launch browsers with your real cookies.
              Built for AI agents that need to act in the real world.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.6, ease }}
              style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
            >
              <div
                id="install"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#000",
                  color: "#faf8f3",
                  fontSize: "1rem",
                  padding: "0.75rem 2rem",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigator.clipboard.writeText("bunx bbctl --help");
                }}
              >
                $ bunx bbctl --help
                <span style={{ marginLeft: 12, fontSize: "0.75rem", color: "#92897b" }}>click to copy</span>
              </div>
              <a
                href="https://github.com/louis030195/bigbrother"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "2px solid #43637d",
                  color: "#43637d",
                  fontSize: "1rem",
                  padding: "0.75rem 2rem",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 500,
                  background: "transparent",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                VIEW SOURCE
                <ArrowRight style={{ marginLeft: 8, width: 20, height: 20 }} />
              </a>
            </motion.div>
          </div>

          {/* Right — Terminal demo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 1, ease }}
            style={{ position: "relative" }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "4/3",
                border: "3px solid #000",
                background: "#0a0a0a",
                boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)",
                overflow: "hidden",
              }}
            >
              <TerminalDemo />
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -12,
                left: -12,
                background: "#faf8f3",
                border: "2px solid #000",
                padding: "0.375rem 0.75rem",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
              }}
            >
              $ macOS + Windows + Linux
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ──────────────── GEOMETRIC DIVIDER ──────────────── */

function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem 2rem",
        maxWidth: "64rem",
        margin: "0 auto",
      }}
    >
      <div style={{ flex: 1, height: 1, background: "#cfc9bd" }} />
      <div
        style={{
          margin: "0 1rem",
          width: 12,
          height: 12,
          border: "2px solid #cfc9bd",
          transform: "rotate(45deg)",
        }}
      />
      <div style={{ flex: 1, height: 1, background: "#cfc9bd" }} />
    </div>
  );
}

/* ────────────────────── CAPABILITIES ────────────────────── */

const CAPABILITIES = [
  {
    num: "01",
    title: "DESKTOP AUTOMATION",
    icon: <Monitor size={24} />,
    description:
      "Click, type, scroll, find elements via accessibility APIs. No pixel matching, no fragile coordinates. Works across apps.",
    detail: "click . type . scroll . find . activate",
  },
  {
    num: "02",
    title: "BROWSER WITH REAL AUTH",
    icon: <Globe size={24} />,
    description:
      "Launch Playwright with cookies stolen from your real Chrome, Arc, or Brave. No login flows. Background or visible.",
    detail: "cookies . sessions . stealth . headless",
  },
  {
    num: "03",
    title: "WORKFLOW RECORDING",
    icon: <Eye size={24} />,
    description:
      "Record everything you do \u2014 clicks, keystrokes, app switches. Replay it perfectly. Build automation from real behavior.",
    detail: "record . replay . export . iterate",
  },
];

function Capabilities() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      id="features"
      style={{ padding: "5rem 0", borderTop: "2px solid #000" }}
    >
      <div style={container}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
          <h2 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
            CAPABILITIES
          </h2>
          <div style={{ width: 64, height: 2, background: "#000", margin: "0 auto" }} />
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {CAPABILITIES.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              style={{
                border: "2px solid #000",
                background: "#fff",
                padding: "1.5rem",
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                {step.icon}
                <div>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: "#92897b",
                      letterSpacing: "0.1em",
                      display: "block",
                    }}
                  >
                    {step.num}
                  </span>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {step.title}
                  </h3>
                </div>
              </div>
              <p style={{ fontSize: "0.875rem", color: "#756d65", lineHeight: 1.6, marginBottom: "1rem" }}>
                {step.description}
              </p>
              <span
                style={{
                  fontSize: "0.625rem",
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "#92897b",
                  fontStyle: "italic",
                  letterSpacing: "0.05em",
                }}
              >
                {step.detail}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── COMMANDS ────────────────────── */

const COMMANDS = [
  { cmd: "bb apps", desc: "List running applications" },
  { cmd: "bb click \"Submit\"", desc: "Click elements by name" },
  { cmd: "bb type \"hello world\"", desc: "Type text anywhere" },
  { cmd: "bb tree --app Chrome", desc: "Accessibility tree" },
  { cmd: "bb record", desc: "Record workflow" },
  { cmd: "bb replay workflow.json", desc: "Replay it perfectly" },
  { cmd: "bb web launch --browser arc", desc: "Browser with real auth" },
  { cmd: "bb web cookies --domain github.com", desc: "Extract cookies" },
  { cmd: "bb screenshot", desc: "Capture screen" },
  { cmd: "bb scrape --app Safari", desc: "Extract all text" },
];

function Commands() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} style={{ padding: "5rem 0", background: "#000", color: "#faf8f3" }}>
      <div style={container}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
          <h2 style={{ fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>
            EVERY COMMAND YOU NEED
          </h2>
          <div style={{ width: 64, height: 2, background: "#faf8f3", margin: "0 auto" }} />
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: "rgba(255,255,255,0.1)" }}>
          {COMMANDS.map((c, i) => (
            <motion.div
              key={c.cmd}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              style={{
                background: "#000",
                padding: "1.25rem 2rem",
                borderLeft: "2px solid rgba(67,99,125,0.3)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <code
                style={{
                  fontSize: "0.875rem",
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "#43637d",
                }}
              >
                $ {c.cmd}
              </code>
              <span style={{ fontSize: "0.75rem", color: "#92897b" }}>
                {c.desc}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── CTA ────────────────────── */

function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} style={{ padding: "5rem 0", borderTop: "2px solid #000" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        style={{ ...container, textAlign: "center", maxWidth: "48rem" }}
      >
        <h2 style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
          START AUTOMATING
        </h2>
        <p style={{ color: "#756d65", marginBottom: "2.5rem" }}>
          One command. All platforms. Real browser auth. No setup friction.
        </p>

        <div
          style={{
            background: "#000",
            color: "#faf8f3",
            fontSize: "1.25rem",
            padding: "1rem 3rem",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => {
            navigator.clipboard.writeText("bunx bbctl --help");
          }}
        >
          $ bunx bbctl
          <Terminal style={{ marginLeft: 12, width: 20, height: 20 }} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2rem",
            marginTop: "1.5rem",
            fontSize: "0.75rem",
            fontFamily: "'IBM Plex Mono', monospace",
            color: "#92897b",
          }}
        >
          <span>$ OPEN SOURCE</span>
          <span>$ CROSS-PLATFORM</span>
          <span>$ RUST + TYPESCRIPT</span>
        </div>
      </motion.div>
    </section>
  );
}

/* ────────────────────── FOOTER ────────────────────── */

function Footer() {
  return (
    <footer style={{ borderTop: "2px solid #000", padding: "2rem 0" }}>
      <div
        style={{
          ...container,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 20,
              height: 20,
              border: "2px solid #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.5rem",
              fontWeight: 700,
            }}
          >
            bb
          </div>
          <span style={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: "0.875rem" }}>BBCTL</span>
        </div>
        <span style={{ fontSize: "0.75rem", fontFamily: "'IBM Plex Mono', monospace", color: "#92897b" }}>
          a CLI to print dollars while you sleep
        </span>
      </div>
    </footer>
  );
}

/* ────────────────────── PAGE ────────────────────── */

export default function Home() {
  return (
    <main style={{ background: "#faf8f3", color: "#000", minHeight: "100vh" }}>
      <Nav />
      <Hero />
      <Divider />
      <Capabilities />
      <Commands />
      <CTA />
      <Footer />
    </main>
  );
}

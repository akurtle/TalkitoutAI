import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { DEMO_NOTICE_LEAD, DEMO_NOTICE_TAIL, REPO_URL } from "../../lib/repo";
import { Pleading } from "../ui/primitives";

export function DemoBanner() {
  return (
    <div role="note" className="border-b border-hair bg-paper">
      <p className="mx-auto max-w-[1240px] px-4 py-2 font-mono text-[12.5px] italic leading-5 text-ink-2 sm:px-6">
        ({DEMO_NOTICE_LEAD}{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="text-blue underline decoration-blue/40 hover:decoration-blue">
          {DEMO_NOTICE_TAIL}
        </a>
        )
      </p>
    </div>
  );
}

const NAV = [
  { href: "#demo", label: "Interview", short: "Interview" },
  { href: "#architecture", label: "Architecture", short: "System" },
  { href: "#deep-dive", label: "Engineering notes", short: "Notes" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-paper/95 backdrop-blur-sm transition-[border-color] ${scrolled ? "border-b border-ink" : "border-b border-transparent"}`}>
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-baseline gap-3">
          <span className="text-[17px] font-[800] tracking-[-0.02em] sm:wide">TalkitoutAI</span>
          <span className="hidden text-[13px] text-ink-3 md:inline">Transcript of the system</span>
        </a>
        <nav aria-label="Sections" className="flex items-center gap-3 text-[13.5px] sm:gap-6 sm:text-[14px]">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-ink-2 underline decoration-transparent underline-offset-[6px] hover:text-ink hover:decoration-ink">
              <span className="hidden sm:inline">{n.label}</span>
              <span className="sm:hidden">{n.short}</span>
            </a>
          ))}
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-blue">
            Source <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </nav>
      </div>
    </header>
  );
}

const APPEARANCES = [
  { party: "For the browser", items: "React 19 and Vite, Web Audio PCM capture, FaceDetector sampling, client-side scoring" },
  { party: "For the server", items: "FastAPI REST endpoints, the WS /asr stream, Pydantic contracts" },
  { party: "For AI and parsing", items: "WhisperLiveKit on faster-whisper, spaCy NER, Gemini when a key is set" },
  { party: "For external services", items: "Supabase Auth with OAuth, Postgres under RLS, private storage" },
];

const EXAMINATION: { speaker: "Q" | "A"; text: string }[] = [
  { speaker: "Q", text: "What does it do?" },
  {
    speaker: "A",
    text: "It listens while you speak, streams your audio to a Whisper model over a WebSocket, and coaches you before you have finished the answer.",
  },
  { speaker: "Q", text: "How was this record made?" },
  {
    speaker: "A",
    text: "From the code. Components, endpoints, payload shapes and excerpts are taken from the repository. Execution, transcripts, scores and timing are simulated.",
  },
  { speaker: "Q", text: "Where should I start?" },
];

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-h" className="mx-auto max-w-[1240px] px-4 pt-8 sm:px-6 md:pt-12">
      <Pleading className="border border-hair">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 px-5 pb-10 pt-[34px] sm:pl-0 sm:pr-10">
            <motion.h1
              id="hero-h"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="wide text-[2.55rem] font-[850] leading-[0.92] tracking-[-0.04em] sm:text-[4.75rem] lg:text-[6rem]"
            >
              <span className="mb-1 block text-[18px] font-normal leading-7 tracking-normal text-ink-2 sm:text-[20px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                In the matter of
              </span>
              TalkitoutAI
            </motion.h1>

            {/* Legal caption: two parties divided by the caption rule */}
            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] gap-x-4 border-y border-ink py-[14px] text-[15px] leading-[28px] sm:gap-x-6">
              <p>
                A real-time speaking coach,
                <br />
                <span className="text-ink-2">built with React, FastAPI and Whisper.</span>
              </p>
              <span aria-hidden className="w-px self-stretch bg-ink" />
              <p>
                Case study.
                <br />
                <span className="text-ink-2">The system, transcribed from source.</span>
              </p>
            </div>

            <div data-grid className="mt-8 max-w-[64ch] font-mono text-[15px] leading-[28px] sm:text-[16px]">
              {EXAMINATION.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.22, duration: 0.25 }}
                  className="grid grid-cols-[2.25rem_1fr]"
                >
                  <span className="font-bold">{line.speaker}.</span>
                  <span className={line.speaker === "A" ? "text-ink-2" : ""}>{line.text}</span>
                </motion.p>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + EXAMINATION.length * 0.22, duration: 0.25 }}
                className="grid grid-cols-[2.25rem_1fr]"
              >
                <span className="font-bold">A.</span>
                <span className="flex flex-wrap gap-3 pt-1 font-sans">
                  <a href="#demo" className="inline-flex min-h-10 items-center gap-2 bg-ink px-4 text-[14px] font-semibold text-sheet hover:bg-ink-2">
                    Run the mock interview <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                  <a href="#architecture" className="inline-flex min-h-10 items-center gap-2 border border-ink px-4 text-[14px] font-semibold hover:bg-desk">
                    Examine the architecture
                  </a>
                </span>
              </motion.div>
            </div>
          </div>

          <aside aria-labelledby="appearances-h" className="border-t border-hair px-5 py-[28px] sm:pl-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pr-8">
            <h2 id="appearances-h" className="text-[14px] font-semibold text-ink-2">
              Appearances
            </h2>
            <dl className="mt-3 divide-y divide-hair">
              {APPEARANCES.map((a) => (
                <div key={a.party} className="py-[14px]">
                  <dt className="text-[14px] font-semibold">{a.party}</dt>
                  <dd className="mt-1 text-[14px] leading-[21px] text-ink-2">{a.items}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-ink pt-[14px] text-[13px] leading-[21px] text-ink-2">
              <span className="font-semibold text-ink">Stipulated:</span> what is drawn below exists in the code. What runs below is
              acted out.
            </p>
          </aside>
        </div>
      </Pleading>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-[1240px] px-4 pb-16 sm:px-6">
      <div className="border-t-[3px] border-ink pt-6">
        <div className="grid gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-[62ch]">
            <h2 className="text-[14px] font-semibold text-ink-2">Reporter’s certificate</h2>
            <p className="mt-2 text-[16px] leading-[28px]">
              The architecture in this record was transcribed from the source of akurtle/TalkitoutAI. Every execution shown is a
              simulation: no request leaves this page, and no microphone or camera is opened.
            </p>
            <p className="mt-3 font-mono text-[12.5px] italic text-ink-3">
              ({DEMO_NOTICE_LEAD} {DEMO_NOTICE_TAIL})
            </p>
          </div>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 self-end font-mono text-[14px] text-blue underline decoration-blue/40 hover:decoration-blue">
            github.com/akurtle/TalkitoutAI <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}

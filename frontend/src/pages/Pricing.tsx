import { Link } from "react-router-dom";
import Footer from "../components/Layout/Footer";
import Navbar from "../components/Layout/Navbar";

type Plan = {
  name: string;
  audience: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  to: string;
  accentClass: string;
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    audience: "Try it out",
    price: "$0",
    cadence: "forever",
    description: "Basic speaking reps for users who want to test the product first.",
    features: [
      "Free Talk mode",
      "Basic speech signals",
      "Limited monthly sessions",
      "Simple post-session takeaways",
    ],
    cta: "Start free",
    to: "/interview-type",
    accentClass: "mode-card-talk",
  },
  {
    name: "Basic",
    audience: "Light practice",
    price: "$9",
    cadence: "per month",
    description: "A simple paid tier for regular speaking practice and early interview prep.",
    features: [
      "More monthly sessions",
      "Free Talk and Interview Prep",
      "Saved session history",
      "Clearer speech feedback",
    ],
    cta: "Choose Basic",
    to: "/interview-type",
    accentClass: "mode-card-interview",
  },
  {
    name: "Pro",
    audience: "Serious prep",
    price: "$19",
    cadence: "per month",
    description: "The main plan for job seekers preparing with structure and deeper feedback.",
    features: [
      "Resume-based questions",
      "Interview and Pitch modes",
      "Detailed answer feedback",
      "Progress tracking over time",
    ],
    cta: "Choose Pro",
    to: "/interview-type",
    accentClass: "mode-card-pitch",
    highlighted: true,
  },
  {
    name: "Coach",
    audience: "Coaches and cohorts",
    price: "$49",
    cadence: "per month",
    description: "A higher tier for coaches, bootcamps, or small groups supporting multiple users.",
    features: [
      "Shared practice templates",
      "Multiple user seats",
      "Cohort progress review",
      "Priority support",
    ],
    cta: "Choose Coach",
    to: "/auth",
    accentClass: "mode-card-interview",
  },
];

function Pricing() {
  return (
    <div className="theme-page-shell min-h-screen">
      <Navbar />

      <main className="relative overflow-hidden px-6 pb-20 pt-24">
        <div className="absolute inset-0 z-0">
          <div className="theme-glow-primary absolute left-[18%] top-20 h-[420px] w-[520px] rounded-full blur-3xl" />
          <div className="theme-glow-secondary absolute right-[8%] top-[420px] h-[360px] w-[460px] rounded-full blur-3xl" />
          <div className="theme-grid-overlay absolute inset-0 opacity-55" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1120px]">
          <Link
            to="/"
            className="theme-ghost-link mb-10 inline-flex items-center gap-2 text-sm transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M15 19 8 12l7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
            Back
          </Link>

          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl">
              <span className="pill">
                <span className="pill-dot" />
                Pricing
              </span>
              <h1 className="hero-heading theme-text-primary mt-6 max-w-4xl">
                Plans for practicing
                <br />
                <span className="hero-serif theme-accent-text">when it matters.</span>
              </h1>
              <p className="theme-text-secondary mt-7 max-w-[620px] text-[18px] font-light leading-[1.65]">
                Keep the split easy to understand: Free for trial reps, then Basic, Pro, and Coach
                as users need more sessions, deeper feedback, or group support.
              </p>
            </div>

            <div className="theme-panel-soft rounded-2xl p-5">
              <p className="theme-text-primary text-sm font-semibold">Simple structure</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="theme-text-primary text-2xl font-bold">Basic</p>
                  <p className="theme-text-dim mt-1 text-xs">$9/month</p>
                </div>
                <div className="border-x border-[var(--border)] px-3">
                  <p className="theme-accent-text text-2xl font-bold">Pro</p>
                  <p className="theme-text-dim mt-1 text-xs">$19/month</p>
                </div>
                <div>
                  <p className="theme-text-primary text-2xl font-bold">Coach</p>
                  <p className="theme-text-dim mt-1 text-xs">$49/month</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`mode-card ${plan.accentClass} theme-card-hover relative flex min-h-[520px] flex-col rounded-[20px] p-6 transition ${
                  plan.highlighted ? "border-[var(--accent-border-strong)]" : ""
                }`}
              >
                {plan.highlighted && (
                  <span className="theme-chip absolute right-5 top-5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                    Popular
                  </span>
                )}

                <p className="theme-text-dim text-sm font-semibold uppercase tracking-[0.08em]">
                  {plan.audience}
                </p>
                <h2 className="mode-card-title theme-text-primary mt-4 text-[28px] font-semibold transition">
                  {plan.name}
                </h2>
                <p className="theme-text-secondary mt-3 min-h-[68px] text-sm leading-[1.65]">
                  {plan.description}
                </p>

                <div className="mt-7 flex items-end gap-2">
                  <span className="theme-text-primary text-[42px] font-bold leading-none">
                    {plan.price}
                  </span>
                  <span className="theme-text-dim pb-1 text-sm">{plan.cadence}</span>
                </div>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm leading-[1.5]">
                      <span className="theme-icon-badge mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="m5 13 4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                          />
                        </svg>
                      </span>
                      <span className="theme-text-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.to}
                  className={`mt-auto inline-flex justify-center rounded-xl px-5 py-3 text-sm font-bold ${
                    plan.highlighted ? "cta-primary" : "cta-outline"
                  }`}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </section>

          <section className="mt-16 rounded-[20px] border border-[var(--accent-mid)] bg-[linear-gradient(135deg,var(--accent-dim),var(--bg2))] px-6 py-10 shadow-[0_22px_60px_oklch(0.03_0.02_220_/_0.28)] sm:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="section-heading theme-text-primary">Recommended split</h2>
                <p className="theme-text-secondary mt-4 text-sm leading-[1.65]">
                  Free should prove the value. Basic adds more reps, Pro adds the serious interview
                  tools, and Coach gives groups a reason to pay more without making the individual
                  plans harder to understand.
                </p>
              </div>
              <Link
                to="/interview-type"
                className="cta-primary inline-flex shrink-0 justify-center rounded-xl px-[34px] py-[15px] text-[15px] font-bold"
              >
                Start talking free -&gt;
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Pricing;

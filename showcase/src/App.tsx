import { useRef } from "react";
import type { FlowId } from "./lib/types";
import { DemoBanner, Footer, Header, Hero } from "./components/layout/Shell";
import { SectionHeading } from "./components/ui/primitives";
import { InterviewSimulation } from "./components/simulation/InterviewSimulation";
import { ArchitectureExplorer, type ExplorerHandle } from "./components/architecture/ArchitectureExplorer";
import { DeepDive } from "./components/deepdive/DeepDive";

export default function App() {
  const explorer = useRef<ExplorerHandle>(null);

  const scrollToArchitecture = () => {
    document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exploreFlow = (flow: FlowId) => {
    explorer.current?.focusFlow(flow, true);
    scrollToArchitecture();
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-sheet"
      >
        Skip to content
      </a>
      <DemoBanner />
      <Header />
      <main id="main">
        <Hero />

        <section aria-labelledby="demo-h" className="mx-auto max-w-[1240px] scroll-mt-16 px-4 pt-24 sm:px-6 md:pt-32" id="demo">
          <SectionHeading id="demo-h" title="Examination of a candidate" aside="Simulated, from local JSON">
            Choose a role and practice type, then watch a sample answer arrive the way a live transcript would. Feedback follows.
            Along the way, links jump to the request path that does this in the real system.
          </SectionHeading>
          <InterviewSimulation onExploreFlow={exploreFlow} />
        </section>

        <section aria-labelledby="arch-h" className="mx-auto max-w-[1240px] scroll-mt-16 px-4 pt-24 sm:px-6 md:pt-32" id="architecture">
          <SectionHeading id="arch-h" title="Exhibit A: the system as built" aside="Every part maps to a file">
            Filter by flow, open any component or connection for its protocol and source, or play a request through the system hop
            by hop with a representative payload at each step.
          </SectionHeading>
          <ArchitectureExplorer ref={explorer} />
        </section>

        <section aria-labelledby="dd-h" className="mx-auto max-w-[1240px] scroll-mt-16 px-4 pb-24 pt-24 sm:px-6 md:pb-32 md:pt-32" id="deep-dive">
          <SectionHeading id="dd-h" title="Findings of fact" aside="Written for recruiters and engineers">
            What is implemented and what is not, the API surface, excerpts from the code, and the reasoning behind the main design
            decisions, including the rough edges.
          </SectionHeading>
          <DeepDive onOpenArchitecture={scrollToArchitecture} />
        </section>
      </main>
      <Footer />
    </>
  );
}

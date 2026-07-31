import Link from "next/link";
import Header from "./components/Header";
import Tilt from "./components/Tilt";
import { IconArrowRight, IconCash, IconCheck, IconGlobe, IconSchool } from "../lib/icons";

export default function HomePage() {
  return (
    <>
      <Header active="home" />

      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div className="hero-eyebrow fade-up">Introducing Gatekeeper</div>
        <h1 className="fade-up fade-up-1">Know exactly where your visa application stands.</h1>
        <p className="lead fade-up fade-up-2">
          Gatekeeper is AbroBot.ai's readiness engine for study-abroad applicants. It reads the same
          published, citable visa criteria that officers use, checks your profile against them, and
          hands back a clear checklist — what's solid, what's weak, and exactly how to fix it. Never a
          prediction. Never a verdict. Just the facts and a plan.
        </p>
        <div className="hero-ctas fade-up fade-up-3">
          <Link href="/apply" className="btn-primary" style={{ textDecoration: "none" }}>
            Check my readiness <IconArrowRight size={16} color="#fff" />
          </Link>
          <Link href="/signup" className="btn-secondary" style={{ textDecoration: "none" }}>
            Create free account
          </Link>
        </div>
      </section>

      {/* ---------- What we do ---------- */}
      <section className="section" id="what-we-do">
        <div className="section-heading">
          <p className="kicker">What we do</p>
          <h2>Built for the academics & study-abroad field</h2>
          <p>
            Every year, applicants get refused for reasons that were knowable in advance — funds that
            weren't seasoned long enough, a course that doesn't connect to their background, a gap in
            their timeline nobody explained. Gatekeeper exists to surface those issues before an
            officer does.
          </p>
        </div>

        <div className="grid-3">
          <Tilt>
            <div className="feature-card">
              <div className="feature-icon">
                <IconGlobe size={20} color="#fff" />
              </div>
              <h3>Real, cited criteria</h3>
              <p>
                Our rules are drawn from official sources for each destination — US F-1, UK Student
                visa, and Canada Study Permit — with every flag linked back to the rule that produced it.
              </p>
            </div>
          </Tilt>
          <Tilt>
            <div className="feature-card">
              <div className="feature-icon">
                <IconCash size={20} color="#fff" />
              </div>
              <h3>Funding sufficiency, done right</h3>
              <p>
                We check liquid funds against real cost-of-study and cost-of-living data for your
                destination, including how long the money has been held — not just a single number.
              </p>
            </div>
          </Tilt>
          <Tilt>
            <div className="feature-card">
              <div className="feature-icon">
                <IconSchool size={20} color="#fff" />
              </div>
              <h3>Academic coherence checks</h3>
              <p>
                We look at how your prior studies, career, and intended course connect — the same
                "why this, why now" story an officer is trained to question.
              </p>
            </div>
          </Tilt>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section" id="how-it-works">
        <div className="section-heading">
          <p className="kicker">How it works</p>
          <h2>Four steps, a few minutes</h2>
          <p>No documents to upload up front — just the details that matter, and a report at the end.</p>
        </div>

        <div className="grid-2">
          <Tilt maxTilt={6}>
            <div className="feature-card">
              <div className="step-num">1</div>
              <h3>Tell us your destination & funding</h3>
              <p>Pick your target country and share what you can show financially.</p>
            </div>
          </Tilt>
          <Tilt maxTilt={6}>
            <div className="feature-card">
              <div className="step-num">2</div>
              <h3>Add your academics & course</h3>
              <p>Your background, any gaps, and the course you intend to study.</p>
            </div>
          </Tilt>
          <Tilt maxTilt={6}>
            <div className="feature-card">
              <div className="step-num">3</div>
              <h3>Share your history & ties</h3>
              <p>Prior refusals and your ties to home — both commonly scrutinised.</p>
            </div>
          </Tilt>
          <Tilt maxTilt={6}>
            <div className="feature-card">
              <div className="step-num">4</div>
              <h3>Get your readiness report</h3>
              <p>Every flag comes with the official rule, the severity, and a concrete fix.</p>
            </div>
          </Tilt>
        </div>
      </section>

      {/* ---------- Trust band ---------- */}
      <section className="section">
        <div className="trust-band">
          <h2>We will never tell you the odds of getting a visa.</h2>
          <p>
            No one can honestly predict a consular officer's decision, and any tool that claims to is
            selling you a guess. Gatekeeper only ever tells you what's verifiable: which official
            criteria your profile meets, which it doesn't yet, and what to do about it.
          </p>
          <div style={{ display: "flex", gap: 24, marginTop: 26, flexWrap: "wrap" }}>
            {[
              "Source-linked flags",
              "No outcome predictions",
              "Same criteria officers use",
            ].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                <IconCheck size={16} color="#8fd8ff" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="section" style={{ textAlign: "center", paddingTop: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 10px" }}>Ready to see where you stand?</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 26 }}>
          It takes a few minutes and costs nothing to find out.
        </p>
        <Link href="/apply" className="btn-primary" style={{ textDecoration: "none" }}>
          Check my readiness <IconArrowRight size={16} color="#fff" />
        </Link>
      </section>

      <footer className="site-footer">
        Gatekeeper by AbroBot.ai — a preparation checklist, never a prediction.
      </footer>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitIntake } from "../../lib/api";
import { IconArrowLeft, IconArrowRight, IconCash, IconCheck, IconGlobe, IconSchool, IconSpinner } from "../../lib/icons";
import Header from "../components/Header";

const STEPS = ["Destination", "Funding", "Academics", "Ties & history"];

const checkboxRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13 };

// Common courses/majors. "Other" reveals a free-text field so applicants
// can type anything not on the list.
const COMMON_COURSES = [
  "Computer Science",
  "Data Science / Analytics",
  "Artificial Intelligence & Machine Learning",
  "Business Administration (MBA)",
  "Finance",
  "Economics",
  "Mechanical Engineering",
  "Electrical / Electronics Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Public Health",
  "Nursing",
  "Medicine",
  "Law (LLM)",
  "Psychology",
  "International Relations",
  "Architecture",
  "Marketing",
  "Hospitality & Tourism Management",
  "Environmental Science",
  "Journalism & Media Studies",
];

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="field-hint">{children}</p>;
}

export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseIsOther, setCourseIsOther] = useState(false);

  const [form, setForm] = useState({
    destination_country: "country-a",
    consent_given: false,
    funding: { liquid_funds_usd: 0, sponsor_type: "self", funds_seasoning_days: 0 },
    academic: {
      highest_qualification: "",
      gpa_percentage: 0,
      education_gap_months: 0,
      gap_explanation_provided: false,
    },
    course: {
      intended_course: "",
      prior_field_of_study: "",
      prior_field_matches_intended: false,
      coherence_explanation_provided: false,
    },
    immigration: { prior_visa_refusals: 0, refusal_countries: [] as string[] },
    english: { test_type: "none", score: null as number | null, exempt: false },
    sponsor: { relationship_to_applicant: null as string | null, relationship_proof_provided: false },
    ties: { employment_status: "employed", property_ownership: false, family_ties_explanation_provided: false },
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const countries = [
    { value: "country-a", label: "United States", sub: "F-1 student visa" },
    { value: "country-b", label: "United Kingdom", sub: "Student visa" },
    { value: "country-c", label: "Canada", sub: "Study permit" },
  ];

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleCourseSelect(value: string) {
    if (value === "__other__") {
      setCourseIsOther(true);
      update("course", { ...form.course, intended_course: "" });
    } else {
      setCourseIsOther(false);
      update("course", { ...form.course, intended_course: value });
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!form.consent_given) {
      setError("Please give consent before generating your report.");
      return;
    }
    setSubmitting(true);
    try {
      const report = await submitIntake(form);
      router.push(`/report/${report.report_id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header active="readiness" />
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 60px" }}>
        <p
          className="fade-up"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--brand)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            margin: "0 0 6px",
          }}
        >
          Gatekeeper · P3
        </p>
        <h1 className="fade-up fade-up-1" style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>
          Check your visa readiness
        </h1>
        <p className="fade-up fade-up-2" style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 24px", maxWidth: 480 }}>
          A preparation checklist, not a prediction. We flag what officers commonly question and give you a
          concrete fix — never a probability, never a verdict.
        </p>

        <div style={{ display: "flex", marginBottom: 10 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  margin: "0 auto 6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "background 0.2s ease, color 0.2s ease, transform 0.2s ease",
                  background: i <= step ? "var(--brand)" : "var(--surface)",
                  color: i <= step ? "#fff" : "var(--text-secondary)",
                  border: i <= step ? "none" : "1.5px solid var(--border-strong)",
                  transform: i === step ? "scale(1.12)" : "scale(1)",
                  boxShadow: i === step ? "0 4px 12px var(--brand-glow)" : "none",
                }}
              >
                {i < step ? <IconCheck size={13} color="#fff" /> : i + 1}
              </div>
              <p style={{ fontSize: 11, margin: 0, color: i <= step ? "var(--text-primary)" : "var(--text-muted)" }}>
                {s}
              </p>
            </div>
          ))}
        </div>
        <div className="progress-track" style={{ marginBottom: 28 }}>
          <div className="progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div key={step} className="card step-fade" style={{ padding: "22px 24px" }}>
          {step === 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <IconGlobe />
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Where are you applying?</h2>
              </div>
              <FieldHint>Each country has its own visa rules — this decides which official criteria we check you against.</FieldHint>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {countries.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => update("destination_country", c.value as any)}
                    style={{
                      textAlign: "left",
                      padding: "14px 16px",
                      borderRadius: 10,
                      border:
                        form.destination_country === c.value
                          ? "2px solid var(--brand)"
                          : "1px solid var(--border-strong)",
                      background: form.destination_country === c.value ? "var(--brand-light)" : "var(--surface)",
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.sub}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <IconCash />
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Funding</h2>
              </div>

              <label className="field-label">Liquid funds available (USD)</label>
              <FieldHint>Cash, savings, or fixed deposits you (or your sponsor) can show immediately — not property or future income.</FieldHint>
              <input
                type="number"
                value={form.funding.liquid_funds_usd}
                onChange={(e) => update("funding", { ...form.funding, liquid_funds_usd: Number(e.target.value) })}
              />

              <label className="field-label">Who is funding this?</label>
              <FieldHint>Officers check whether the funding source is plausible and well-documented, not just sufficient.</FieldHint>
              <select
                value={form.funding.sponsor_type}
                onChange={(e) => update("funding", { ...form.funding, sponsor_type: e.target.value })}
              >
                <option value="self">Myself</option>
                <option value="parent">Parent</option>
                <option value="relative">Other relative</option>
                <option value="employer">Employer</option>
                <option value="other">Other</option>
              </select>

              <label className="field-label">Days the current balance has been held</label>
              <FieldHint>Many countries require funds to be "seasoned" (held for a minimum period) to prove they aren't a last-minute loan.</FieldHint>
              <input
                type="number"
                value={form.funding.funds_seasoning_days}
                onChange={(e) =>
                  update("funding", { ...form.funding, funds_seasoning_days: Number(e.target.value) })
                }
              />

              {form.funding.sponsor_type !== "self" && (
                <div className="step-fade" style={{ marginTop: 4 }}>
                  <label className="field-label">Relationship to sponsor</label>
                  <FieldHint>E.g. "father", "aunt", "employer" — used to judge whether the funding relationship is credible.</FieldHint>
                  <input
                    value={form.sponsor.relationship_to_applicant || ""}
                    onChange={(e) =>
                      update("sponsor", { ...form.sponsor, relationship_to_applicant: e.target.value })
                    }
                  />
                  <label style={checkboxRow}>
                    <input
                      type="checkbox"
                      style={{ width: "auto" }}
                      checked={form.sponsor.relationship_proof_provided}
                      onChange={(e) =>
                        update("sponsor", { ...form.sponsor, relationship_proof_provided: e.target.checked })
                      }
                    />
                    I have documentary proof of this relationship
                  </label>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <IconSchool />
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Academics and course</h2>
              </div>

              <label className="field-label">Highest qualification</label>
              <FieldHint>Your most recent completed degree or diploma, e.g. "Bachelor's in Commerce".</FieldHint>
              <input
                value={form.academic.highest_qualification}
                onChange={(e) => update("academic", { ...form.academic, highest_qualification: e.target.value })}
              />

              <label className="field-label">Education/employment gap (months)</label>
              <FieldHint>Any period since your last qualification or job where you weren't studying or working. Unexplained gaps are one of the most common flags.</FieldHint>
              <input
                type="number"
                value={form.academic.education_gap_months}
                onChange={(e) =>
                  update("academic", { ...form.academic, education_gap_months: Number(e.target.value) })
                }
              />
              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={form.academic.gap_explanation_provided}
                  onChange={(e) =>
                    update("academic", { ...form.academic, gap_explanation_provided: e.target.checked })
                  }
                />
                I can explain this gap in writing
              </label>

              <label className="field-label">Intended course</label>
              <FieldHint>What you plan to study abroad. Pick from the list, or choose "Other" to type it yourself.</FieldHint>
              <select
                value={courseIsOther ? "__other__" : form.course.intended_course}
                onChange={(e) => handleCourseSelect(e.target.value)}
              >
                <option value="" disabled>
                  Select a course…
                </option>
                {COMMON_COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__other__">Other — type my own</option>
              </select>
              {courseIsOther && (
                <div className="other-course-wrap">
                  <input
                    autoFocus
                    placeholder="Type your intended course"
                    value={form.course.intended_course}
                    onChange={(e) => update("course", { ...form.course, intended_course: e.target.value })}
                  />
                </div>
              )}

              <label className="field-label">Prior field of study</label>
              <FieldHint>Your previous major/subject. Officers look for a coherent story between what you studied and what you're applying for.</FieldHint>
              <input
                value={form.course.prior_field_of_study || ""}
                onChange={(e) => update("course", { ...form.course, prior_field_of_study: e.target.value })}
              />
              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={form.course.prior_field_matches_intended}
                  onChange={(e) =>
                    update("course", { ...form.course, prior_field_matches_intended: e.target.checked })
                  }
                />
                My prior field matches my intended course
              </label>
              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={form.course.coherence_explanation_provided}
                  onChange={(e) =>
                    update("course", { ...form.course, coherence_explanation_provided: e.target.checked })
                  }
                />
                I have a written explanation connecting my background to this course
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <IconGlobe />
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Immigration history and ties</h2>
              </div>

              <label className="field-label">Prior visa refusals</label>
              <FieldHint>Number of times any country has previously refused you a visa. Past refusals must be addressed directly, not hidden.</FieldHint>
              <input
                type="number"
                value={form.immigration.prior_visa_refusals}
                onChange={(e) =>
                  update("immigration", { ...form.immigration, prior_visa_refusals: Number(e.target.value) })
                }
              />

              <label className="field-label">Current employment status</label>
              <FieldHint>Used to assess your "ties to home" — evidence you have reasons to return after your studies.</FieldHint>
              <select
                value={form.ties.employment_status}
                onChange={(e) => update("ties", { ...form.ties, employment_status: e.target.value })}
              >
                <option value="employed">Employed</option>
                <option value="self_employed">Self-employed</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
              </select>

              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={form.ties.property_ownership}
                  onChange={(e) => update("ties", { ...form.ties, property_ownership: e.target.checked })}
                />
                I own property in my home country
              </label>
              <label style={checkboxRow}>
                <input
                  type="checkbox"
                  style={{ width: "auto" }}
                  checked={form.ties.family_ties_explanation_provided}
                  onChange={(e) =>
                    update("ties", { ...form.ties, family_ties_explanation_provided: e.target.checked })
                  }
                />
                I can describe my ties to home country in writing
              </label>

              <div style={{ borderTop: "1px solid var(--border)", marginTop: 18, paddingTop: 16 }}>
                <label style={{ ...checkboxRow, marginTop: 0 }}>
                  <input
                    type="checkbox"
                    style={{ width: "auto" }}
                    checked={form.consent_given}
                    onChange={(e) => update("consent_given", e.target.checked as any)}
                  />
                  I consent to my profile being processed to generate this readiness report.
                </label>
              </div>
            </>
          )}
        </div>

        {error && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 12 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <button className="btn-secondary" type="button" onClick={back} disabled={step === 0}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IconArrowLeft size={14} color="var(--text-secondary)" /> Back
            </span>
          </button>

          {step < STEPS.length - 1 ? (
            <button className="btn-primary" type="button" onClick={next}>
              Continue <IconArrowRight size={16} color="#fff" />
            </button>
          ) : (
            <button className="btn-primary" type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <IconSpinner /> Generating…
                </>
              ) : (
                <>
                  Generate readiness report <IconArrowRight size={16} color="#fff" />
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </>
  );
}

"""
Generates the constructed applicant profiles under tests/profiles/*.json.
Re-run with `python tests/make_profiles.py` after changing the base shape.
Expected flags per profile are declared in tests/test_engine.py, not here —
this file only emits valid ApplicantProfile payloads.
"""
import json
from pathlib import Path

OUT = Path(__file__).parent / "profiles"
OUT.mkdir(exist_ok=True)


def base(country, **overrides):
    profile = {
        "destination_country": country,
        "consent_given": True,
        "funding": {"liquid_funds_usd": 100000, "sponsor_type": "self", "funds_seasoning_days": 60},
        "academic": {
            "highest_qualification": "Bachelor's Degree",
            "gpa_percentage": 75,
            "education_gap_months": 0,
            "gap_explanation_provided": True,
        },
        "course": {
            "intended_course": "MSc Data Science",
            "prior_field_of_study": "Computer Science",
            "prior_field_matches_intended": True,
            "coherence_explanation_provided": True,
        },
        "immigration": {"prior_visa_refusals": 0, "refusal_countries": []},
        "english": {"test_type": "ielts", "score": 7.0, "exempt": False},
        "sponsor": {"relationship_to_applicant": None, "relationship_proof_provided": False},
        "ties": {
            "employment_status": "employed",
            "property_ownership": True,
            "family_ties_explanation_provided": True,
        },
    }
    for key, val in overrides.items():
        if isinstance(val, dict) and key in profile:
            profile[key].update(val)
        else:
            profile[key] = val
    return profile


profiles = {
    # ---- Country A (US) ----
    "clean_country_a": base("country-a"),
    "funding_shortfall_country_a": base("country-a", funding={"liquid_funds_usd": 20000}),
    "seasoning_issue_country_a": base("country-a", funding={"funds_seasoning_days": 10}),
    "education_gap_country_a": base(
        "country-a", academic={"education_gap_months": 12, "gap_explanation_provided": False}
    ),
    "prior_refusal_country_a": base("country-a", immigration={"prior_visa_refusals": 1}),
    "course_incoherence_country_a": base(
        "country-a", course={"prior_field_matches_intended": False, "coherence_explanation_provided": False}
    ),
    "sponsor_country_a": base(
        "country-a",
        funding={"sponsor_type": "parent"},
        sponsor={"relationship_to_applicant": "parent", "relationship_proof_provided": False},
    ),
    "weak_ties_country_a": base(
        "country-a",
        ties={"employment_status": "unemployed", "property_ownership": False, "family_ties_explanation_provided": False},
    ),
    "seasoning_and_gap_country_a": base(
        "country-a",
        funding={"funds_seasoning_days": 5},
        academic={"education_gap_months": 8, "gap_explanation_provided": False},
    ),
    "boundary_exact_funds_country_a": base("country-a", funding={"liquid_funds_usd": 60000}),

    # ---- Country B (UK) ----
    "clean_country_b": base("country-b", funding={"liquid_funds_usd": 60000, "funds_seasoning_days": 40}),
    "funding_shortfall_country_b": base(
        "country-b", funding={"liquid_funds_usd": 10000, "funds_seasoning_days": 40}
    ),
    "seasoning_issue_country_b": base(
        "country-b", funding={"liquid_funds_usd": 60000, "funds_seasoning_days": 5}
    ),
    "multi_flag_country_b": base(
        "country-b",
        funding={"liquid_funds_usd": 10000, "funds_seasoning_days": 5},
        immigration={"prior_visa_refusals": 1},
    ),
    "sponsor_and_shortfall_country_b": base(
        "country-b",
        funding={"liquid_funds_usd": 10000, "funds_seasoning_days": 40, "sponsor_type": "parent"},
        sponsor={"relationship_to_applicant": "parent", "relationship_proof_provided": False},
    ),
    "course_incoherence_country_b": base(
        "country-b",
        funding={"liquid_funds_usd": 60000, "funds_seasoning_days": 40},
        course={"prior_field_matches_intended": False, "coherence_explanation_provided": False},
    ),
    "boundary_exact_funds_country_b": base(
        "country-b", funding={"liquid_funds_usd": 46641, "funds_seasoning_days": 40}
    ),

    # ---- Country C (Canada) ----
    "clean_country_c": base("country-c", funding={"liquid_funds_usd": 45000}),
    "funding_shortfall_country_c": base("country-c", funding={"liquid_funds_usd": 10000}),
    "dual_intent_country_c": base(
        "country-c",
        funding={"liquid_funds_usd": 45000},
        ties={"employment_status": "unemployed", "property_ownership": False, "family_ties_explanation_provided": False},
    ),
    "study_plan_country_c": base(
        "country-c", funding={"liquid_funds_usd": 45000}, course={"coherence_explanation_provided": False}
    ),
    "funding_and_refusal_country_c": base(
        "country-c", funding={"liquid_funds_usd": 10000}, immigration={"prior_visa_refusals": 1}
    ),
    "sponsor_country_c": base(
        "country-c",
        funding={"liquid_funds_usd": 45000, "sponsor_type": "relative"},
        sponsor={"relationship_to_applicant": "aunt", "relationship_proof_provided": False},
    ),
    "boundary_exact_funds_country_c": base("country-c", funding={"liquid_funds_usd": 40250}),
}

for name, payload in profiles.items():
    (OUT / f"{name}.json").write_text(json.dumps(payload, indent=2))

print(f"Wrote {len(profiles)} profiles to {OUT}")

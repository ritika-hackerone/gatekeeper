import json
from pathlib import Path

import pytest

from gatekeeper.anchor import AnchorViolation
from gatekeeper.report import build_report
from gatekeeper.schema import ApplicantProfile

PROFILES_DIR = Path(__file__).parent / "profiles"

# Maps profile filename (no extension) -> expected set of rule_ids in the report.
EXPECTED_FLAGS = {
    "clean_country_a": set(),
    "funding_shortfall_country_a": {"us-funding-shortfall"},
    "seasoning_issue_country_a": {"us-funds-seasoning"},
    "education_gap_country_a": {"us-unexplained-gap"},
    "prior_refusal_country_a": {"us-prior-refusal"},
    "course_incoherence_country_a": {"us-course-coherence"},
    "sponsor_country_a": {"us-sponsor-relationship"},
    "weak_ties_country_a": {"us-weak-home-ties"},
    "seasoning_and_gap_country_a": {"us-funds-seasoning", "us-unexplained-gap"},
    "boundary_exact_funds_country_a": set(),  # exactly meets required amount -> sufficient

    "clean_country_b": set(),
    "funding_shortfall_country_b": {"uk-funding-shortfall"},
    "seasoning_issue_country_b": {"uk-28-day-rule"},
    "multi_flag_country_b": {"uk-funding-shortfall", "uk-28-day-rule", "uk-prior-refusal"},
    "sponsor_and_shortfall_country_b": {"uk-funding-shortfall", "uk-sponsor-evidence"},
    "course_incoherence_country_b": {"uk-course-progression"},
    "boundary_exact_funds_country_b": set(),

    "clean_country_c": set(),
    "funding_shortfall_country_c": {"ca-funding-shortfall"},
    "dual_intent_country_c": {"ca-dual-intent"},
    "study_plan_country_c": {"ca-study-plan-coherence"},
    "funding_and_refusal_country_c": {"ca-funding-shortfall", "ca-prior-refusal"},
    "sponsor_country_c": {"ca-sponsor-evidence"},
    "boundary_exact_funds_country_c": set(),
}


def _load(name: str) -> ApplicantProfile:
    data = json.loads((PROFILES_DIR / f"{name}.json").read_text())
    return ApplicantProfile(**data)


@pytest.mark.parametrize("name,expected", EXPECTED_FLAGS.items())
def test_profile_flags_match_expected(name, expected):
    profile = _load(name)
    report = build_report(profile)
    actual = {f["rule_id"] for f in report.flags}
    assert actual == expected, f"{name}: expected {expected}, got {actual}"


def test_report_never_contains_outcome_language():
    profile = _load("funding_shortfall_country_a")
    report = build_report(profile)
    banned = ["approved", "denied", "guarantee", "will be granted", "% chance"]
    haystack = json.dumps(report.to_dict()).lower()
    for word in banned:
        assert word not in haystack


def test_every_flag_has_a_source_url():
    for name in EXPECTED_FLAGS:
        profile = _load(name)
        report = build_report(profile)
        for f in report.flags:
            assert f["source_url"].startswith("https://")


def test_consent_required():
    data = json.loads((PROFILES_DIR / "clean_country_a.json").read_text())
    data["consent_given"] = False
    with pytest.raises(Exception):
        ApplicantProfile(**data)


def test_funding_summary_present_on_every_report():
    for name in EXPECTED_FLAGS:
        profile = _load(name)
        report = build_report(profile)
        assert "total_required_usd" in report.funding_summary
        assert "shortfall_usd" in report.funding_summary
        assert isinstance(report.funding_summary["sufficient"], bool)

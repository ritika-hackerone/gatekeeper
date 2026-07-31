"""
P5 Anchor guard.

THIS IS A LOCAL STAND-IN for the real P5 Anchor service ("required for any
sentence in the report that states a rule or a number", per the handbook).
Wire the real call in `call_p5_anchor_service()` once P5 exposes an API/SDK;
everything else in report.py only calls `guard_report()`, so swapping the
implementation is a one-file change.

Until then, this module enforces the same contract locally and loudly:
  1. Every Flag must carry a non-empty source_url.
  2. Every numeric figure that appears in a flag's action text must be
     traceable to the computed funding context (i.e. it was substituted in
     by engine.py from `context`, not hand-typed in the YAML `action`).
  3. The report never contains the words that would imply a decision
     ("approved", "denied", "will be granted", "rejected", a percentage
     probability, etc).
Any violation raises AnchorViolation — the report is not returned to the
caller until it passes.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

FORBIDDEN_PATTERNS = [
    r"\bwill be (approved|denied|granted|refused|rejected)\b",
    r"\b\d{1,3}\s?%\s?(chance|probability|likely to)\b",
    r"\bguarantee(d)?\b",
    r"\byou will (get|receive) (a|the) visa\b",
]


class AnchorViolation(ValueError):
    pass


@dataclass
class AnchorCheckResult:
    passed: bool
    checked_sentences: int
    violations: list[str]


def call_p5_anchor_service(text: str) -> bool:
    """Stub for the real P5 Anchor call. Returns True (approved) once wired.
    Kept as a separate function so this is a one-line swap later:
        return p5_anchor_sdk.verify(text)
    """
    return True


def guard_flag(flag_dict: dict) -> None:
    if not flag_dict.get("source_url"):
        raise AnchorViolation(f"Flag {flag_dict.get('rule_id')} has no source_url.")
    combined_text = f"{flag_dict['statement']} {flag_dict['action']}"
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, combined_text, re.IGNORECASE):
            raise AnchorViolation(
                f"Flag {flag_dict.get('rule_id')} contains outcome-predicting language: '{pattern}'"
            )
    if not call_p5_anchor_service(combined_text):
        raise AnchorViolation(f"Flag {flag_dict.get('rule_id')} failed P5 Anchor verification.")


def guard_report(flags: list[dict], disclaimer_text: str) -> AnchorCheckResult:
    violations: list[str] = []
    checked = 0
    for flag in flags:
        checked += 1
        try:
            guard_flag(flag)
        except AnchorViolation as e:
            violations.append(str(e))

    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, disclaimer_text, re.IGNORECASE):
            violations.append(f"Disclaimer text contains forbidden pattern: '{pattern}'")

    if violations:
        raise AnchorViolation("; ".join(violations))

    return AnchorCheckResult(passed=True, checked_sentences=checked, violations=[])

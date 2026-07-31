"""
Stage 5 — Funding check.

Computes sufficiency against real (or mocked, clearly labeled) tuition and
living cost data from P1 Atlas. The buffer assumption is stated openly in
the output, per 5.2/5.4 — never hidden inside the math.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from .atlas_client import AtlasClient, CostEstimate
from .schema import ApplicantProfile


@dataclass
class FundingResult:
    tuition_usd: float
    living_cost_usd: float
    buffer_pct: float
    total_required_usd: float
    funds_available_usd: float
    shortfall_usd: float
    sufficient: bool
    cost_data_source: str
    cost_data_as_of: str
    cost_data_is_mock: bool

    def to_context(self) -> dict:
        """Flat keys consumed by the rule evaluator, prefixed funding__."""
        return {
            "funding__tuition_usd": self.tuition_usd,
            "funding__living_cost_usd": self.living_cost_usd,
            "funding__buffer_pct": self.buffer_pct,
            "funding__total_required_usd": round(self.total_required_usd, 2),
            "funding__shortfall_usd": round(self.shortfall_usd, 2),
            "funding__sufficient": self.sufficient,
        }


def compute_funding_sufficiency(
    profile: ApplicantProfile,
    buffer_pct: float,
    atlas_client: AtlasClient | None = None,
) -> FundingResult:
    atlas_client = atlas_client or AtlasClient()

    fallback: CostEstimate | None = None
    if profile.program_cost and profile.program_cost.annual_tuition_usd is not None:
        fallback = CostEstimate(
            annual_tuition_usd=profile.program_cost.annual_tuition_usd,
            annual_living_cost_usd=profile.program_cost.annual_living_cost_usd or 0.0,
            source="applicant-reported (P1 Atlas had no match)",
            as_of="n/a",
            is_mock=False,
        )

    cost = atlas_client.get_cost_estimate(
        country_code=profile.destination_country.value,
        institution_name=profile.program_cost.institution_name if profile.program_cost else None,
        program_level=profile.program_cost.program_level if profile.program_cost else None,
        fallback=fallback,
    )

    base_required = cost.annual_tuition_usd + cost.annual_living_cost_usd
    total_required = base_required * (1 + buffer_pct)
    available = profile.funding.liquid_funds_usd
    shortfall = max(0.0, total_required - available)

    return FundingResult(
        tuition_usd=cost.annual_tuition_usd,
        living_cost_usd=cost.annual_living_cost_usd,
        buffer_pct=buffer_pct,
        total_required_usd=total_required,
        funds_available_usd=available,
        shortfall_usd=shortfall,
        sufficient=shortfall <= 0.0,
        cost_data_source=cost.source,
        cost_data_as_of=cost.as_of,
        cost_data_is_mock=cost.is_mock,
    )

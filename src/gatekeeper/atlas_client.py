"""
P1 Atlas client — tuition & living cost data.

THIS IS A MOCK. P1 Atlas is a sibling project (tuition + living cost data,
per the handbook: "You depend on: P1 Atlas for tuition and living cost data").
Wire the real API here once P1 ships an endpoint/contract. Everything else
in this codebase (funding.py, rules) only talks to AtlasClient's interface,
so swapping the implementation is a one-file change.

Expected real contract (documented so P1's team and this team can align):
    GET {ATLAS_API_BASE}/v1/costs?country={country_code}&institution={name}&program_level={level}
    -> { "annual_tuition_usd": float, "annual_living_cost_usd": float,
         "source": str, "as_of": "YYYY-MM-DD" }
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date
from typing import Optional

import httpx

ATLAS_API_BASE = os.environ.get("ATLAS_API_BASE", "")
ATLAS_API_KEY = os.environ.get("ATLAS_API_KEY", "")


@dataclass
class CostEstimate:
    annual_tuition_usd: float
    annual_living_cost_usd: float
    source: str
    as_of: str
    is_mock: bool = False


# Deliberately conservative placeholder figures, clearly labeled as mock,
# so the pipeline is runnable end-to-end before P1 Atlas is wired in.
_MOCK_COSTS: dict[str, CostEstimate] = {
    "country-a": CostEstimate(35000, 15000, "MOCK — replace with P1 Atlas", str(date.today()), True),
    "country-b": CostEstimate(28000, 14400, "MOCK — replace with P1 Atlas", str(date.today()), True),
    "country-c": CostEstimate(22000, 13000, "MOCK — replace with P1 Atlas", str(date.today()), True),
}


class AtlasClient:
    def __init__(self, base_url: str = ATLAS_API_BASE, api_key: str = ATLAS_API_KEY):
        self.base_url = base_url
        self.api_key = api_key

    def get_cost_estimate(
        self,
        country_code: str,
        institution_name: Optional[str] = None,
        program_level: Optional[str] = None,
        fallback: Optional[CostEstimate] = None,
    ) -> CostEstimate:
        if self.base_url:
            try:
                resp = httpx.get(
                    f"{self.base_url}/v1/costs",
                    params={"country": country_code, "institution": institution_name, "program_level": program_level},
                    headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {},
                    timeout=10.0,
                )
                resp.raise_for_status()
                data = resp.json()
                return CostEstimate(
                    annual_tuition_usd=data["annual_tuition_usd"],
                    annual_living_cost_usd=data["annual_living_cost_usd"],
                    source=data.get("source", self.base_url),
                    as_of=data.get("as_of", str(date.today())),
                    is_mock=False,
                )
            except Exception:
                # Fall through to fallback/mock — funding.py records that this
                # happened so it is never silently swallowed in the report.
                pass

        if fallback is not None:
            return fallback

        if country_code not in _MOCK_COSTS:
            raise ValueError(f"No cost data (mock or live) available for {country_code}")
        return _MOCK_COSTS[country_code]

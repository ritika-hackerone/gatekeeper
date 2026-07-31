"""
Stage 2 — Schema.

Every field here is something a rule or the funding check can reference.
Do not add free-text fields that could carry sensitive personal narrative —
per 5.3, no free-text sensitive fields, and nationality is never used as a
scoring input (it exists only for currency/cost lookups against P1 Atlas
where legitimately needed, e.g. tuition is usually cost-of-program based,
not nationality based, so we deliberately do NOT collect nationality here).
"""
from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class DestinationCountry(str, Enum):
    COUNTRY_A = "country-a"  # United States (F-1)
    COUNTRY_B = "country-b"  # United Kingdom (Student visa)
    COUNTRY_C = "country-c"  # Canada (Study permit)


class SponsorType(str, Enum):
    SELF = "self"
    PARENT = "parent"
    RELATIVE = "relative"
    EMPLOYER = "employer"
    OTHER = "other"


class EmploymentStatus(str, Enum):
    EMPLOYED = "employed"
    SELF_EMPLOYED = "self_employed"
    STUDENT = "student"
    UNEMPLOYED = "unemployed"


class EnglishTestType(str, Enum):
    IELTS = "ielts"
    TOEFL = "toefl"
    PTE = "pte"
    DUOLINGO = "duolingo"
    NONE = "none"


class FundingInfo(BaseModel):
    liquid_funds_usd: float = Field(..., ge=0, description="Documented liquid funds, converted to USD.")
    sponsor_type: SponsorType = SponsorType.SELF
    funds_seasoning_days: int = Field(
        0, ge=0, description="Number of consecutive days the current balance has been held."
    )


class AcademicInfo(BaseModel):
    highest_qualification: str
    gpa_percentage: Optional[float] = Field(None, ge=0, le=100)
    education_gap_months: int = Field(0, ge=0)
    gap_explanation_provided: bool = False


class CourseInfo(BaseModel):
    intended_course: str
    prior_field_of_study: Optional[str] = None
    prior_field_matches_intended: bool = False
    coherence_explanation_provided: bool = False


class ImmigrationHistory(BaseModel):
    prior_visa_refusals: int = Field(0, ge=0)
    refusal_countries: list[str] = Field(default_factory=list)


class EnglishProficiency(BaseModel):
    test_type: EnglishTestType = EnglishTestType.NONE
    score: Optional[float] = None
    exempt: bool = False


class SponsorRelationship(BaseModel):
    relationship_to_applicant: Optional[str] = None
    relationship_proof_provided: bool = False


class TiesToHome(BaseModel):
    employment_status: EmploymentStatus = EmploymentStatus.UNEMPLOYED
    property_ownership: bool = False
    family_ties_explanation_provided: bool = False


class ProgramCost(BaseModel):
    """What the applicant says the program will cost — used as a fallback
    only if P1 Atlas has no match for the institution/program. P1 Atlas data
    is always preferred; see funding.py."""
    annual_tuition_usd: Optional[float] = Field(None, ge=0)
    annual_living_cost_usd: Optional[float] = Field(None, ge=0)
    institution_name: Optional[str] = None
    program_level: Optional[str] = Field(None, description="e.g. undergraduate, masters, phd")


class ApplicantProfile(BaseModel):
    """Top-level intake payload. `flatten()` is what the rules engine consumes."""

    destination_country: DestinationCountry
    consent_given: bool = Field(..., description="Explicit consent to process this data for a readiness report.")
    consent_timestamp: Optional[date] = None

    funding: FundingInfo
    academic: AcademicInfo
    course: CourseInfo
    immigration: ImmigrationHistory = Field(default_factory=ImmigrationHistory)
    english: EnglishProficiency = Field(default_factory=EnglishProficiency)
    sponsor: SponsorRelationship = Field(default_factory=SponsorRelationship)
    ties: TiesToHome
    program_cost: Optional[ProgramCost] = None

    @field_validator("consent_given")
    @classmethod
    def must_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Explicit consent is required before a report can be generated.")
        return v

    @model_validator(mode="after")
    def sponsor_relationship_only_if_not_self(self) -> "ApplicantProfile":
        # Not a hard error — just guards against silently-wrong intake data.
        if self.funding.sponsor_type == SponsorType.SELF and self.sponsor.relationship_to_applicant:
            raise ValueError("sponsor_type is 'self' but a sponsor relationship was also provided.")
        return self

    def flatten(self) -> dict:
        """Flatten nested fields into dotted->double-underscore keys for the
        rule evaluator, e.g. funding.liquid_funds_usd -> funding__liquid_funds_usd.
        Enum values are unwrapped to their plain string/number value."""
        out: dict = {}

        def _walk(prefix: str, value):
            if isinstance(value, BaseModel):
                for name, val in value.__dict__.items():
                    _walk(f"{prefix}{name}", val)
            elif isinstance(value, Enum):
                out[prefix] = value.value
            else:
                out[prefix] = value

        for name, val in self.__dict__.items():
            if name == "program_cost" and val is None:
                continue
            if isinstance(val, BaseModel):
                for sub_name, sub_val in val.__dict__.items():
                    _walk(f"{name}__{sub_name}", sub_val)
            else:
                _walk(name, val)

        return out

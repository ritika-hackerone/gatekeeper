"""
Stage 4 — Rules engine.

Rules live in rules/*.yaml, are declarative, and are readable by a
non-engineer (see 5.4). This module only evaluates them. It never produces
a verdict, a probability, or a score — only Flag objects: what we noticed,
the rule it relates to (with a link), how serious it is, and what to do.
"""
from __future__ import annotations

import ast
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

RULES_DIR = Path(__file__).resolve().parent.parent.parent / "rules"

_SAFE_FUNCS = {"abs": abs, "min": min, "max": max, "len": len, "round": round}
_ALLOWED_NODE_TYPES = (
    ast.Expression, ast.BoolOp, ast.BinOp, ast.UnaryOp, ast.Compare,
    ast.Name, ast.Load, ast.Constant, ast.And, ast.Or, ast.Not,
    ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE,
    ast.Call, ast.In, ast.NotIn, ast.Is, ast.IsNot,
)


class UnsafeRuleCondition(ValueError):
    pass


def _validate_ast(node: ast.AST) -> None:
    for child in ast.walk(node):
        if not isinstance(child, _ALLOWED_NODE_TYPES):
            raise UnsafeRuleCondition(f"Disallowed expression element: {type(child).__name__}")
        if isinstance(child, ast.Call):
            if not isinstance(child.func, ast.Name) or child.func.id not in _SAFE_FUNCS:
                raise UnsafeRuleCondition("Only whitelisted helper functions may be called in a rule condition.")


def evaluate_condition(condition: str, context: dict[str, Any]) -> bool:
    """Evaluate a declarative YAML rule condition against a flat context dict.
    Restricted to a small, whitelisted expression grammar — no attribute
    access, no imports, no arbitrary calls. Missing keys raise loudly rather
    than silently evaluating to a wrong answer (see 5.8: fail loudly)."""
    tree = ast.parse(condition, mode="eval")
    _validate_ast(tree)

    class _NameCollector(ast.NodeVisitor):
        names: set[str] = set()

        def visit_Name(self, node: ast.Name) -> None:  # noqa: N802
            self.names.add(node.id)

    collector = _NameCollector()
    collector.names = set()
    collector.visit(tree)
    missing = collector.names - set(context.keys()) - set(_SAFE_FUNCS.keys())
    if missing:
        raise KeyError(f"Rule condition references unknown field(s): {sorted(missing)}")

    code = compile(tree, "<rule-condition>", "eval")
    return bool(eval(code, {"__builtins__": {}}, {**_SAFE_FUNCS, **context}))


@dataclass
class Rule:
    id: str
    statement: str
    source_url: str
    severity: str  # high | medium | low
    condition: str
    action: str


@dataclass
class Flag:
    rule_id: str
    statement: str
    source_url: str
    severity: str
    action: str

    def to_dict(self) -> dict:
        return {
            "rule_id": self.rule_id,
            "statement": self.statement.strip(),
            "source_url": self.source_url,
            "severity": self.severity,
            "action": self.action.strip(),
        }


_SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def load_rules(country_code: str) -> tuple[list[Rule], float, str]:
    """Returns (rules, funding_buffer_pct, official_overview_url)."""
    path = RULES_DIR / f"{country_code}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"No rules file for country '{country_code}' at {path}")
    data = yaml.safe_load(path.read_text())
    rules = [Rule(**r) for r in data["rules"]]
    for r in rules:
        if r.severity not in _SEVERITY_ORDER:
            raise ValueError(f"Rule {r.id} has unknown severity '{r.severity}'")
        if not r.source_url:
            raise ValueError(f"Rule {r.id} has no source_url — every rule must cite a source.")
    return rules, float(data.get("funding_buffer_pct", 0.0)), data.get("official_overview_url", "")


def run_rules(rules: list[Rule], context: dict[str, Any], funding_shortfall_usd: float = 0.0) -> list[Flag]:
    flags: list[Flag] = []
    for rule in rules:
        try:
            triggered = evaluate_condition(rule.condition, context)
        except KeyError:
            # A rule referencing a field that isn't in this profile's context
            # is a schema/rule mismatch — surfaced to logs, not to the user
            # as a flag, and not swallowed silently.
            raise
        if triggered:
            action_text = rule.action.format(**{k: v for k, v in context.items() if isinstance(v, (int, float, str))})
            flags.append(Flag(rule.id, rule.statement, rule.source_url, rule.severity, action_text))

    flags.sort(key=lambda f: (_SEVERITY_ORDER.get(f.severity, 99), -funding_shortfall_usd if "funding" in f.rule_id else 0))
    return flags

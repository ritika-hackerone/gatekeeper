import pytest

from gatekeeper.engine import UnsafeRuleCondition, evaluate_condition


def test_basic_condition():
    assert evaluate_condition("funding__sufficient == False", {"funding__sufficient": False}) is True


def test_unknown_field_raises():
    with pytest.raises(KeyError):
        evaluate_condition("not_a_real_field == True", {})


def test_disallowed_import_blocked():
    with pytest.raises(Exception):
        evaluate_condition("__import__('os').system('echo hi')", {})


def test_disallowed_attribute_access_blocked():
    with pytest.raises(Exception):
        evaluate_condition("funding__sufficient.__class__", {"funding__sufficient": False})


def test_whitelisted_function_allowed():
    assert evaluate_condition("min(x, y) < 5", {"x": 3, "y": 10}) is True

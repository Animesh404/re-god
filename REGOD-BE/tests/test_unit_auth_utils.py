import pytest


def test_hash_and_verify_password():
    import main
    password = "S3cure-P@ss!"
    hashed = main.hash_password(password)
    assert isinstance(hashed, str)
    assert main.verify_password(password, hashed) is True
    assert main.verify_password("wrong", hashed) is False


def test_get_default_scopes_for_role():
    import main
    assert "dashboard:read" in main.get_default_scopes_for_role("student")
    assert main.get_default_scopes_for_role("unknown") == ["dashboard:read"]


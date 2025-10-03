import os
import uuid
import pytest


def _fake_user():
    return {
        "id": str(uuid.uuid4()),
        "email": "student@example.com",
        "name": "Student",
        "role": "student",
        "verified": True,
        "clerk_user_id": "user_123"
    }


@pytest.mark.asyncio
async def test_get_course_modules_with_fake_auth(asgi_client, app_instance, monkeypatch):
    import main

    # Fake DB returning empty module list
    class FakeConn:
        async def fetch(self, *args, **kwargs):
            return []
        async def close(self):
            return None

    class FakePool:
        async def acquire(self):
            class _Ctx:
                async def __aenter__(self_inner):
                    return FakeConn()
                async def __aexit__(self_inner, exc_type, exc, tb):
                    return False
            return _Ctx()

    main.db_pool = FakePool()

    # Bypass token-based auth by overriding FastAPI dependency
    original_dep = main.get_current_user

    async def fake_current_user(*args, **kwargs):
        return _fake_user()

    app_instance.dependency_overrides[original_dep] = fake_current_user

    res = await asgi_client.get("/api/courses/1/modules")
    assert res.status_code == 200
    assert res.json() == []

    # Cleanup override
    app_instance.dependency_overrides.pop(original_dep, None)


import os
import uuid
import json
import pytest


@pytest.mark.asyncio
async def test_auth_test_endpoint(asgi_client):
    res = await asgi_client.get("/api/auth/test")
    assert res.status_code == 200
    data = res.json()
    assert data.get("status") == "authentication_system_active"


@pytest.mark.asyncio
async def test_check_user_returns_false_without_db(asgi_client, app_instance, monkeypatch):
    # Override db_pool to a fake object to avoid real DB and mock Redis for rate limit
    import main

    class FakeConn:
        async def fetchrow(self, *args, **kwargs):
            return None
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

    class FakePipe:
        async def execute(self):
            return [None, 0, None, True]
        def zremrangebyscore(self, *a, **k):
            return self
        def zcard(self, *a, **k):
            return self
        def zadd(self, *a, **k):
            return self
        def expire(self, *a, **k):
            return self

    class FakeRedis:
        def pipeline(self):
            return FakePipe()

    main.db_pool = FakePool()
    main.redis_client = FakeRedis()

    res = await asgi_client.post("/api/auth/check-user", json={"identifier": "ghost@example.com"})
    assert res.status_code == 200
    assert res.json() == {"user_exists": False, "auth_method": "email"}


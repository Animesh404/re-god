import asyncio
import pytest


@pytest.mark.asyncio
async def test_rate_limit_allows_initial_requests(monkeypatch):
    import main

    # Fake redis_client pipeline
    class FakePipe:
        def __init__(self):
            self.count = 0
        def zremrangebyscore(self, *a, **k):
            return self
        def zcard(self, *a, **k):
            return self
        def zadd(self, *a, **k):
            return self
        def expire(self, *a, **k):
            return self
        async def execute(self):
            # Return [zremrangebyscore_result, count, zadd_result, expire_result]
            self.count += 1
            return [None, 0, None, True]

    class FakeRedis:
        def pipeline(self):
            return FakePipe()

    main.redis_client = FakeRedis()
    await main.rate_limit_check("test:key", window=60, max_requests=5)


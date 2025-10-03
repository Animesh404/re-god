import os
import asyncio
import pytest
from typing import AsyncIterator
import importlib

import httpx

# Ensure test environment defaults
os.environ.setdefault("NODE_ENV", "test")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:password@localhost:5432/regod_test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("BCRYPT_ROUNDS", "4")


@pytest.fixture(scope="session")
def event_loop() -> AsyncIterator[asyncio.AbstractEventLoop]:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
def app_instance():
    # Import lazily to ensure env vars are set first
    main = importlib.import_module("main")
    return main.app


@pytest.fixture()
async def asgi_client(app_instance):
    transport = httpx.ASGITransport(app=app_instance, lifespan="off")
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client


import time
from collections import defaultdict
from fastapi import HTTPException, Request, status

class InMemoryRateLimiter:
    """Sliding window rate limiter to prevent credential stuffing and brute-force."""
    def __init__(self, max_requests: int = 5, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.history: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str):
        now = time.time()
        # Filter timestamps within window
        self.history[key] = [t for t in self.history[key] if now - t < self.window_seconds]
        if len(self.history[key]) >= self.max_requests:
            retry_after = int(self.window_seconds - (now - self.history[key][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Quá nhiều lần thử thất bại. Vui lòng thử lại sau {retry_after} giây.",
                headers={"Retry-After": str(retry_after)}
            )
        self.history[key].append(now)

login_limiter = InMemoryRateLimiter(max_requests=5, window_seconds=60)

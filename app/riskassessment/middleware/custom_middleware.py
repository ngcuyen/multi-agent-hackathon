import logging
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class CustomMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Log request
        data = {
            "method": request.method,
            "path": request.url.path,
            "origin": request.headers.get("Origin"),
        }
        print(f"REQUEST: {data}")

        # Process request
        response = await call_next(request)

        # Log response
        process_time = time.time() - start_time
        print(
            f"RESPONSE: path={request.url.path} status_code={response.status_code} duration={process_time:.4f}s"
        )

        return response

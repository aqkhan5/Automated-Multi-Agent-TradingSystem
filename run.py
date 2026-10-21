"""
Automated Multi-Agentic Quantitative Trading Desk Gateway
Local Development & CLI Runner Script
"""

import uvicorn
from app.main import app, create_app
from app.core.config import settings

if __name__ == "__main__":
    print("\n" + "=" * 75)
    print("           FINAGENTRA MULTI-AGENT TRADING TERMINAL GATEWAY")
    print("=" * 75)
    print("Booting Asynchronous FastAPI Web Server & Multi-Agent Cognitive Gateway...")
    print(f"Access the Dashboard at: http://{settings.SERVER_HOST}:{settings.SERVER_PORT}")
    print("=" * 75 + "\n")

    uvicorn.run("app.main:app", host=settings.SERVER_HOST, port=settings.SERVER_PORT, reload=True, log_level="info")

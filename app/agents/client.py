import os
import httpx
from agents import OpenAIChatCompletionsModel, AsyncOpenAI, ModelSettings
from app.core.config import settings

def get_gemini_model():
    """
    Initializes and returns an OpenAIChatCompletionsModel instance
    pointing to Google's OpenAI-compatible Gemini endpoint.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY in environment or .env file.")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=settings.GEMINI_BASE_URL,
        max_retries=settings.GEMINI_MAX_RETRIES,
        timeout=httpx.Timeout(90.0, connect=20.0)
    )

    return OpenAIChatCompletionsModel(
        model=settings.GEMINI_MODEL,
        openai_client=client
    )

def get_agent_model_settings() -> ModelSettings:
    """
    Returns deterministic ModelSettings (temperature=0.0)
    to eliminate stochastic token drift and mathematical hallucination.
    """
    return ModelSettings(
        temperature=settings.GEMINI_TEMPERATURE
    )

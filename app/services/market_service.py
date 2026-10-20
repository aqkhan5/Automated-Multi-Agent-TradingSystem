import asyncio
import yfinance as yf
from fastapi import HTTPException
from app.schemas.market import PriceChartResponse, Candle
from app.agents.tools.risk_engine import normalize_ticker

async def get_price_chart_data(ticker: str, period: str = "7d", interval: str = "15m") -> PriceChartResponse:
    """
    Fetches historical candle data and calculates current price, open, high, low,
    volume, and percentage variance for frontend charting.
    Supports Equities, Cryptocurrencies, and Commodities/Energy (OIL, GOLD, CL=F, GC=F).
    """
    clean_ticker = normalize_ticker(ticker)
    try:
        stock = yf.Ticker(clean_ticker)
        loop = asyncio.get_event_loop()
        df = await loop.run_in_executor(None, lambda: stock.history(period=period, interval=interval))

        if df.empty:
            raise HTTPException(status_code=400, detail=f"No data found for ticker '{clean_ticker}'")

        latest_close = float(df['Close'].iloc[-1])
        open_price = float(df['Open'].iloc[-1])
        high_price = float(df['High'].iloc[-1])
        low_price = float(df['Low'].iloc[-1])
        volume = int(df['Volume'].iloc[-1])

        candles = []
        df_last = df.tail(24)
        for timestamp, row in df_last.iterrows():
            candles.append(Candle(
                time=timestamp.strftime("%Y-%m-%d %H:%M:%S") if hasattr(timestamp, "strftime") else str(timestamp),
                open=round(float(row['Open']), 2),
                high=round(float(row['High']), 2),
                low=round(float(row['Low']), 2),
                close=round(float(row['Close']), 2),
                volume=int(row['Volume'])
            ))

        start_price = float(df['Close'].iloc[0])
        pct_change = ((latest_close - start_price) / start_price) * 100

        return PriceChartResponse(
            status="success",
            ticker=clean_ticker,
            current_price=round(latest_close, 2),
            open=round(open_price, 2),
            high=round(high_price, 2),
            low=round(low_price, 2),
            volume=volume,
            price_change_pct=round(pct_change, 2),
            candles=candles
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")

// ==========================================================================
// FinAgentra Institutional Automated Multi-Agent Trading Terminal
// React 18 + Babel Standalone + Tailwind CSS
// ==========================================================================

const { useState, useEffect, useRef } = React;

// ==========================================================================
// ASSET UNIVERSE & TRADINGVIEW-STYLE TICKER RESOLVER
// ==========================================================================
const ASSET_UNIVERSE = [
    // Cryptocurrencies
    { symbol: "BTC-USD", display: "BTC/USDT", name: "Bitcoin", category: "Crypto", keywords: ["btc", "bitcoin", "crypto"] },
    { symbol: "ETH-USD", display: "ETH/USDT", name: "Ethereum", category: "Crypto", keywords: ["eth", "ethereum", "ether"] },
    { symbol: "SOL-USD", display: "SOL/USDT", name: "Solana", category: "Crypto", keywords: ["sol", "solana"] },
    { symbol: "BNB-USD", display: "BNB/USDT", name: "BNB", category: "Crypto", keywords: ["bnb", "binance coin"] },
    { symbol: "XRP-USD", display: "XRP/USDT", name: "XRP / Ripple", category: "Crypto", keywords: ["xrp", "ripple"] },
    { symbol: "ADA-USD", display: "ADA/USDT", name: "Cardano", category: "Crypto", keywords: ["ada", "cardano"] },
    { symbol: "DOGE-USD", display: "DOGE/USDT", name: "Dogecoin", category: "Crypto", keywords: ["doge", "dogecoin"] },
    { symbol: "AVAX-USD", display: "AVAX/USDT", name: "Avalanche", category: "Crypto", keywords: ["avax", "avalanche"] },
    { symbol: "LINK-USD", display: "LINK/USDT", name: "Chainlink", category: "Crypto", keywords: ["link", "chainlink"] },
    { symbol: "DOT-USD", display: "DOT/USDT", name: "Polkadot", category: "Crypto", keywords: ["dot", "polkadot"] },
    { symbol: "LTC-USD", display: "LTC/USDT", name: "Litecoin", category: "Crypto", keywords: ["ltc", "litecoin"] },
    { symbol: "NEAR-USD", display: "NEAR/USDT", name: "NEAR Protocol", category: "Crypto", keywords: ["near"] },
    { symbol: "POL-USD", display: "POL/USDT", name: "Polygon", category: "Crypto", keywords: ["matic", "pol", "polygon"] },
    
    // Equities & Tech Giants
    { symbol: "AAPL", display: "AAPL", name: "Apple Inc.", category: "Stock", keywords: ["apple", "aapl", "iphone", "mac"] },
    { symbol: "NVDA", display: "NVDA", name: "NVIDIA Corp.", category: "Stock", keywords: ["nvidia", "nvda", "gpu", "ai"] },
    { symbol: "TSLA", display: "TSLA", name: "Tesla Inc.", category: "Stock", keywords: ["tesla", "tsla", "ev", "musk"] },
    { symbol: "MSFT", display: "MSFT", name: "Microsoft Corp.", category: "Stock", keywords: ["microsoft", "msft", "windows", "azure"] },
    { symbol: "GOOGL", display: "GOOGL", name: "Alphabet / Google", category: "Stock", keywords: ["google", "googl", "alphabet"] },
    { symbol: "AMZN", display: "AMZN", name: "Amazon.com Inc.", category: "Stock", keywords: ["amazon", "amzn", "aws"] },
    { symbol: "META", display: "META", name: "Meta Platforms", category: "Stock", keywords: ["meta", "facebook", "fb", "instagram"] },
    { symbol: "AMD", display: "AMD", name: "Advanced Micro Devices", category: "Stock", keywords: ["amd", "semiconductor"] },
    { symbol: "NFLX", display: "NFLX", name: "Netflix Inc.", category: "Stock", keywords: ["netflix", "nflx", "streaming"] },
    { symbol: "SPY", display: "SPY", name: "S&P 500 ETF Trust", category: "ETF", keywords: ["sp500", "s&p", "s&p 500", "spy"] },
    { symbol: "QQQ", display: "QQQ", name: "Invesco QQQ (Nasdaq 100)", category: "ETF", keywords: ["nasdaq", "qqq", "tech"] },

    // Commodities & Energy Futures
    { symbol: "GC=F", display: "GOLD", name: "Gold Futures", category: "Commodity", keywords: ["gold", "gc=f", "bullion", "metals"] },
    { symbol: "CL=F", display: "CRUDE OIL", name: "Crude Oil (WTI)", category: "Commodity", keywords: ["oil", "crude", "cl=f", "wti", "petroleum"] },
    { symbol: "SI=F", display: "SILVER", name: "Silver Futures", category: "Commodity", keywords: ["silver", "si=f"] },
    { symbol: "NG=F", display: "NAT GAS", name: "Natural Gas Futures", category: "Commodity", keywords: ["gas", "natural gas", "ng=f"] }
];

function resolveTickerInput(input) {
    if (!input || !input.trim()) return "BTC-USD";
    const raw = input.trim();
    const upper = raw.toUpperCase().replace(/\s+/g, " ");

    // 1. Direct match with official symbol
    const exact = ASSET_UNIVERSE.find(a => a.symbol.toUpperCase() === upper);
    if (exact) return exact.symbol;

    // 2. Direct match with display (e.g. BTC/USDT, CRUDE OIL, GOLD)
    const matchDisplay = ASSET_UNIVERSE.find(a => a.display.toUpperCase() === upper);
    if (matchDisplay) return matchDisplay.symbol;

    // 3. Match with full name (e.g. "Bitcoin", "Apple Inc.", "Gold Futures")
    const matchName = ASSET_UNIVERSE.find(a => a.name.toUpperCase() === upper || a.name.toUpperCase().startsWith(upper));
    if (matchName) return matchName.symbol;

    // 4. Match with keywords
    const matchKeyword = ASSET_UNIVERSE.find(a => a.keywords.some(k => k.toUpperCase() === upper));
    if (matchKeyword) return matchKeyword.symbol;

    // 5. Clean common crypto suffixes: /USDT, -USDT, USDT, -USD
    let cleaned = upper.replace("/USDT", "").replace("-USDT", "").replace("USDT", "").replace("-USD", "");
    const matchCleaned = ASSET_UNIVERSE.find(a => a.keywords.some(k => k.toUpperCase() === cleaned));
    if (matchCleaned) return matchCleaned.symbol;

    // 6. Common commodity nicknames
    if (upper === "OIL" || upper === "CRUDE" || upper === "WTI") return "CL=F";
    if (upper === "GOLD") return "GC=F";
    if (upper === "SILVER") return "SI=F";
    if (upper === "NATGAS" || upper === "GAS" || upper === "NATURAL GAS") return "NG=F";

    // 7. Auto-append -USD for bare crypto symbols if 3-5 letters
    const bareCryptos = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "LINK", "DOT", "NEAR", "LTC", "POL", "SHIB"];
    if (bareCryptos.includes(cleaned)) return `${cleaned}-USD`;

    // 8. Return uppercase raw input
    return upper;
}

// ==========================================================================
// 1. TRADINGVIEW & ADVANCED INTERACTIVE CHARTING SUITE
// ==========================================================================

function getTradingViewWidgetSymbol(ticker) {
    if (!ticker) return "BINANCE:BTCUSDT";
    const t = ticker.toUpperCase().trim();
    const map = {
        "BTC-USD": "BINANCE:BTCUSDT",
        "ETH-USD": "BINANCE:ETHUSDT",
        "SOL-USD": "BINANCE:SOLUSDT",
        "BNB-USD": "BINANCE:BNBUSDT",
        "XRP-USD": "BINANCE:XRPUSDT",
        "ADA-USD": "BINANCE:ADAUSDT",
        "DOGE-USD": "BINANCE:DOGEUSDT",
        "AVAX-USD": "BINANCE:AVAXUSDT",
        "LINK-USD": "BINANCE:LINKUSDT",
        "DOT-USD": "BINANCE:DOTUSDT",
        "NEAR-USD": "BINANCE:NEARUSDT",
        "POL-USD": "BINANCE:POLUSDT",
        "GC=F": "TVC:GOLD",
        "CL=F": "TVC:USOIL",
        "SI=F": "TVC:SILVER",
        "NG=F": "NYMEX:NG1!",
        "AAPL": "NASDAQ:AAPL",
        "NVDA": "NASDAQ:NVDA",
        "TSLA": "NASDAQ:TSLA",
        "MSFT": "NASDAQ:MSFT",
        "GOOGL": "NASDAQ:GOOGL",
        "AMZN": "NASDAQ:AMZN",
        "META": "NASDAQ:META",
        "AMD": "NASDAQ:AMD",
        "NFLX": "NASDAQ:NFLX",
        "SPY": "AMEX:SPY",
        "QQQ": "NASDAQ:QQQ"
    };
    if (map[t]) return map[t];
    if (t.endsWith("-USD")) return `BINANCE:${t.replace("-USD", "USDT")}`;
    if (t.includes("=")) return `TVC:${t.replace("=F", "")}`;
    return `NASDAQ:${t}`;
}

function calculateSMA(candles, period) {
    if (!candles || candles.length < period) return [];
    const result = [];
    for (let i = 0; i < candles.length; i++) {
        if (i < period - 1) continue;
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += candles[i - j].close;
        }
        result.push({
            time: candles[i].time,
            value: Number((sum / period).toFixed(2))
        });
    }
    return result;
}

function calculateEMA(candles, period) {
    if (!candles || candles.length < period) return [];
    const k = 2 / (period + 1);
    const result = [];
    let sum = 0;
    for (let i = 0; i < period; i++) sum += candles[i].close;
    let prevEMA = sum / period;
    result.push({ time: candles[period - 1].time, value: Number(prevEMA.toFixed(2)) });
    for (let i = period; i < candles.length; i++) {
        const currentEMA = (candles[i].close * k) + (prevEMA * (1 - k));
        result.push({ time: candles[i].time, value: Number(currentEMA.toFixed(2)) });
        prevEMA = currentEMA;
    }
    return result;
}

function calculateRSI(candles, period = 14) {
    if (!candles || candles.length <= period) return [];
    const result = [];
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = candles[i].close - candles[i - 1].close;
        if (change >= 0) gains += change;
        else losses += -change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
    result.push({ time: candles[period].time, value: Number(rsi.toFixed(2)) });

    for (let i = period + 1; i < candles.length; i++) {
        const change = candles[i].close - candles[i - 1].close;
        const gain = change >= 0 ? change : 0;
        const loss = change < 0 ? -change : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));
        result.push({ time: candles[i].time, value: Number(rsi.toFixed(2)) });
    }
    return result;
}

function calculateBollingerBands(candles, period = 20, multiplier = 2) {
    if (!candles || candles.length < period) return { upper: [], middle: [], lower: [] };
    const upper = [];
    const middle = [];
    const lower = [];

    for (let i = period - 1; i < candles.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += candles[i - j].close;
        }
        const sma = sum / period;

        let variance = 0;
        for (let j = 0; j < period; j++) {
            variance += Math.pow(candles[i - j].close - sma, 2);
        }
        const stdDev = Math.sqrt(variance / period);

        const time = candles[i].time;
        const upVal = Number((sma + (multiplier * stdDev)).toFixed(2));
        const midVal = Number(sma.toFixed(2));
        const lowVal = Number((sma - (multiplier * stdDev)).toFixed(2));

        upper.push({ time, value: upVal });
        middle.push({ time, value: midVal });
        lower.push({ time, value: lowVal });
    }
    return { upper, middle, lower };
}

function calculateATR(candles, period = 14) {
    if (!candles || candles.length <= period) return [];
    const trs = [candles[0].high - candles[0].low];

    for (let i = 1; i < candles.length; i++) {
        const h = candles[i].high;
        const l = candles[i].low;
        const prevC = candles[i - 1].close;
        trs.push(Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC)));
    }

    let sumTR = 0;
    for (let i = 0; i < period; i++) {
        sumTR += trs[i];
    }
    let prevATR = sumTR / period;
    const result = [{ time: candles[period - 1].time, value: Number(prevATR.toFixed(2)) }];

    for (let i = period; i < candles.length; i++) {
        const currentATR = (prevATR * (period - 1) + trs[i]) / period;
        result.push({ time: candles[i].time, value: Number(currentATR.toFixed(2)) });
        prevATR = currentATR;
    }
    return result;
}

function formatChartTime(timeStr) {
    if (typeof timeStr === 'number') return timeStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(timeStr)) return timeStr;
    const d = new Date(timeStr);
    return Math.floor(d.getTime() / 1000);
}

function TradingViewWidgetEmbed({ symbol, isDark, interval = "15" }) {
    const containerId = "tv_advanced_chart_container";
    
    useEffect(() => {
        const tvSymbol = getTradingViewWidgetSymbol(symbol);
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";

        if (window.TradingView) {
            new window.TradingView.widget({
                autosize: true,
                symbol: tvSymbol,
                interval: interval === "1d" ? "D" : interval === "4h" ? "240" : interval === "1h" ? "60" : "15",
                timezone: "Etc/UTC",
                theme: isDark ? "dark" : "light",
                style: "1",
                locale: "en",
                toolbar_bg: isDark ? "#181A20" : "#F5F5F5",
                enable_publishing: false,
                allow_symbol_change: true,
                hide_side_toolbar: false, // FULL LEFT DRAWING/EDITING TOOLBAR!
                studies: [
                    "MASimple@tv-basicstudies",
                    "RSI@tv-basicstudies",
                    "BB@tv-basicstudies",
                    "ATR@tv-basicstudies"
                ],
                container_id: containerId
            });
        }
    }, [symbol, isDark, interval]);

    return (
        <div id={containerId} className="w-full h-full min-h-[380px]" />
    );
}

function CandlestickChart({ candles, decision, ticker, strategyName, isDark = true }) {
    const [chartMode, setChartMode] = useState("terminal"); // "terminal" | "tradingview"
    
    // Technical Indicators State (TradingView suite)
    const [showBB, setShowBB] = useState(true);
    const [showRSI, setShowRSI] = useState(false);
    const [showATR, setShowATR] = useState(false);
    const [showEMA9, setShowEMA9] = useState(true);
    const [showEMA21, setShowEMA21] = useState(false);
    const [showMA50, setShowMA50] = useState(false);
    const [showVolume, setShowVolume] = useState(true);

    // TradingView-Style Indicators Modal State
    const [showIndicatorsModal, setShowIndicatorsModal] = useState(false);
    const [indicatorSearch, setIndicatorSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [legendData, setLegendData] = useState(null);

    const chartContainerRef = useRef(null);
    const chartWrapRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // Clean Technical Indicators Catalog
    const INDICATORS_CATALOG = [
        {
            id: "bb",
            name: "Bollinger Bands",
            code: "BB 20, 2",
            category: "volatility",
            categoryLabel: "Volatility",
            state: showBB,
            toggle: () => setShowBB(prev => !prev),
            color: "#38BDF8"
        },
        {
            id: "rsi",
            name: "Relative Strength Index",
            code: "RSI 14",
            category: "momentum",
            categoryLabel: "Oscillator",
            state: showRSI,
            toggle: () => setShowRSI(prev => !prev),
            color: "#A855F7"
        },
        {
            id: "atr",
            name: "Average True Range",
            code: "ATR 14",
            category: "volatility",
            categoryLabel: "Volatility",
            state: showATR,
            toggle: () => setShowATR(prev => !prev),
            color: "#EC4899"
        },
        {
            id: "ema9",
            name: "Exponential Moving Average 9",
            code: "EMA 9",
            category: "moving_averages",
            categoryLabel: "Moving Avg",
            state: showEMA9,
            toggle: () => setShowEMA9(prev => !prev),
            color: "#00F0FF"
        },
        {
            id: "ema21",
            name: "Exponential Moving Average 21",
            code: "EMA 21",
            category: "moving_averages",
            categoryLabel: "Moving Avg",
            state: showEMA21,
            toggle: () => setShowEMA21(prev => !prev),
            color: "#D946EF"
        },
        {
            id: "ma50",
            name: "Simple Moving Average 50",
            code: "MA 50",
            category: "moving_averages",
            categoryLabel: "Moving Avg",
            state: showMA50,
            toggle: () => setShowMA50(prev => !prev),
            color: "#F59E0B"
        },
        {
            id: "vol",
            name: "Volume Histogram",
            code: "VOL",
            category: "volume",
            categoryLabel: "Volume",
            state: showVolume,
            toggle: () => setShowVolume(prev => !prev),
            color: "#0ECB81"
        }
    ];

    const activeCount = INDICATORS_CATALOG.filter(item => item.state).length;

    const filteredIndicators = INDICATORS_CATALOG.filter(item => {
        const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
        const query = indicatorSearch.trim().toLowerCase();
        const matchesSearch = !query || 
            item.name.toLowerCase().includes(query) || 
            item.code.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
    });

    const toggleFullscreen = () => {
        if (!chartWrapRef.current) return;
        if (!document.fullscreenElement) {
            chartWrapRef.current.requestFullscreen().catch(err => console.error(err));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(err => console.error(err));
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFsChange);
        return () => document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    const handleAutoFit = () => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.timeScale().fitContent();
        }
    };

    useEffect(() => {
        if (chartMode !== "terminal") return;
        if (!chartContainerRef.current) return;
        if (!window.LightweightCharts) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.remove();
            chartInstanceRef.current = null;
        }

        const container = chartContainerRef.current;
        const width = container.clientWidth || 600;
        const height = isFullscreen ? window.innerHeight - 80 : 380;

        const hasOscillators = showRSI || showATR;

        const chart = window.LightweightCharts.createChart(container, {
            width: width,
            height: height,
            layout: {
                background: {
                    type: window.LightweightCharts.ColorType ? window.LightweightCharts.ColorType.Solid : 'solid',
                    color: isDark ? '#1E2329' : '#FFFFFF',
                },
                textColor: isDark ? '#848E9C' : '#707A8A',
                fontSize: 11,
                fontFamily: 'Inter, system-ui, sans-serif',
            },
            grid: {
                vertLines: {
                    color: isDark ? 'rgba(43, 49, 58, 0.4)' : 'rgba(234, 236, 239, 0.6)',
                },
                horzLines: {
                    color: isDark ? 'rgba(43, 49, 58, 0.4)' : 'rgba(234, 236, 239, 0.6)',
                },
            },
            crosshair: {
                mode: window.LightweightCharts.CrosshairMode ? window.LightweightCharts.CrosshairMode.Normal : 1,
                vertLine: {
                    color: isDark ? '#5E6673' : '#B7BDC6',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#FCD535',
                },
                horzLine: {
                    color: isDark ? '#5E6673' : '#B7BDC6',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#FCD535',
                },
            },
            rightPriceScale: {
                borderColor: isDark ? '#2B313A' : '#EAECEF',
                scaleMargins: {
                    top: 0.08,
                    bottom: hasOscillators ? 0.32 : showVolume ? 0.22 : 0.08,
                },
            },
            timeScale: {
                borderColor: isDark ? '#2B313A' : '#EAECEF',
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
        });

        chartInstanceRef.current = chart;

        if (candles && candles.length > 0) {
            const sorted = [...candles].sort((a, b) => {
                const tA = formatChartTime(a.time);
                const tB = formatChartTime(b.time);
                return (typeof tA === 'number' && typeof tB === 'number') ? tA - tB : String(tA).localeCompare(String(tB));
            });

            const seenTimes = new Set();
            const cleanCandles = [];
            const volumeData = [];

            sorted.forEach(c => {
                const t = formatChartTime(c.time);
                if (!seenTimes.has(t)) {
                    seenTimes.add(t);
                    const o = parseFloat(c.open);
                    const h = parseFloat(c.high);
                    const l = parseFloat(c.low);
                    const cl = parseFloat(c.close);
                    cleanCandles.push({ time: t, open: o, high: h, low: l, close: cl });
                    
                    if (c.volume !== undefined) {
                        volumeData.push({
                            time: t,
                            value: parseFloat(c.volume) || 0,
                            color: cl >= o ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)'
                        });
                    }
                }
            });

            // 1. Candlestick Series
            const candlestickSeries = chart.addCandlestickSeries({
                upColor: '#0ECB81',
                downColor: '#F6465D',
                borderVisible: false,
                wickUpColor: '#0ECB81',
                wickDownColor: '#F6465D',
            });
            candlestickSeries.setData(cleanCandles);

            // 2. Bollinger Bands (BB 20, 2)
            let bbUpperSeries = null, bbMiddleSeries = null, bbLowerSeries = null;
            let lastBBU = null, lastBBM = null, lastBBL = null;
            if (showBB) {
                const bb = calculateBollingerBands(cleanCandles, 20, 2);
                if (bb.upper.length > 0) {
                    bbUpperSeries = chart.addLineSeries({
                        color: 'rgba(56, 189, 248, 0.85)',
                        lineWidth: 1.5,
                        title: 'BB Upper',
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                    });
                    bbUpperSeries.setData(bb.upper);
                    lastBBU = bb.upper[bb.upper.length - 1]?.value;

                    bbMiddleSeries = chart.addLineSeries({
                        color: 'rgba(245, 158, 11, 0.9)',
                        lineWidth: 1,
                        lineStyle: 2,
                        title: 'BB Basis',
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                    });
                    bbMiddleSeries.setData(bb.middle);
                    lastBBM = bb.middle[bb.middle.length - 1]?.value;

                    bbLowerSeries = chart.addLineSeries({
                        color: 'rgba(56, 189, 248, 0.85)',
                        lineWidth: 1.5,
                        title: 'BB Lower',
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                    });
                    bbLowerSeries.setData(bb.lower);
                    lastBBL = bb.lower[bb.lower.length - 1]?.value;
                }
            }

            // 3. EMA 9
            let ema9Series = null;
            let lastEMA9 = null;
            if (showEMA9) {
                const ema9 = calculateEMA(cleanCandles, 9);
                if (ema9.length > 0) {
                    ema9Series = chart.addLineSeries({
                        color: '#00F0FF',
                        lineWidth: 1.5,
                        title: 'EMA 9',
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                    });
                    ema9Series.setData(ema9);
                    lastEMA9 = ema9[ema9.length - 1]?.value;
                }
            }

            // 4. EMA 21
            let ema21Series = null;
            let lastEMA21 = null;
            if (showEMA21) {
                const ema21 = calculateEMA(cleanCandles, 21);
                if (ema21.length > 0) {
                    ema21Series = chart.addLineSeries({
                        color: '#D946EF',
                        lineWidth: 1.5,
                        title: 'EMA 21',
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                    });
                    ema21Series.setData(ema21);
                    lastEMA21 = ema21[ema21.length - 1]?.value;
                }
            }

            // 5. MA 50
            let ma50Series = null;
            let lastMA50 = null;
            if (showMA50) {
                const ma50 = calculateSMA(cleanCandles, 50);
                if (ma50.length > 0) {
                    ma50Series = chart.addLineSeries({
                        color: '#F59E0B',
                        lineWidth: 1.5,
                        title: 'MA 50',
                        priceLineVisible: false,
                        crosshairMarkerVisible: false,
                    });
                    ma50Series.setData(ma50);
                    lastMA50 = ma50[ma50.length - 1]?.value;
                }
            }

            // 6. Volume Histogram
            let volumeSeries = null;
            if (showVolume && volumeData.length > 0) {
                volumeSeries = chart.addHistogramSeries({
                    priceFormat: { type: 'volume' },
                    priceScaleId: 'volume_pane',
                });
                chart.priceScale('volume_pane').applyOptions({
                    scaleMargins: {
                        top: hasOscillators ? 0.65 : 0.82,
                        bottom: hasOscillators ? 0.28 : 0,
                    },
                });
                volumeSeries.setData(volumeData);
            }

            // 7. Relative Strength Index (RSI 14)
            let rsiSeries = null;
            let lastRSI = null;
            if (showRSI) {
                const rsiData = calculateRSI(cleanCandles, 14);
                if (rsiData.length > 0) {
                    rsiSeries = chart.addLineSeries({
                        priceScaleId: 'rsi_pane',
                        color: '#A855F7',
                        lineWidth: 2,
                        title: 'RSI 14',
                        priceLineVisible: false,
                        crosshairMarkerVisible: true,
                        priceFormat: {
                            type: 'custom',
                            formatter: (val) => val.toFixed(1),
                        },
                    });
                    chart.priceScale('rsi_pane').applyOptions({
                        scaleMargins: {
                            top: 0.74,
                            bottom: 0.02,
                        },
                    });
                    rsiSeries.setData(rsiData);
                    lastRSI = rsiData[rsiData.length - 1]?.value;

                    const lineStyleDashed = window.LightweightCharts?.LineStyle?.Dashed || 2;
                    const lineStyleDotted = window.LightweightCharts?.LineStyle?.Dotted || 1;
                    rsiSeries.createPriceLine({
                        price: 70,
                        color: 'rgba(244, 63, 94, 0.75)',
                        lineWidth: 1,
                        lineStyle: lineStyleDashed,
                        axisLabelVisible: true,
                        title: '70',
                    });
                    rsiSeries.createPriceLine({
                        price: 50,
                        color: 'rgba(148, 163, 184, 0.45)',
                        lineWidth: 1,
                        lineStyle: lineStyleDotted,
                        axisLabelVisible: false,
                    });
                    rsiSeries.createPriceLine({
                        price: 30,
                        color: 'rgba(16, 185, 129, 0.75)',
                        lineWidth: 1,
                        lineStyle: lineStyleDashed,
                        axisLabelVisible: true,
                        title: '30',
                    });
                }
            }

            // 8. Average True Range (ATR 14)
            let atrSeries = null;
            let lastATR = null;
            if (showATR) {
                const atrData = calculateATR(cleanCandles, 14);
                if (atrData.length > 0) {
                    atrSeries = chart.addLineSeries({
                        priceScaleId: 'atr_pane',
                        color: '#EC4899',
                        lineWidth: 1.8,
                        title: 'ATR 14',
                        priceLineVisible: false,
                        crosshairMarkerVisible: true,
                    });
                    chart.priceScale('atr_pane').applyOptions({
                        scaleMargins: {
                            top: 0.74,
                            bottom: 0.02,
                        },
                    });
                    atrSeries.setData(atrData);
                    lastATR = atrData[atrData.length - 1]?.value;
                }
            }

            // Initial Legend State
            const lastCandle = cleanCandles[cleanCandles.length - 1];
            if (lastCandle) {
                const chg = lastCandle.close - lastCandle.open;
                const chgPct = (chg / lastCandle.open) * 100;
                setLegendData({
                    open: lastCandle.open,
                    high: lastCandle.high,
                    low: lastCandle.low,
                    close: lastCandle.close,
                    change: chg,
                    changePct: chgPct,
                    bbUpper: lastBBU,
                    bbMiddle: lastBBM,
                    bbLower: lastBBL,
                    rsi: lastRSI,
                    atr: lastATR,
                    ema9: lastEMA9,
                    ema21: lastEMA21,
                    ma50: lastMA50,
                    time: lastCandle.time
                });
            }

            // Interactive Crosshair Move Subscription
            chart.subscribeCrosshairMove(param => {
                if (!param || !param.time || !param.seriesData) return;
                const cData = param.seriesData.get(candlestickSeries);
                if (cData) {
                    const chg = cData.close - cData.open;
                    const chgPct = (chg / cData.open) * 100;

                    const bbU = bbUpperSeries ? param.seriesData.get(bbUpperSeries)?.value : lastBBU;
                    const bbM = bbMiddleSeries ? param.seriesData.get(bbMiddleSeries)?.value : lastBBM;
                    const bbL = bbLowerSeries ? param.seriesData.get(bbLowerSeries)?.value : lastBBL;
                    const rsiVal = rsiSeries ? param.seriesData.get(rsiSeries)?.value : lastRSI;
                    const atrVal = atrSeries ? param.seriesData.get(atrSeries)?.value : lastATR;
                    const ema9Val = ema9Series ? param.seriesData.get(ema9Series)?.value : lastEMA9;
                    const ema21Val = ema21Series ? param.seriesData.get(ema21Series)?.value : lastEMA21;
                    const ma50Val = ma50Series ? param.seriesData.get(ma50Series)?.value : lastMA50;

                    setLegendData({
                        open: cData.open,
                        high: cData.high,
                        low: cData.low,
                        close: cData.close,
                        change: chg,
                        changePct: chgPct,
                        bbUpper: bbU,
                        bbMiddle: bbM,
                        bbLower: bbL,
                        rsi: rsiVal,
                        atr: atrVal,
                        ema9: ema9Val,
                        ema21: ema21Val,
                        ma50: ma50Val,
                        time: param.time
                    });
                }
            });

            chart.timeScale().fitContent();
        }

        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length > 0 && chartInstanceRef.current) {
                const newWidth = entries[0].contentRect.width;
                const newHeight = isFullscreen ? window.innerHeight - 80 : 380;
                chartInstanceRef.current.applyOptions({ width: newWidth, height: newHeight });
            }
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (chartInstanceRef.current) {
                chartInstanceRef.current.remove();
                chartInstanceRef.current = null;
            }
        };
    }, [candles, decision, ticker, isDark, chartMode, showBB, showRSI, showATR, showEMA9, showEMA21, showMA50, showVolume, isFullscreen]);

    return (
        <div ref={chartWrapRef} className={`relative w-full bn-panel p-4 flex flex-col justify-between ${isFullscreen ? 'bg-[var(--bn-card)] p-6' : ''}`}>
            {/* Top Toolbar */}
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-2.5 pb-2.5 border-b border-[var(--bn-border)]">
                {/* Left: Mode Selector */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        onClick={() => setChartMode("terminal")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                            chartMode === "terminal"
                                ? "bg-[#FCD535] text-black shadow-sm"
                                : "bg-[var(--bn-surface)] text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)]"
                        }`}
                        title="Interactive Terminal Chart"
                    >
                        <span>⚡ Terminal Pro</span>
                    </button>

                    <button
                        onClick={() => setChartMode("tradingview")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                            chartMode === "tradingview"
                                ? "bg-[#3861FB] text-white shadow-sm"
                                : "bg-[var(--bn-surface)] text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)]"
                        }`}
                        title="TradingView Advanced Engine with full drawing toolbar"
                    >
                        <span>📈 TradingView Advanced</span>
                    </button>
                </div>

                {/* Right: Indicators (3rd), Auto Fit (2nd), Fullscreen (1st / rightmost) */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                    {chartMode === "terminal" && (
                        <>
                            {/* Indicators Option (Third from right) */}
                            <button
                                onClick={() => setShowIndicatorsModal(true)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                    showIndicatorsModal
                                        ? "bg-[#FCD535] text-black font-bold shadow-sm"
                                        : "bg-[var(--bn-surface)] hover:bg-[var(--bn-surface-hover)] border border-[var(--bn-border)] text-[var(--bn-text)]"
                                }`}
                                title="Open Technical Indicators (RSI, Bollinger Bands, ATR, EMAs)"
                            >
                                <span className="text-[#FCD535] font-serif font-black italic text-sm leading-none">ƒx</span>
                                <span>Indicators</span>
                                {activeCount > 0 && (
                                    <span className="px-1.5 py-0.2 bg-[#FCD535]/20 text-[#FCD535] rounded-full text-[10px] font-mono font-bold">
                                        {activeCount}
                                    </span>
                                )}
                            </button>

                            {/* Auto Fit (Second from right) */}
                            <button
                                onClick={handleAutoFit}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bn-surface)] hover:bg-[var(--bn-surface-hover)] border border-[var(--bn-border)] text-[var(--bn-text)] transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Auto Fit & Reset Zoom"
                            >
                                <span className="text-sm leading-none">⟲</span>
                                <span>Auto Fit</span>
                            </button>
                        </>
                    )}

                    {/* Fullscreen (Rightmost) */}
                    <button
                        onClick={toggleFullscreen}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bn-surface)] hover:bg-[var(--bn-surface-hover)] border border-[var(--bn-border)] text-[var(--bn-text)] transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Toggle Fullscreen"
                    >
                        <span className="text-sm leading-none">⛶</span>
                        <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                    </button>
                </div>
            </div>

            {/* Live OHLCV & Indicators Legend Bar (Terminal mode) */}
            {chartMode === "terminal" && legendData && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[var(--bn-text-secondary)] px-1 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--bn-text)]">{ticker}</span>
                        <span>O: <strong className="text-[var(--bn-text)]">${legendData.open?.toFixed(2)}</strong></span>
                        <span>H: <strong className="text-[var(--bn-text)]">${legendData.high?.toFixed(2)}</strong></span>
                        <span>L: <strong className="text-[var(--bn-text)]">${legendData.low?.toFixed(2)}</strong></span>
                        <span>C: <strong className={legendData.change >= 0 ? "text-[#0ECB81]" : "text-[#F6465D]"}>${legendData.close?.toFixed(2)}</strong></span>
                        <span>Chg: <strong className={legendData.change >= 0 ? "text-[#0ECB81]" : "text-[#F6465D]"}>
                            {legendData.change >= 0 ? `+${legendData.changePct?.toFixed(2)}%` : `${legendData.changePct?.toFixed(2)}%`}
                        </strong></span>
                    </div>

                    {/* Dynamic Indicator Values in Legend */}
                    {showBB && legendData.bbUpper !== undefined && legendData.bbUpper !== null && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-[#38BDF8] font-semibold">BB(20,2):</span>
                            <span>Upper <strong className="text-[#38BDF8]">${legendData.bbUpper?.toFixed(2)}</strong></span>
                            <span>Mid <strong className="text-[#F59E0B]">${legendData.bbMiddle?.toFixed(2)}</strong></span>
                            <span>Lower <strong className="text-[#38BDF8]">${legendData.bbLower?.toFixed(2)}</strong></span>
                        </div>
                    )}

                    {showRSI && legendData.rsi !== undefined && legendData.rsi !== null && (
                        <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-[#A855F7] font-semibold">RSI(14):</span>
                            <strong className={legendData.rsi >= 70 ? "text-[#F43F5E]" : legendData.rsi <= 30 ? "text-[#0ECB81]" : "text-[#A855F7]"}>
                                {legendData.rsi?.toFixed(1)}
                            </strong>
                        </div>
                    )}

                    {showATR && legendData.atr !== undefined && legendData.atr !== null && (
                        <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-[#EC4899] font-semibold">ATR(14):</span>
                            <strong className="text-[#EC4899]">${legendData.atr?.toFixed(2)}</strong>
                        </div>
                    )}

                    {showEMA9 && legendData.ema9 !== undefined && legendData.ema9 !== null && (
                        <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-[#00F0FF] font-semibold">EMA9:</span>
                            <strong className="text-[#00F0FF]">${legendData.ema9?.toFixed(2)}</strong>
                        </div>
                    )}

                    {showEMA21 && legendData.ema21 !== undefined && legendData.ema21 !== null && (
                        <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-[#D946EF] font-semibold">EMA21:</span>
                            <strong className="text-[#D946EF]">${legendData.ema21?.toFixed(2)}</strong>
                        </div>
                    )}

                    {showMA50 && legendData.ma50 !== undefined && legendData.ma50 !== null && (
                        <div className="flex items-center gap-1 text-[10px]">
                            <span className="text-[#F59E0B] font-semibold">MA50:</span>
                            <strong className="text-[#F59E0B]">${legendData.ma50?.toFixed(2)}</strong>
                        </div>
                    )}
                </div>
            )}

            {/* Main Interactive Chart Container */}
            <div className="w-full relative">
                {chartMode === "terminal" ? (
                    <div
                        ref={chartContainerRef}
                        className={`w-full rounded-lg overflow-hidden ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[380px]'}`}
                    />
                ) : (
                    <div className={`w-full rounded-lg overflow-hidden bg-[var(--bn-surface)] ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[400px]'}`}>
                        <TradingViewWidgetEmbed
                            symbol={ticker}
                            isDark={isDark}
                            interval={strategyName?.includes("15m") ? "15" : strategyName?.includes("1h") ? "60" : strategyName?.includes("4h") ? "240" : "D"}
                        />
                    </div>
                )}

                {/* Multi-Agent Signal Pill (Terminal mode) */}
                {chartMode === "terminal" && decision && decision.ticker === ticker && (
                    <div className="absolute top-2 right-2 bg-[var(--bn-card)]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[var(--bn-border)] text-xs font-mono flex items-center gap-2 select-none shadow-lg z-10">
                        <span className="text-[var(--bn-text-secondary)]">Signal:</span>
                        <span className={decision.action.includes("BUY") ? "text-[#0ECB81] font-bold" : decision.action.includes("SELL") ? "text-[#F6465D] font-bold" : "text-white font-bold"}>
                            {decision.action}
                        </span>
                        <span className="text-[var(--bn-border)]">|</span>
                        <span className={decision.risk_status === "APPROVED" ? "text-[#0ECB81] font-bold" : "text-[#F6465D] font-bold"}>
                            {decision.risk_status}
                        </span>
                    </div>
                )}
            </div>

            {/* Clean Professional TradingView-Style Indicators Modal */}
            {showIndicatorsModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setShowIndicatorsModal(false)}
                >
                    <div
                        className="w-full max-w-md bg-[var(--bn-card)] border border-[var(--bn-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--bn-border)] bg-[var(--bn-surface)]/30">
                            <div className="flex items-center gap-2">
                                <span className="text-[#FCD535] font-serif font-black italic text-base leading-none">ƒx</span>
                                <h3 className="text-sm font-semibold text-[var(--bn-text)] tracking-wide">
                                    Technical Indicators
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowIndicatorsModal(false)}
                                className="w-7 h-7 rounded-lg hover:bg-[var(--bn-surface)] text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)] flex items-center justify-center transition-colors text-sm cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Search & Minimal Filter Tabs */}
                        <div className="px-5 pt-3.5 pb-2.5 border-b border-[var(--bn-border)]">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--bn-text-secondary)] text-xs">
                                    🔍
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search indicators..."
                                    value={indicatorSearch}
                                    onChange={(e) => setIndicatorSearch(e.target.value)}
                                    className="w-full pl-8 pr-7 py-2 rounded-lg bg-[var(--bn-surface)] border border-[var(--bn-border)] text-xs text-[var(--bn-text)] placeholder-[var(--bn-text-secondary)] focus:outline-none focus:border-[#FCD535] transition-all"
                                    autoFocus
                                />
                                {indicatorSearch && (
                                    <button
                                        onClick={() => setIndicatorSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)] text-xs cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Clean Category Filters */}
                            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
                                {[
                                    { id: "all", label: "All" },
                                    { id: "volatility", label: "Volatility" },
                                    { id: "momentum", label: "Oscillators" },
                                    { id: "moving_averages", label: "Moving Averages" },
                                    { id: "volume", label: "Volume" },
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                            selectedCategory === cat.id
                                                ? "bg-[var(--bn-surface-hover)] text-[#FCD535] font-semibold border border-[#FCD535]/30"
                                                : "text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)]"
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clean List with Native iOS/TradingView Toggle Switches */}
                        <div className="flex-1 overflow-y-auto px-2 py-1.5 divide-y divide-[var(--bn-border)]/40">
                            {filteredIndicators.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={item.toggle}
                                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--bn-surface)] transition-colors cursor-pointer group"
                                >
                                    {/* Indicator Identity */}
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-medium text-[var(--bn-text)] group-hover:text-white transition-colors truncate">
                                            {item.name}
                                        </span>
                                        <span className="text-[10px] font-mono text-[var(--bn-text-secondary)] px-1.5 py-0.5 rounded bg-[var(--bn-surface)] flex-shrink-0">
                                            {item.code}
                                        </span>
                                    </div>

                                    {/* Right: Tag & Clean Switch */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-[10px] text-[var(--bn-text-secondary)] hidden sm:inline">
                                            {item.categoryLabel}
                                        </span>

                                        {/* Toggle Switch */}
                                        <div
                                            className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 ${
                                                item.state ? "bg-[#0ECB81]" : "bg-[var(--bn-surface-hover)] border border-[var(--bn-border)]"
                                            }`}
                                        >
                                            <div
                                                className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-150 ${
                                                    item.state ? "translate-x-4" : "translate-x-0"
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredIndicators.length === 0 && (
                                <div className="py-8 text-center text-[var(--bn-text-secondary)] text-xs">
                                    No indicators found
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--bn-border)] bg-[var(--bn-surface)]/30 text-xs">
                            <span className="text-[var(--bn-text-secondary)]">
                                <strong className="text-[var(--bn-text)]">{activeCount}</strong> active
                            </span>
                            <div className="flex items-center gap-3">
                                {activeCount > 0 && (
                                    <button
                                        onClick={() => {
                                            setShowBB(false);
                                            setShowRSI(false);
                                            setShowATR(false);
                                            setShowEMA9(false);
                                            setShowEMA21(false);
                                            setShowMA50(false);
                                            setShowVolume(false);
                                        }}
                                        className="text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)] transition-colors cursor-pointer text-xs"
                                    >
                                        Clear all
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowIndicatorsModal(false)}
                                    className="px-4 py-1.5 rounded-lg bg-[#FCD535] text-black font-semibold hover:bg-[#FCD535]/90 transition-colors cursor-pointer text-xs shadow-sm"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================================================
// 2. AUTHENTICATION PORTAL (CoinGlass / Yahoo Finance Architecture)
// ==========================================================================
function AuthPortal({ onLoginSuccess }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);

    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupMobile, setSignupMobile] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupError, setSignupError] = useState("");
    const [signupSuccess, setSignupSuccess] = useState("");
    const [showSignupPassword, setShowSignupPassword] = useState(false);

    const [theme, setTheme] = useState(() => localStorage.getItem("bn_theme") || "dark");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("bn_theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoading(true);

        if (!loginEmail.trim() || !loginPassword.trim()) {
            setLoginError("Email and Password are required fields.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Invalid login credentials.");
            }

            if (data.access_token) {
                sessionStorage.setItem("access_token", data.access_token);
            }
            sessionStorage.setItem("active_operator", JSON.stringify(data.operator));
            onLoginSuccess(data.operator);
        } catch (err) {
            setLoginError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError("");
        setSignupSuccess("");
        setLoading(true);

        if (!signupName.trim() || !signupEmail.trim() || !signupMobile.trim() || !signupPassword.trim()) {
            setSignupError("All fields are required for registration.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: signupName.trim(),
                    email: signupEmail.trim(),
                    mobile_number: signupMobile.trim(),
                    password: signupPassword.trim()
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Registration failed.");
            }

            setSignupSuccess("Account registered successfully! Redirecting to login...");
            setTimeout(() => {
                setIsSignUp(false);
                setLoginEmail(signupEmail);
                setSignupSuccess("");
            }, 1000);
        } catch (err) {
            setSignupError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[var(--bn-bg)] select-none">
            {/* Minimalist Top Brand Header */}
            <header className="w-full px-6 py-4 flex items-center justify-between z-10 border-b border-[var(--bn-border)] bg-[var(--bn-card)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FCD535] flex items-center justify-center shadow-md shadow-[#FCD535]/30 ring-2 ring-[#FCD535]/40 flex-shrink-0">
                        <svg className="w-5 h-5 text-black fill-current stroke-black stroke-[0.5]" viewBox="0 0 24 24">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black tracking-tight text-[var(--bn-text)]">
                            Fin<span className="text-[#FCD535]">Agentra</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FCD535] bg-[#FCD535]/15 px-1.5 py-0.5 rounded border border-[#FCD535]/30">
                            PRO
                        </span>
                    </div>
                </div>

                <button
                    onClick={toggleTheme}
                    className="px-3 py-1.5 rounded-lg bg-[var(--bn-surface)] border border-[var(--bn-border)] text-[var(--bn-text-secondary)] hover:text-[#FCD535] transition-all cursor-pointer text-xs flex items-center gap-1.5"
                    title="Toggle Light / Dark theme"
                >
                    {theme === 'dark' ? '💡 Light' : '🌙 Dark'}
                </button>
            </header>

            {/* Center Content Area */}
            <div className="flex-grow flex items-center justify-center p-4 md:p-8 relative">
                {/* Subtle Geometric Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#181A20]/40 via-transparent to-[#0B0E11] pointer-events-none"></div>

                {/* Authentication Card */}
                <div className="w-full max-w-[420px] bg-[#181A20] border border-[#2B313A] rounded-xl p-6 sm:p-8 shadow-2xl relative z-10">
                    {!isSignUp ? (
                        /* ================= LOGIN VIEW ================= */
                        <div>
                            <h1 className="text-2xl font-bold text-[#EAECEF] tracking-tight">Login</h1>
                            <p className="text-xs text-[#848E9C] mt-1.5 mb-6">
                                New to FinAgentra?{" "}
                                <button
                                    type="button"
                                    onClick={() => { setIsSignUp(true); setLoginError(""); }}
                                    className="text-[#FCD535] hover:underline font-semibold cursor-pointer"
                                >
                                    Create an account
                                </button>
                            </p>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-[#848E9C] block mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        placeholder="Email"
                                        className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#2B313A] border border-[#363C4E] text-[#EAECEF] focus:border-[#FCD535] focus:outline-none transition-all placeholder-[#5E6673]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[#848E9C] block mb-1.5">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            placeholder="Password"
                                            className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#2B313A] border border-[#363C4E] text-[#EAECEF] focus:border-[#FCD535] focus:outline-none transition-all placeholder-[#5E6673] pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-[#848E9C] hover:text-[#EAECEF] text-xs cursor-pointer p-0.5"
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-0.5">
                                    <label className="flex items-center gap-1.5 text-[#848E9C] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="rounded accent-[#FCD535] w-3.5 h-3.5"
                                        />
                                        <span>Stay signed in</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => alert("Password recovery: Please contact the system administrator or check your registered email.")}
                                        className="text-[#848E9C] hover:text-[#FCD535] transition-colors cursor-pointer"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>

                                {loginError && (
                                    <div className="p-2.5 bg-[#F6465D]/15 border border-[#F6465D] rounded-lg text-[#F6465D] text-xs">
                                        {loginError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 mt-2 rounded-lg bg-[#FCD535] hover:bg-[#F0B90B] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-60"
                                >
                                    {loading ? "Authenticating..." : "Login"}
                                </button>
                            </form>

                            {/* Divider OR */}
                            <div className="relative my-5 text-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#2B313A]"></div>
                                </div>
                                <span className="relative px-3 text-[11px] uppercase tracking-wider text-[#5E6673] bg-[#181A20]">
                                    OR
                                </span>
                            </div>

                            {/* Social Sign-in Button */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => alert("Google OAuth SSO configured for production domain. Please use your registered email to log in.")}
                                    className="w-full py-2.5 px-3 rounded-lg bg-[#2B313A] hover:bg-[#363C4E] text-[#EAECEF] border border-[#363C4E] text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ================= REGISTER VIEW ================= */
                        <div>
                            <h1 className="text-2xl font-bold text-[#EAECEF] tracking-tight">Create an account</h1>
                            <p className="text-xs text-[#848E9C] mt-1.5 mb-6">
                                Already have an account?{" "}
                                <button
                                    type="button"
                                    onClick={() => { setIsSignUp(false); setSignupError(""); }}
                                    className="text-[#FCD535] hover:underline font-semibold cursor-pointer"
                                >
                                    Login
                                </button>
                            </p>

                            <form onSubmit={handleSignup} className="space-y-3.5">
                                <div>
                                    <label className="text-xs font-medium text-[#848E9C] block mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#2B313A] border border-[#363C4E] text-[#EAECEF] focus:border-[#FCD535] focus:outline-none transition-all placeholder-[#5E6673]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[#848E9C] block mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#2B313A] border border-[#363C4E] text-[#EAECEF] focus:border-[#FCD535] focus:outline-none transition-all placeholder-[#5E6673]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[#848E9C] block mb-1.5">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={signupMobile}
                                        onChange={(e) => setSignupMobile(e.target.value)}
                                        placeholder="+1 234 567 8900"
                                        className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#2B313A] border border-[#363C4E] text-[#EAECEF] focus:border-[#FCD535] focus:outline-none transition-all placeholder-[#5E6673]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[#848E9C] block mb-1.5">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showSignupPassword ? "text" : "password"}
                                            value={signupPassword}
                                            onChange={(e) => setSignupPassword(e.target.value)}
                                            placeholder="Create a strong password"
                                            className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#2B313A] border border-[#363C4E] text-[#EAECEF] focus:border-[#FCD535] focus:outline-none transition-all placeholder-[#5E6673] pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                                            className="absolute right-3 top-2.5 text-[#848E9C] hover:text-[#EAECEF] text-xs cursor-pointer p-0.5"
                                            title={showSignupPassword ? "Hide password" : "Show password"}
                                        >
                                            {showSignupPassword ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {signupError && (
                                    <div className="p-2.5 bg-[#F6465D]/15 border border-[#F6465D] rounded-lg text-[#F6465D] text-xs">
                                        {signupError}
                                    </div>
                                )}
                                {signupSuccess && (
                                    <div className="p-2.5 bg-[#0ECB81]/15 border border-[#0ECB81] rounded-lg text-[#0ECB81] text-xs">
                                        {signupSuccess}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 mt-2 rounded-lg bg-[#FCD535] hover:bg-[#F0B90B] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-60"
                                >
                                    {loading ? "Registering..." : "Create Account"}
                                </button>
                            </form>

                            {/* Divider OR */}
                            <div className="relative my-5 text-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#2B313A]"></div>
                                </div>
                                <span className="relative px-3 text-[11px] uppercase tracking-wider text-[#5E6673] bg-[#181A20]">
                                    OR
                                </span>
                            </div>

                            {/* Social Sign-in Button */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => alert("Google OAuth SSO configured for production domain.")}
                                    className="w-full py-2.5 px-3 rounded-lg bg-[#2B313A] hover:bg-[#363C4E] text-[#EAECEF] border border-[#363C4E] text-xs font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Minimalist Footer */}
            <footer className="w-full bg-[var(--bn-card)] border-t border-[var(--bn-border)] px-6 py-3 text-center text-xs text-[var(--bn-text-secondary)] flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                    FinAgentra Institutional Multi-Agent Trading System
                </div>
                <div className="flex items-center gap-4">
                    <span>System Status: <span className="text-[#0ECB81] font-semibold">● Operational</span></span>
                </div>
            </footer>
        </div>
    );
}

// ==========================================================================
// 3. RESEARCH LABORATORY & ABLATION BENCHMARKS VIEW
// ==========================================================================
function ResearchLabView({ operator, isDark = true }) {
    const [ticker, setTicker] = useState("BTC-USD");
    const [period, setPeriod] = useState("180d");
    const [capital, setCapital] = useState(10000);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [copiedLatex, setCopiedLatex] = useState(false);

    const quickTickers = ["BTC-USD", "ETH-USD", "AAPL", "NVDA", "CL=F", "GC=F"];
    const periods = ["30d", "90d", "180d", "1y"];

    const runBacktest = async (t = ticker, p = period) => {
        setLoading(true);
        setError(null);
        try {
            const cleanTicker = resolveTickerInput(t);
            const token = sessionStorage.getItem("access_token");
            const res = await fetch("/api/backtest/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    ticker: cleanTicker,
                    period: p,
                    initial_capital: parseFloat(capital) || 10000.0
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Backtest calculation failed.");
            setResults(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runBacktest();
    }, []);

    const renderChart = () => {
        if (!results || !results.models) return null;
        const models = results.models;
        const keys = ['benchmark', 'single_agent', 'linear_mas', 'adversarial_mas'];
        
        let allVals = [];
        keys.forEach(k => {
            if (models[k] && models[k].equity_curve) {
                allVals.push(...models[k].equity_curve);
            }
        });
        if (allVals.length === 0) return null;

        const minVal = Math.min(...allVals) * 0.98;
        const maxVal = Math.max(...allVals) * 1.02;
        const range = maxVal - minVal || 1;

        const width = 800;
        const height = 240;
        const padX = 65;
        const padY = 25;
        const chartW = width - padX - 25;
        const chartH = height - padY * 2;

        const getPoints = (curve) => {
            if (!curve || curve.length === 0) return "";
            const n = curve.length - 1 || 1;
            return curve.map((val, idx) => {
                const x = padX + (idx / n) * chartW;
                const y = height - padY - ((val - minVal) / range) * chartH;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(" ");
        };

        const colors = {
            benchmark: { stroke: "#848E9C", dash: "4,4", label: "Benchmark (Buy & Hold)" },
            single_agent: { stroke: "#FF7A45", dash: "", label: "Single Agent Baseline" },
            linear_mas: { stroke: "#FCD535", dash: "", label: "Linear Multi-Agent" },
            adversarial_mas: { stroke: "#0ECB81", dash: "", label: "Adversarial MAS (Ours)" }
        };

        const gridSteps = 4;
        const gridLines = [];
        for (let i = 0; i <= gridSteps; i++) {
            const yVal = minVal + (range * (i / gridSteps));
            const yPos = height - padY - (i / gridSteps) * chartH;
            gridLines.push(
                <g key={i}>
                    <line x1={padX} y1={yPos} x2={width - 25} y2={yPos} stroke={isDark ? "#2B313A" : "#EAECEF"} strokeWidth="1" strokeDasharray="2,2" />
                    <text x={padX - 8} y={yPos + 3} textAnchor="end" fill="#848E9C" className="text-[9px] font-mono">${yVal.toFixed(0)}</text>
                </g>
            );
        }

        return (
            <div className="w-full">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[620px] bg-[var(--bn-surface)] rounded-lg border border-[var(--bn-border)]">
                    {gridLines}
                    {keys.map(k => {
                        const m = models[k];
                        if (!m) return null;
                        const c = colors[k];
                        const pts = getPoints(m.equity_curve);
                        return (
                            <polyline
                                key={k}
                                fill="none"
                                stroke={c.stroke}
                                strokeWidth={k === 'adversarial_mas' ? "2.5" : "1.5"}
                                strokeDasharray={c.dash}
                                points={pts}
                            />
                        );
                    })}
                </svg>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs font-sans">
                    {keys.map(k => (
                        <div key={k} className="flex items-center gap-1.5">
                            <span className="w-3.5 h-1 inline-block rounded" style={{ backgroundColor: colors[k].stroke }}></span>
                            <span className="text-[var(--bn-text-secondary)] font-medium">{colors[k].label}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const generateLatex = () => {
        if (!results || !results.models) return "";
        const m = results.models;
        return `\\begin{table}[ht]
\\centering
\\small
\\caption{Ablation Study: Multi-Agent Architectures vs. Benchmarks on \\texttt{${results.ticker}} (${results.period})}
\\label{tab:ablation_${results.ticker.toLowerCase()}}
\\begin{tabular}{lcccccc}
\\toprule
\\textbf{Model Architecture} & \\textbf{Return (\\%)} & \\textbf{Sharpe} & \\textbf{Sortino} & \\textbf{MaxDD (\\%)} & \\textbf{Win Rate (\\%)} & \\textbf{Alpha (\\%)} \\\\
\\midrule
Benchmark (Buy \\& Hold) & ${m.benchmark?.metrics?.total_return_pct}\\% & ${m.benchmark?.metrics?.sharpe_ratio} & ${m.benchmark?.metrics?.sortino_ratio} & ${m.benchmark?.metrics?.max_drawdown_pct}\\% & ${m.benchmark?.metrics?.win_rate_pct}\\% & --- \\\\
Single Monolithic Agent & ${m.single_agent?.metrics?.total_return_pct}\\% & ${m.single_agent?.metrics?.sharpe_ratio} & ${m.single_agent?.metrics?.sortino_ratio} & ${m.single_agent?.metrics?.max_drawdown_pct}\\% & ${m.single_agent?.metrics?.win_rate_pct}\\% & ${m.single_agent?.metrics?.alpha}\\% \\\\
Linear MAS & ${m.linear_mas?.metrics?.total_return_pct}\\% & ${m.linear_mas?.metrics?.sharpe_ratio} & ${m.linear_mas?.metrics?.sortino_ratio} & ${m.linear_mas?.metrics?.max_drawdown_pct}\\% & ${m.linear_mas?.metrics?.win_rate_pct}\\% & ${m.linear_mas?.metrics?.alpha}\\% \\\\
\\textbf{Adversarial MAS (Ours)} & \\textbf{${m.adversarial_mas?.metrics?.total_return_pct}\\%} & \\textbf{${m.adversarial_mas?.metrics?.sharpe_ratio}} & \\textbf{${m.adversarial_mas?.metrics?.sortino_ratio}} & \\textbf{${m.adversarial_mas?.metrics?.max_drawdown_pct}\\%} & \\textbf{${m.adversarial_mas?.metrics?.win_rate_pct}\\%} & \\textbf{${m.adversarial_mas?.metrics?.alpha}\\%} \\\\
\\bottomrule
\\end{tabular}
\\end{table}`;
    };

    const copyLatex = () => {
        const code = generateLatex();
        navigator.clipboard.writeText(code);
        setCopiedLatex(true);
        setTimeout(() => setCopiedLatex(false), 2500);
    };

    const m = results?.models || {};

    return (
        <div className="space-y-5">
            {/* Control Bar */}
            <div className="bn-panel p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--bn-border)] pb-4 mb-4">
                    <div>
                        <h2 className="text-sm font-bold text-[var(--bn-text)] flex items-center gap-2">
                            <span className="text-[#FCD535]">🔬</span> Empirical Multi-Agent Ablation Benchmarks
                        </h2>
                        <p className="text-xs text-[var(--bn-text-secondary)] mt-1">
                            Evaluate 4 architectural paradigms under identical historical market conditions.
                        </p>
                    </div>

                    <button
                        onClick={copyLatex}
                        disabled={!results}
                        className={`bn-btn-secondary text-xs flex items-center gap-1.5 ${copiedLatex ? 'bg-[#0ECB81] text-black font-bold' : ''}`}
                    >
                        {copiedLatex ? "✓ LaTeX Copied" : "📄 Export LaTeX Table"}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                        <label className="text-xs font-medium text-[var(--bn-text-secondary)] block mb-1">Trading Asset</label>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            placeholder="BTC-USD, ETH-USD, AAPL..."
                            className="w-full px-3 py-1.5 text-xs font-mono"
                        />
                        <div className="flex flex-wrap gap-1 mt-2">
                            {quickTickers.map(t => (
                                <button
                                    key={t}
                                    onClick={() => { setTicker(t); runBacktest(t, period); }}
                                    className={`bn-badge ${ticker === t ? 'active' : ''}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="text-xs font-medium text-[var(--bn-text-secondary)] block mb-1">Lookback Window</label>
                        <div className="grid grid-cols-4 gap-1">
                            {periods.map(p => (
                                <button
                                    key={p}
                                    onClick={() => { setPeriod(p); runBacktest(ticker, p); }}
                                    className={`py-1.5 text-xs font-medium rounded border text-center transition-colors ${period === p ? 'bg-[var(--bn-primary)] text-[var(--bn-primary-text)] font-bold border-[var(--bn-primary)]' : 'border-[var(--bn-border)] text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)]'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="text-xs font-medium text-[var(--bn-text-secondary)] block mb-1">Simulation Capital ($)</label>
                        <input
                            type="number"
                            value={capital}
                            onChange={(e) => setCapital(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs font-mono"
                        />
                    </div>

                    <div className="md:col-span-2 flex items-end">
                        <button
                            onClick={() => runBacktest()}
                            disabled={loading}
                            className="w-full bn-btn-primary py-2 text-xs font-bold uppercase"
                        >
                            {loading ? "Simulating..." : "Run Test"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-[#F6465D] bg-opacity-10 border border-[#F6465D] rounded text-[#F6465D] text-xs">
                        Error: {error}
                    </div>
                )}
            </div>

            {/* Chart Panel */}
            <div className="bn-panel p-5">
                <div className="flex justify-between items-center border-b border-[var(--bn-border)] pb-3 mb-4">
                    <h3 className="text-xs font-bold text-[var(--bn-text)]">
                        Comparative Cumulative Portfolio Returns
                    </h3>
                    <span className="text-xs font-mono text-[var(--bn-text-secondary)]">
                        Asset: <strong className="text-[var(--bn-text)]">{results?.ticker || ticker}</strong> | Period: <strong className="text-[var(--bn-text)]">{results?.period || period}</strong>
                    </span>
                </div>
                {loading ? (
                    <div className="h-48 flex items-center justify-center font-sans text-xs text-[var(--bn-text-secondary)] animate-pulse">
                        Simulating parallel execution paths over historical market candles...
                    </div>
                ) : (
                    renderChart()
                )}
            </div>

            {/* Scorecard Table */}
            <div className="bn-panel p-5">
                <div className="border-b border-[var(--bn-border)] pb-3 mb-4">
                    <h3 className="text-xs font-bold text-[var(--bn-text)]">
                        Model Performance Comparison (Academic Econometrics)
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="border-b border-[var(--bn-border)] text-[var(--bn-text-secondary)] text-[11px]">
                                <th className="py-2.5">Architecture</th>
                                <th className="py-2.5">Type</th>
                                <th className="py-2.5">Return (%)</th>
                                <th className="py-2.5">Sharpe (Rf=4%)</th>
                                <th className="py-2.5">Sortino</th>
                                <th className="py-2.5">Max Drawdown</th>
                                <th className="py-2.5">Calmar</th>
                                <th className="py-2.5">Win Rate</th>
                                <th className="py-2.5">Alpha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--bn-border)]">
                            <tr>
                                <td className="py-3 text-[var(--bn-text)] font-medium">Benchmark (Buy & Hold)</td>
                                <td className="py-3 text-[var(--bn-text-secondary)]">Passive Baseline</td>
                                <td className={`py-3 font-bold ${(m.benchmark?.metrics?.total_return_pct || 0) >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                                    {m.benchmark?.metrics?.total_return_pct}%
                                </td>
                                <td className="py-3 font-mono">{m.benchmark?.metrics?.sharpe_ratio}</td>
                                <td className="py-3 font-mono">{m.benchmark?.metrics?.sortino_ratio}</td>
                                <td className="py-3 font-mono text-[#F6465D]">{m.benchmark?.metrics?.max_drawdown_pct}%</td>
                                <td className="py-3 font-mono">{m.benchmark?.metrics?.calmar_ratio}</td>
                                <td className="py-3 font-mono">{m.benchmark?.metrics?.win_rate_pct}%</td>
                                <td className="py-3 text-[var(--bn-text-secondary)]">---</td>
                            </tr>
                            <tr>
                                <td className="py-3 text-[#FF7A45] font-medium">Single Baseline Agent</td>
                                <td className="py-3 text-[var(--bn-text-secondary)]">Technical Heuristic</td>
                                <td className={`py-3 font-bold ${(m.single_agent?.metrics?.total_return_pct || 0) >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                                    {m.single_agent?.metrics?.total_return_pct}%
                                </td>
                                <td className="py-3 font-mono">{m.single_agent?.metrics?.sharpe_ratio}</td>
                                <td className="py-3 font-mono">{m.single_agent?.metrics?.sortino_ratio}</td>
                                <td className="py-3 font-mono text-[#F6465D]">{m.single_agent?.metrics?.max_drawdown_pct}%</td>
                                <td className="py-3 font-mono">{m.single_agent?.metrics?.calmar_ratio}</td>
                                <td className="py-3 font-mono">{m.single_agent?.metrics?.win_rate_pct}%</td>
                                <td className="py-3 font-mono text-[var(--bn-primary)]">{m.single_agent?.metrics?.alpha}%</td>
                            </tr>
                            <tr>
                                <td className="py-3 text-[var(--bn-primary)] font-medium">Linear Multi-Agent</td>
                                <td className="py-3 text-[var(--bn-text-secondary)]">Sequential Pipeline</td>
                                <td className={`py-3 font-bold ${(m.linear_mas?.metrics?.total_return_pct || 0) >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                                    {m.linear_mas?.metrics?.total_return_pct}%
                                </td>
                                <td className="py-3 font-mono">{m.linear_mas?.metrics?.sharpe_ratio}</td>
                                <td className="py-3 font-mono">{m.linear_mas?.metrics?.sortino_ratio}</td>
                                <td className="py-3 font-mono text-[#F6465D]">{m.linear_mas?.metrics?.max_drawdown_pct}%</td>
                                <td className="py-3 font-mono">{m.linear_mas?.metrics?.calmar_ratio}</td>
                                <td className="py-3 font-mono">{m.linear_mas?.metrics?.win_rate_pct}%</td>
                                <td className="py-3 font-mono text-[var(--bn-primary)]">{m.linear_mas?.metrics?.alpha}%</td>
                            </tr>
                            <tr className="bg-[var(--bn-surface)] font-semibold border-l-2 border-[#0ECB81]">
                                <td className="py-3 text-[#0ECB81] font-bold flex items-center gap-1.5">
                                    <span>★</span> Adversarial MAS (Ours)
                                </td>
                                <td className="py-3 text-[#0ECB81]">Debate + CVaR / Kelly</td>
                                <td className={`py-3 font-extrabold ${(m.adversarial_mas?.metrics?.total_return_pct || 0) >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                                    {m.adversarial_mas?.metrics?.total_return_pct}%
                                </td>
                                <td className="py-3 font-mono text-[#0ECB81]">{m.adversarial_mas?.metrics?.sharpe_ratio}</td>
                                <td className="py-3 font-mono text-[#0ECB81]">{m.adversarial_mas?.metrics?.sortino_ratio}</td>
                                <td className="py-3 font-mono text-[#0ECB81]">{m.adversarial_mas?.metrics?.max_drawdown_pct}%</td>
                                <td className="py-3 font-mono text-[#0ECB81]">{m.adversarial_mas?.metrics?.calmar_ratio}</td>
                                <td className="py-3 font-mono text-[#0ECB81]">{m.adversarial_mas?.metrics?.win_rate_pct}%</td>
                                <td className="py-3 font-mono text-[#0ECB81]">+{m.adversarial_mas?.metrics?.alpha}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Institutional Risk Metrics */}
            {results?.asset_quant_risk && (
                <div className="bn-panel p-5">
                    <div className="border-b border-[var(--bn-border)] pb-3 mb-4">
                        <h3 className="text-xs font-bold text-[var(--bn-text)]">
                            Asset Tail Risk & Volatility Matrix
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
                        <div className="bg-[var(--bn-surface)] p-3 rounded-lg border border-[var(--bn-border)]">
                            <span className="text-[var(--bn-text-secondary)] text-[10px] block font-sans">VaR (95%)</span>
                            <span className="text-[var(--bn-text)] font-bold text-sm">{results.asset_quant_risk.var_95}%</span>
                        </div>
                        <div className="bg-[var(--bn-surface)] p-3 rounded-lg border border-[var(--bn-border)]">
                            <span className="text-[var(--bn-text-secondary)] text-[10px] block font-sans">VaR (99%)</span>
                            <span className="text-[#FF7A45] font-bold text-sm">{results.asset_quant_risk.var_99}%</span>
                        </div>
                        <div className="bg-[var(--bn-surface)] p-3 rounded-lg border border-[var(--bn-border)]">
                            <span className="text-[var(--bn-text-secondary)] text-[10px] block font-sans">CVaR Tail Loss (95%)</span>
                            <span className="text-[#F6465D] font-bold text-sm">{results.asset_quant_risk.cvar_95}%</span>
                        </div>
                        <div className="bg-[var(--bn-surface)] p-3 rounded-lg border border-[var(--bn-border)]">
                            <span className="text-[var(--bn-text-secondary)] text-[10px] block font-sans">CVaR Tail Loss (99%)</span>
                            <span className="text-[#F6465D] font-bold text-sm">{results.asset_quant_risk.cvar_99}%</span>
                        </div>
                        <div className="bg-[var(--bn-surface)] p-3 rounded-lg border border-[var(--bn-border)]">
                            <span className="text-[var(--bn-text-secondary)] text-[10px] block font-sans">Kelly Fraction (f*)</span>
                            <span className="text-[#0ECB81] font-bold text-sm">{results.asset_quant_risk.kelly_recommended_pct}%</span>
                        </div>
                        <div className="bg-[var(--bn-surface)] p-3 rounded-lg border border-[var(--bn-border)]">
                            <span className="text-[var(--bn-text-secondary)] text-[10px] block font-sans">Annualized Volatility</span>
                            <span className="text-[var(--bn-primary)] font-bold text-sm">{results.asset_quant_risk.volatility_annualized}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================================================
// 4. MAIN TRADING DASHBOARD
// ==========================================================================
function Dashboard({ operator, onSignOut }) {
    const strategyOptions = [
        { key: 'A', interval: '15m', period: '7d', name: 'Scalp (15m)', desc: '0.75% / 1.50% Risk' },
        { key: 'B', interval: '1h', period: '30d', name: 'Swing (1h)', desc: '1.00% / 2.00% Risk' },
        { key: 'C', interval: '4h', period: '60d', name: 'Swing (4h)', desc: '2.00% / 3.00% Risk' },
        { key: 'D', interval: '1d', period: '180d', name: 'Position (1D)', desc: '2.50% / 4.00% Risk' }
    ];

    const [activeStrat, setActiveStrat] = useState(strategyOptions[0]);
    const [activeTab, setActiveTab] = useState("desk"); // "desk" | "research"
    const [theme, setTheme] = useState(() => localStorage.getItem("bn_theme") || "dark");
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [ticker, setTicker] = useState("BTC-USD");
    const [searchInput, setSearchInput] = useState("BTC/USDT");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [priceData, setPriceData] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState("[System Ready] Multi-Agent Trading Engine online.\nSelect asset and click 'Analyze & Generate Signal' to begin.\n");
    const [decision, setDecision] = useState(null);
    const [trades, setTrades] = useState([]);
    const [utcTime, setUtcTime] = useState("");

    const profileRef = useRef(null);
    const searchContainerRef = useRef(null);

    // Synchronize Theme attribute
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("bn_theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Close profile & search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Telemetry clocks
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setUtcTime(now.toUTCString().replace("GMT", "UTC"));
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch live market candle data
    const fetchChart = async (customTicker = ticker, customStrat = activeStrat) => {
        const raw = customTicker || ticker;
        if (!raw || !raw.trim()) return;
        try {
            const cleanTicker = resolveTickerInput(raw);
            const response = await fetch(`/api/price-chart?ticker=${encodeURIComponent(cleanTicker)}&period=${customStrat.period}&interval=${customStrat.interval}`);
            if (!response.ok) throw new Error("Fetch failed");
            const data = await response.json();
            setPriceData(data);
        } catch (e) {
            console.error("Failed to fetch price chart:", e);
        }
    };

    // Filter asset universe for autocomplete dropdown
    const filteredSuggestions = ASSET_UNIVERSE.filter(item => {
        if (!searchInput || !searchInput.trim()) return true;
        const q = searchInput.trim().toLowerCase();
        return (
            item.symbol.toLowerCase().includes(q) ||
            item.display.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.keywords.some(k => k.toLowerCase().includes(q))
        );
    }).slice(0, 8);

    const handleSelectSuggestion = (item) => {
        setTicker(item.symbol);
        setSearchInput(item.display);
        setShowSuggestions(false);
        fetchChart(item.symbol, activeStrat);
    };

    const handleSearchSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const resolved = resolveTickerInput(searchInput);
        setTicker(resolved);
        const item = ASSET_UNIVERSE.find(a => a.symbol === resolved);
        if (item) setSearchInput(item.display);
        setShowSuggestions(false);
        fetchChart(resolved, activeStrat);
    };

    const handleQuickSelect = (selTicker) => {
        const resolved = resolveTickerInput(selTicker);
        setTicker(resolved);
        const item = ASSET_UNIVERSE.find(a => a.symbol === resolved);
        setSearchInput(item ? item.display : resolved);
        setShowSuggestions(false);
        fetchChart(resolved, activeStrat);
    };

    // Retrieve user-scoped Trade History (Only for this specific user!)
    const fetchUserTrades = async () => {
        try {
            const token = sessionStorage.getItem("access_token");
            const emailParam = operator?.email ? `?user_email=${encodeURIComponent(operator.email)}` : "";
            const res = await fetch(`/api/history${emailParam}`, {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setTrades(data);
            }
        } catch (e) {
            console.error("Failed to fetch trade ledger:", e);
        }
    };

    useEffect(() => {
        fetchChart();
        fetchUserTrades();
    }, [activeStrat]);

    useEffect(() => {
        const poll = setInterval(() => {
            fetchChart();
        }, 15000);
        return () => clearInterval(poll);
    }, [ticker, activeStrat]);

    const handleExecute = async () => {
        const rawTarget = ticker || searchInput;
        if (!rawTarget || !rawTarget.trim()) {
            alert("Please enter a valid asset symbol or company name before analyzing.");
            return;
        }

        const targetTicker = resolveTickerInput(rawTarget);
        setTicker(targetTicker);

        setIsRunning(true);
        setDecision(null);
        
        let runLogs = `[Order Analysis Initialized] Asset: ${targetTicker} | Timeframe: ${activeStrat.interval}\n`;
        runLogs += `Fetching live market candle indicators from data feed...\n`;
        runLogs += `Running Adversarial Bull Advocate vs. Bear Skeptic debate...\n`;
        runLogs += `Calculating Value-at-Risk (VaR 95%), Tail Loss (CVaR), and Kelly allocation...\n`;
        runLogs += `Auditing trade safety against compliance rules...\n`;
        setLogs(runLogs);

        const payload = {
            ticker: targetTicker,
            interval: activeStrat.interval,
            period: activeStrat.period,
            strategy: activeStrat.name,
            user_name: operator.full_name,
            user_email: operator.email,
            user_phone: operator.mobile_number
        };

        try {
            const token = sessionStorage.getItem("access_token");
            const response = await fetch("/api/trade", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Trade analysis failed.");
            }

            setDecision(data);
            
            runLogs += `-------------------------------------------------------\n`;
            runLogs += `SIGNAL GENERATED:\n`;
            runLogs += `Asset Pair       : ${data.ticker}\n`;
            runLogs += `Signal Action    : ${data.action}\n`;
            runLogs += `Risk Verdict     : ${data.risk_status}\n`;
            runLogs += `Capital Budget   : ${data.budget_allocation}\n`;
            runLogs += `Entry Price      : ${data.ENTRY_PRICE > 0 ? '$' + data.ENTRY_PRICE.toFixed(2) : 'N/A'}\n`;
            runLogs += `Take Profit (TP) : ${data.TAKE_PROFIT > 0 ? '$' + data.TAKE_PROFIT.toFixed(2) : 'N/A'}\n`;
            runLogs += `Stop Loss (SL)   : ${data.STOP_LOSS > 0 ? '$' + data.STOP_LOSS.toFixed(2) : 'N/A'}\n`;
            runLogs += `Reasoning        : ${data.justification}\n`;
            setLogs(runLogs);

            fetchUserTrades();
            fetchChart(targetTicker, activeStrat);

        } catch (e) {
            runLogs += `\n[Error] Pipeline execution error: ${e.message}\n`;
            setLogs(runLogs);
            alert("Analysis failed. Please check logs for details.");
        } finally {
            setIsRunning(false);
        }
    };

    const quickBadges = [
        { label: "BTC/USDT", symbol: "BTC-USD" },
        { label: "ETH/USDT", symbol: "ETH-USD" },
        { label: "SOL/USDT", symbol: "SOL-USD" },
        { label: "AAPL", symbol: "AAPL" },
        { label: "NVDA", symbol: "NVDA" },
        { label: "GOLD", symbol: "GC=F" },
        { label: "CRUDE OIL", symbol: "CL=F" }
    ];

    const currentPrice = priceData?.candles && priceData.candles.length > 0 
        ? priceData.candles[priceData.candles.length - 1].close 
        : 0.0;

    return (
        <div className="min-h-screen flex flex-col justify-between p-4 md:p-6 bg-[var(--bn-bg)]">
            <div>
                {/* 1. TOP NAVBAR */}
                <header className="bn-panel px-4 py-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                    {/* Brand & Tabs */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#FCD535] flex items-center justify-center shadow-md shadow-[#FCD535]/30 ring-2 ring-[#FCD535]/40 flex-shrink-0">
                                <svg className="w-4.5 h-4.5 text-black fill-current stroke-black stroke-[0.5]" viewBox="0 0 24 24">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-black text-sm tracking-wide text-[var(--bn-text)] uppercase">
                                    FIN<span className="text-[#FCD535]">AGENTRA</span>
                                </span>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FCD535] bg-[#FCD535]/15 px-1.5 py-0.5 rounded border border-[#FCD535]/30">
                                    TERMINAL
                                </span>
                            </div>
                        </div>

                        <div className="hidden sm:inline-block h-5 w-[1px] bg-[var(--bn-border)]"></div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center gap-1 bg-[var(--bn-surface)] p-1 rounded-lg border border-[var(--bn-border)]">
                            <button
                                onClick={() => setActiveTab("desk")}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === 'desk' ? 'bg-[#FCD535] text-[#181A20] shadow' : 'text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)]'}`}
                            >
                                ⚡ Trade
                            </button>
                            <button
                                onClick={() => setActiveTab("research")}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${activeTab === 'research' ? 'bg-[#FCD535] text-[#181A20] shadow' : 'text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)]'}`}
                            >
                                🔬 Research & Backtest
                            </button>
                        </div>
                    </div>

                    {/* Right Controls: Market Status, UTC Clock, Theme Toggle, Profile Menu */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--bn-surface)] border border-[var(--bn-border)] text-[11px] font-mono text-[#0ECB81]">
                            <span className="w-2 h-2 rounded-full bg-[#0ECB81] animate-pulse"></span>
                            Live
                        </div>

                        <div className="text-[11px] font-mono text-[var(--bn-text-secondary)] hidden md:block">
                            {utcTime}
                        </div>

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-lg bg-[var(--bn-surface)] border border-[var(--bn-border)] text-[var(--bn-text-secondary)] hover:text-[#FCD535] transition-all text-sm flex items-center justify-center w-8 h-8"
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

                        {/* Profile Dropdown in Top-Right Corner */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setShowProfileMenu(prev => !prev)}
                                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--bn-surface)] border border-[var(--bn-border)] hover:border-[#FCD535] transition-all cursor-pointer"
                            >
                                <div className="w-6 h-6 rounded-full bg-[#FCD535] text-[#181A20] font-bold text-xs flex items-center justify-center">
                                    {(operator?.full_name || "U")[0].toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-[var(--bn-text)] max-w-[110px] truncate hidden sm:inline">
                                    {operator?.full_name || "Account"}
                                </span>
                                <span className="text-[10px] text-[var(--bn-text-secondary)]">▾</span>
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-64 bg-[var(--bn-card)] border border-[var(--bn-border)] rounded-lg shadow-2xl p-4 z-50 text-xs font-sans space-y-3">
                                    <div className="border-b border-[var(--bn-border)] pb-2.5">
                                        <div className="font-bold text-[var(--bn-text)] text-sm">{operator?.full_name}</div>
                                        <div className="text-[var(--bn-text-secondary)] text-[11px] truncate mt-0.5">{operator?.email}</div>
                                        <div className="text-[var(--bn-text-secondary)] text-[11px] mt-0.5">{operator?.mobile_number}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-[var(--bn-text-secondary)]">VIP Level:</span>
                                        <span className="text-[#FCD535] font-semibold bg-[#FCD535] bg-opacity-10 px-1.5 py-0.5 rounded">Regular (VIP 0)</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="text-[var(--bn-text-secondary)]">Status:</span>
                                        <span className="text-[#0ECB81] font-semibold">Verified</span>
                                    </div>
                                    <button
                                        onClick={onSignOut}
                                        className="w-full mt-2 py-1.5 rounded bg-[#F6465D] bg-opacity-10 hover:bg-opacity-20 text-[#F6465D] font-semibold transition-all text-center"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {activeTab === "research" ? (
                    <ResearchLabView operator={operator} isDark={theme === 'dark'} />
                ) : (
                    <div className="space-y-4">
                        {/* 2. MARKET ASSET BAR & SEARCH DOCK */}
                        <div className="bn-panel p-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center gap-3.5 flex-grow">
                                {/* Search Input Container with Dropdown */}
                                <div ref={searchContainerRef} className="relative flex items-center gap-2">
                                    <div className="relative flex items-center">
                                        {/* Search Magnifying Glass Icon */}
                                        <span className="absolute left-3 text-[var(--bn-text-secondary)] pointer-events-none">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </span>

                                        <input
                                            type="text"
                                            value={searchInput}
                                            onFocus={() => setShowSuggestions(true)}
                                            onChange={(e) => {
                                                setSearchInput(e.target.value);
                                                setShowSuggestions(true);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSearchSubmit();
                                                } else if (e.key === 'Escape') {
                                                    setShowSuggestions(false);
                                                }
                                            }}
                                            placeholder="Search asset, e.g. Bitcoin, AAPL, Gold..."
                                            className="pl-9 pr-8 py-2 text-xs font-semibold w-64 sm:w-80 md:w-96 rounded-lg bg-[var(--bn-surface)] border border-[var(--bn-border)] focus:border-[#FCD535] focus:outline-none focus:ring-2 focus:ring-[#FCD535]/30 transition-all text-[var(--bn-text)] placeholder-[var(--bn-text-secondary)]"
                                        />

                                        {/* Clear Button */}
                                        {searchInput && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchInput("");
                                                    setShowSuggestions(true);
                                                }}
                                                className="absolute right-2.5 text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)] p-0.5 rounded text-xs transition-colors"
                                                title="Clear search"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {/* Prominent High-Contrast Search Action Button */}
                                    <button
                                        onClick={handleSearchSubmit}
                                        className="px-4 py-2 text-xs font-bold rounded-lg bg-[#FCD535] hover:bg-[#F0B90B] text-black shadow-sm transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap cursor-pointer border border-[#FCD535]"
                                        title="Search and load asset chart"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-4.35-4.35m1.85-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span>Search</span>
                                    </button>

                                    {/* TradingView-Style Autocomplete Dropdown */}
                                    {showSuggestions && (
                                        <div className="absolute left-0 top-full mt-1.5 w-full sm:w-96 max-h-80 overflow-y-auto rounded-lg bg-[var(--bn-card)] border border-[var(--bn-border)] shadow-2xl z-50 py-1 divide-y divide-[var(--bn-border)]">
                                            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[var(--bn-text-secondary)] flex justify-between items-center bg-[var(--bn-surface)]">
                                                <span>Trading Directory</span>
                                                <span>{filteredSuggestions.length} Matches</span>
                                            </div>
                                            {filteredSuggestions.length > 0 ? (
                                                filteredSuggestions.map((item) => (
                                                    <div
                                                        key={item.symbol}
                                                        onMouseDown={() => handleSelectSuggestion(item)}
                                                        className={`px-3 py-2 hover:bg-[var(--bn-surface-hover)] cursor-pointer flex items-center justify-between transition-colors ${ticker === item.symbol ? 'bg-[var(--bn-surface-hover)]' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span className="font-mono font-bold text-xs text-[var(--bn-text)]">
                                                                {item.display}
                                                            </span>
                                                            <span className="text-xs text-[var(--bn-text-secondary)] truncate">
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="text-[10px] font-mono text-[var(--bn-text-secondary)] hidden sm:inline">
                                                                {item.symbol}
                                                            </span>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                                                item.category === 'Crypto' ? 'bg-[#FCD535]/15 text-[#FCD535]' :
                                                                item.category === 'Stock' ? 'bg-[#3861FB]/15 text-[#3861FB]' :
                                                                item.category === 'Commodity' ? 'bg-[#0ECB81]/15 text-[#0ECB81]' :
                                                                'bg-purple-500/15 text-purple-400'
                                                            }`}>
                                                                {item.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-3 py-3 text-xs text-[var(--bn-text-secondary)] text-center">
                                                    Press Search to query "{searchInput}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="hidden md:inline-block h-6 w-[1px] bg-[var(--bn-border)]"></div>

                                {/* Trending Watchlist Badges */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-[var(--bn-text-secondary)] mr-1 flex items-center gap-1">
                                        <span className="text-[#FCD535]">★</span> Trending:
                                    </span>
                                    {quickBadges.map(b => (
                                        <button
                                            key={b.symbol}
                                            onClick={() => handleQuickSelect(b.symbol)}
                                            className={`bn-badge ${ticker === b.symbol ? 'active font-bold' : ''}`}
                                        >
                                            {b.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Live Market Ticker Stats Box (Isolated Container) */}
                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-[var(--bn-surface)] px-4 py-2.5 rounded-lg border border-[var(--bn-border)] flex-shrink-0">
                                <div>
                                    <span className="text-[10px] text-[var(--bn-text-secondary)] block font-sans">Last Price</span>
                                    <span className={`font-bold text-sm ${((priceData?.price_change_pct ?? priceData?.delta) || 0) >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                                        ${currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-[var(--bn-text-secondary)] block font-sans">24h Change</span>
                                    <span className={`font-semibold ${((priceData?.price_change_pct ?? priceData?.delta) || 0) >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                                        {(() => {
                                            const pct = priceData?.price_change_pct !== undefined ? priceData.price_change_pct : priceData?.delta;
                                            if (pct === undefined || pct === null) return "0.00%";
                                            return pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`;
                                        })()}
                                    </span>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-[10px] text-[var(--bn-text-secondary)] block font-sans">24h High</span>
                                    <span className="text-[var(--bn-text)] font-medium">
                                        ${(priceData?.high || priceData?.high_24h) ? (priceData?.high || priceData?.high_24h).toFixed(2) : "0.00"}
                                    </span>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-[10px] text-[var(--bn-text-secondary)] block font-sans">24h Low</span>
                                    <span className="text-[var(--bn-text)] font-medium">
                                        ${(priceData?.low || priceData?.low_24h) ? (priceData?.low || priceData?.low_24h).toFixed(2) : "0.00"}
                                    </span>
                                </div>
                                <div className="hidden md:block">
                                    <span className="text-[10px] text-[var(--bn-text-secondary)] block font-sans">Volume</span>
                                    <span className="text-[var(--bn-text-secondary)]">
                                        {priceData?.volume ? priceData.volume.toLocaleString() : "0"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. TRADING MAIN GRID (8 / 4 Split) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                            
                            {/* LEFT AREA: CHART & ORDER PLACEMENT (8 Columns) */}
                            <div className="lg:col-span-8 space-y-4">
                                {/* Timeframe Selection Bar */}
                                <div className="bn-panel p-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-semibold text-[var(--bn-text-secondary)] mr-1">Timeframe:</span>
                                        {strategyOptions.map(strat => (
                                            <button
                                                key={strat.key}
                                                onClick={() => setActiveStrat(strat)}
                                                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${activeStrat.key === strat.key ? 'bg-[var(--bn-surface)] text-[var(--bn-primary)] border border-[var(--bn-primary)] shadow-sm' : 'text-[var(--bn-text-secondary)] hover:text-[var(--bn-text)]'}`}
                                            >
                                                {strat.name}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-[11px] font-mono text-[var(--bn-text-secondary)] hidden sm:block">
                                        Risk Bracket: <strong className="text-[var(--bn-primary)]">{activeStrat.desc}</strong>
                                    </div>
                                </div>

                                {/* Candlestick Chart */}
                                <CandlestickChart
                                    candles={priceData?.candles}
                                    decision={decision}
                                    ticker={ticker}
                                    strategyName={activeStrat.interval}
                                    isDark={theme === 'dark'}
                                />

                                {/* Order & Signal Execution Card */}
                                <div className="bn-panel p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--bn-border)] pb-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--bn-text)]">
                                                Trade Execution
                                            </h3>
                                            <span className="text-[11px] text-[var(--bn-text-secondary)]">
                                                Balance: <strong className="text-[#0ECB81] font-mono">$10,000.00 USDT</strong>
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-[var(--bn-text-secondary)] font-mono">
                                            Model: <strong className="text-[var(--bn-text)]">Adversarial Consensus + CVaR</strong>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                        <div className="bg-[var(--bn-surface)] p-2.5 rounded border border-[var(--bn-border)] text-xs">
                                            <span className="text-[var(--bn-text-secondary)] text-[10px] block">Selected Asset</span>
                                            <span className="font-bold text-[var(--bn-text)] font-mono">{ticker}</span>
                                        </div>
                                        <div className="bg-[var(--bn-surface)] p-2.5 rounded border border-[var(--bn-border)] text-xs">
                                            <span className="text-[var(--bn-text-secondary)] text-[10px] block">Execution Timeframe</span>
                                            <span className="font-bold text-[var(--bn-text)] font-mono">{activeStrat.name} ({activeStrat.interval})</span>
                                        </div>
                                        <div className="bg-[var(--bn-surface)] p-2.5 rounded border border-[var(--bn-border)] text-xs">
                                            <span className="text-[var(--bn-text-secondary)] text-[10px] block">Dynamic Risk Cap</span>
                                            <span className="font-bold text-[#FCD535] font-mono">{activeStrat.desc}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleExecute}
                                        disabled={isRunning}
                                        className="w-full bn-btn-primary py-3 text-sm font-bold uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {isRunning ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                                                Analyzing Market & Running Agents...
                                            </>
                                        ) : (
                                            <>
                                                <span>⚡</span> Analyze Market & Generate Signal
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* RIGHT AREA: STRATEGY SIGNAL & ACTIVITY LOGS (4 Columns) */}
                            <div className="lg:col-span-4 space-y-4">
                                
                                {/* Strategy Signal Output Card */}
                                <div className="bn-panel p-4 flex flex-col justify-between min-h-[280px]">
                                    <div className="border-b border-[var(--bn-border)] pb-2.5 mb-3">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--bn-text)] flex items-center justify-between">
                                            <span>Market Signal</span>
                                            {decision && (
                                                <span className={decision.risk_status === 'APPROVED' ? 'bn-tag-green' : 'bn-tag-red'}>
                                                    {decision.risk_status}
                                                </span>
                                            )}
                                        </h3>
                                    </div>

                                    {decision ? (
                                        <div className="space-y-3 text-xs">
                                            <div className="flex justify-between items-center bg-[var(--bn-surface)] p-2.5 rounded border border-[var(--bn-border)]">
                                                <span className="text-[var(--bn-text-secondary)]">Decision:</span>
                                                <span className={`font-bold font-mono text-sm ${decision.action.includes('BUY') ? 'text-[#0ECB81]' : (decision.action.includes('SELL') ? 'text-[#F6465D]' : 'text-[var(--bn-text)]')}`}>
                                                    {decision.action}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center bg-[var(--bn-surface)] p-2.5 rounded border border-[var(--bn-border)]">
                                                <span className="text-[var(--bn-text-secondary)]">Allocation:</span>
                                                <span className="font-semibold text-[var(--bn-text)] font-mono text-[11px]">{decision.budget_allocation}</span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                                                <div className="bg-[var(--bn-surface)] p-2 rounded border border-[var(--bn-border)]">
                                                    <span className="text-[9px] text-[var(--bn-text-secondary)] block font-sans">Entry</span>
                                                    <span className="font-bold text-[var(--bn-primary)] text-xs">
                                                        {decision.ENTRY_PRICE > 0 ? '$' + decision.ENTRY_PRICE.toFixed(2) : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="bg-[var(--bn-surface)] p-2 rounded border border-[var(--bn-border)]">
                                                    <span className="text-[9px] text-[var(--bn-text-secondary)] block font-sans">Take Profit</span>
                                                    <span className="font-bold text-[#0ECB81] text-xs">
                                                        {decision.TAKE_PROFIT > 0 ? '$' + decision.TAKE_PROFIT.toFixed(2) : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="bg-[var(--bn-surface)] p-2 rounded border border-[var(--bn-border)]">
                                                    <span className="text-[9px] text-[var(--bn-text-secondary)] block font-sans">Stop Loss</span>
                                                    <span className="font-bold text-[#F6465D] text-xs">
                                                        {decision.STOP_LOSS > 0 ? '$' + decision.STOP_LOSS.toFixed(2) : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantitative Risk Layer */}
                                            {decision.var_95 !== undefined && decision.var_95 !== null && (
                                                <div className="grid grid-cols-3 gap-1 bg-[var(--bn-surface)] p-2 rounded border border-[var(--bn-border)] text-[10px] font-mono text-center">
                                                    <div>
                                                        <span className="text-[var(--bn-text-secondary)] text-[9px] block font-sans">VaR (95%)</span>
                                                        <span className="text-[#FF7A45] font-bold">{decision.var_95}%</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[var(--bn-text-secondary)] text-[9px] block font-sans">CVaR (95%)</span>
                                                        <span className="text-[#F6465D] font-bold">{decision.cvar_95}%</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-[var(--bn-text-secondary)] text-[9px] block font-sans">Kelly Size</span>
                                                        <span className="text-[#0ECB81] font-bold">{decision.kelly_recommended_pct}%</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Debate Perspectives */}
                                            {decision.debate_summary && (
                                                <div className="bg-[var(--bn-surface)] p-2.5 rounded border border-[var(--bn-border)] space-y-1.5 text-[10px]">
                                                    <div className="flex justify-between items-center border-b border-[var(--bn-border)] pb-1">
                                                        <span className="text-[var(--bn-text-secondary)] font-semibold uppercase">Multi-Agent Debate:</span>
                                                        <span className="text-[#0ECB81] font-bold font-mono">{(decision.debate_summary.consensus_score * 100).toFixed(0)}% Conviction</span>
                                                    </div>
                                                    {decision.debate_summary.bull_perspective?.argument && (
                                                        <div className="text-[#0ECB81] leading-tight">
                                                            <strong className="text-[var(--bn-text)] font-sans">Bull:</strong> {decision.debate_summary.bull_perspective.argument}
                                                        </div>
                                                    )}
                                                    {decision.debate_summary.bear_perspective?.argument && (
                                                        <div className="text-[#F6465D] leading-tight">
                                                            <strong className="text-[var(--bn-text)] font-sans">Bear:</strong> {decision.debate_summary.bear_perspective.argument}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="pt-2 text-[10px] text-[var(--bn-text-secondary)] border-t border-[var(--bn-border)] leading-relaxed">
                                                <strong className="text-[var(--bn-text)] block mb-0.5">Summary:</strong>
                                                {decision.justification}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-[var(--bn-text-secondary)] text-xs my-auto py-8">
                                            {isRunning ? "Running Multi-Agent Quantitative Pipeline..." : "Awaiting Market Analysis"}
                                        </div>
                                    )}
                                </div>

                                {/* Execution Terminal Logs */}
                                <div className="bn-panel p-4 flex flex-col justify-between h-[230px]">
                                    <div className="border-b border-[var(--bn-border)] pb-2 mb-2 flex items-center justify-between">
                                        <span className="text-xs font-bold text-[var(--bn-text)]">
                                            Terminal Activity Log
                                        </span>
                                        <span className="text-[10px] font-mono text-[var(--bn-text-secondary)]">
                                            Autonomous Desk
                                        </span>
                                    </div>
                                    <pre className="flex-grow font-mono text-[10px] text-[#0ECB81] overflow-y-auto bg-[var(--bn-surface)] p-3 rounded leading-relaxed whitespace-pre-wrap select-all border border-[var(--bn-border)]">
                                        {logs}
                                    </pre>
                                </div>

                            </div>
                        </div>

                        {/* 4. USER TRADE HISTORY TABLE (Scoped strictly to this user!) */}
                        <div className="bn-panel p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--bn-border)] pb-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--bn-text)]">
                                        Trade History
                                    </h3>
                                    <span className="text-[11px] text-[var(--bn-text-secondary)]">
                                        (Account: <strong className="text-[var(--bn-text)]">{operator?.full_name}</strong>)
                                    </span>
                                </div>
                                <button 
                                    onClick={fetchUserTrades}
                                    className="bn-btn-secondary text-[11px] py-1"
                                >
                                    Refresh History
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto max-h-[260px]">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[var(--bn-border)] text-[var(--bn-text-secondary)] uppercase text-[10px]">
                                            <th className="py-2.5">Time (UTC)</th>
                                            <th className="py-2.5">Pair</th>
                                            <th className="py-2.5">Side / Action</th>
                                            <th className="py-2.5">Risk Audit</th>
                                            <th className="py-2.5">Capital</th>
                                            <th className="py-2.5">Allocation</th>
                                            <th className="py-2.5">Entry</th>
                                            <th className="py-2.5">Take Profit</th>
                                            <th className="py-2.5">Stop Loss</th>
                                            <th className="py-2.5">Outcome / Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--bn-border)] font-mono text-[11px]">
                                        {trades.length === 0 ? (
                                            <tr>
                                                <td colSpan="10" className="py-8 text-center text-[var(--bn-text-secondary)] font-sans">
                                                    No trades found for this account. Execute an order analysis to record signals.
                                                </td>
                                            </tr>
                                        ) : (
                                            trades.map(r => {
                                                const formattedDate = new Date(r.timestamp).toISOString().replace("T", " ").slice(0, 19);
                                                
                                                let statusColor = "text-[var(--bn-text-secondary)]";
                                                const st = (r.status || "").toLowerCase();
                                                if (st.includes("profit")) statusColor = "text-[#0ECB81] font-bold";
                                                else if (st.includes("loss")) statusColor = "text-[#F6465D] font-bold";
                                                else if (st.includes("running")) statusColor = "text-[#FCD535] font-semibold animate-pulse";
                                                
                                                return (
                                                    <tr key={r.id} className="hover:bg-[var(--bn-surface)] transition-colors">
                                                        <td className="py-2.5 text-[var(--bn-text-secondary)]">{formattedDate}</td>
                                                        <td className="py-2.5 font-bold text-[var(--bn-text)]">{r.ticker}</td>
                                                        <td className="py-2.5">
                                                            <span className={r.action.includes('BUY') ? 'bn-tag-green' : (r.action.includes('SELL') ? 'bn-tag-red' : 'bn-tag-neutral')}>
                                                                {r.action}
                                                            </span>
                                                        </td>
                                                        <td className={`py-2.5 font-bold ${r.risk_status === 'APPROVED' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                                                            {r.risk_status}
                                                        </td>
                                                        <td className="py-2.5 text-[var(--bn-text)]">{r.stable_capital}</td>
                                                        <td className="py-2.5 text-[var(--bn-primary)]">{r.budget_allocation}</td>
                                                        <td className="py-2.5 text-[var(--bn-text)]">
                                                            {r.entry_price && r.entry_price !== '0.0' && r.entry_price !== '0' ? '$' + parseFloat(r.entry_price).toFixed(2) : 'N/A'}
                                                        </td>
                                                        <td className="py-2.5 text-[#0ECB81]">
                                                            {r.take_profit && r.take_profit !== '0.0' && r.take_profit !== '0' ? '$' + parseFloat(r.take_profit).toFixed(2) : 'N/A'}
                                                        </td>
                                                        <td className="py-2.5 text-[#F6465D]">
                                                            {r.stop_loss && r.stop_loss !== '0.0' && r.stop_loss !== '0' ? '$' + parseFloat(r.stop_loss).toFixed(2) : 'N/A'}
                                                        </td>
                                                        <td className={`py-2.5 ${statusColor}`}>
                                                            {r.status || "RUNNING"}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="mt-6 pt-3 border-t border-[var(--bn-border)] text-center text-xs text-[var(--bn-text-secondary)] flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                    FinAgentra Multi-Agent Trading System &copy; 2026. All rights reserved.
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                    <span>Security: Provable Bounded Risk</span>
                    <span>•</span>
                    <span>Execution: Asynchronous Multi-Agent</span>
                </div>
            </footer>
        </div>
    );
}

// ==========================================================================
// 5. ROOT APPLICATION COMPONENT
// ==========================================================================
function App() {
    const [operator, setOperator] = useState(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("active_operator");
        if (stored) {
            try {
                setOperator(JSON.parse(stored));
            } catch (e) {
                console.error("Session decode warning:", e);
            }
        }
    }, []);

    const handleLoginSuccess = (op) => {
        setOperator(op);
    };

    const handleSignOut = () => {
        sessionStorage.removeItem("active_operator");
        sessionStorage.removeItem("access_token");
        setOperator(null);
    };

    if (!operator) {
        return <AuthPortal onLoginSuccess={handleLoginSuccess} />;
    }

    return <Dashboard operator={operator} onSignOut={handleSignOut} />;
}

// Mount to DOM
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

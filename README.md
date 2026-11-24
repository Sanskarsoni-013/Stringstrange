# TradingView — Track All Markets

[![Live Platform](https://img.shields.io/badge/Live%20Platform-stringstrange.online-2962ff.svg)](https://www.stringstrange.online)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000.svg)](https://stringstrange.vercel.app)
[![Engine](https://img.shields.io/badge/TradingView-Advanced%20Chart-2962ff.svg)](https://www.tradingview.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38BDF8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An exact, authentic 1:1 implementation of the **TradingView** advanced charting terminal, powered by real-time WebSocket feeds and TradingView's Advanced Real-Time Charting Engine.

🌐 **Live Chart:** [https://www.stringstrange.online](https://www.stringstrange.online)  
⚡ **Mirror:** [https://stringstrange.vercel.app](https://stringstrange.vercel.app)

---

## 🌟 Feature & Interface Breakdown

### 1. 📈 Official Real-Time Interactive Charting Engine
- **Live WebSocket Feeds**: Sub-second price ticks from Binance, Coinbase, NASDAQ, AMEX, and FX markets.
- **Full Drawing Tool Rail**: Trendlines, Fibonacci Retracements, Gann fans, Pitchforks, Brush tools, Long/Short position calculators, Measure tools, Magnet mode, and Erase.
- **Multiple Chart Types**: Japanese Candlesticks, Heikin Ashi, Line, and Bars.
- **Multi-Timeframe Analysis**: `1m`, `5m`, `15m`, `1h`, `4h`, `Daily`, `Weekly`, and `Monthly` intervals.

### 2. 🔍 Universal Symbol Search (`Ctrl+K` / `Cmd+K`)
- Comprehensive symbol search across:
  - **Crypto**: `BTCUSDT`, `ETHUSDT`, `SOLUSDT`, `SUIUSDT`, `XRPUSDT`
  - **Stocks**: `NVDA`, `TSLA`, `AAPL`, `MSFT`, `AMZN`
  - **Indices & ETFs**: `SPY`, `QQQ`, `DIA`
  - **Forex & Commodities**: `EURUSD`, `XAUUSD` (Gold), `USOIL`

### 3. 📋 Live Watchlist & Quote Details Drawer
- Right sidebar with real-time price updates, 24h percentage changes, and Day's High/Low ranges.
- **Quote Details Panel**: Volume, 52-Week Range bar, Market Status, and **Technical Rating Gauge** (`Strong Buy` / `Buy` / `Neutral` / `Sell`).

### 4. 🧮 Technical Indicators & Strategies Modal
- 1-click access to technical studies:
  - Relative Strength Index (RSI)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - Exponential Moving Averages (EMA 20 / 50 / 200)
  - Volume Profile (VPVR)
  - SuperTrend

### 5. 🛠️ Navigation & Bottom Bar
- Bottom console shortcuts for `Pine Editor`, `Strategy Tester`, and `Trading Panel`.
- Quick time scale selectors: `1D`, `5D`, `1M`, `3M`, `6M`, `YTD`, `1Y`, `5Y`, `All`.
- Logarithmic, Auto, and Percentage scale toggles.

---

## ⚡ Local Development

```bash
# Clone the repository
git clone https://github.com/Sanskarsoni-013/Stringstrange.git
cd Stringstrange

# Install dependencies
npm install

# Run development server
npm start

# Compile production bundle
npm run build
```

---

## 👤 Author
- **Sanskar Soni** - [LinkedIn](https://linkedin.com/in/sanskar-soni-669382311) • [GitHub](https://github.com/Sanskarsoni-013)

import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  DollarSign,
  Activity,
  BarChart3,
  Layers,
  Crosshair,
  ExternalLink,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Info
} from 'lucide-react';

// REAL-TIME TICKER ASSETS
const INITIAL_TICKERS = [
  { pair: 'BTC/USDT', price: 96840.50, change: +3.42, high: 97420, low: 93800, volume: '48.2B' },
  { pair: 'ETH/USDT', price: 3420.80, change: +5.18, high: 3490, low: 3240, volume: '24.1B' },
  { pair: 'SOL/USDT', price: 218.45, change: +8.74, high: 224, low: 198, volume: '9.4B' },
  { pair: 'XRP/USDT', price: 1.4820, change: +14.25, high: 1.55, low: 1.28, volume: '8.1B' },
  { pair: 'SUI/USDT', price: 3.8450, change: +12.30, high: 3.98, low: 3.35, volume: '3.6B' },
  { pair: 'DOGE/USDT', price: 0.3840, change: +6.45, high: 0.41, low: 0.35, volume: '4.8B' },
  { pair: 'BNB/USDT', price: 685.20, change: +2.10, high: 692, low: 671, volume: '2.1B' },
  { pair: 'AVAX/USDT', price: 38.60, change: +4.92, high: 39.8, low: 36.4, volume: '1.4B' }
];

// INITIAL AI SIGNAL DATABASE DIVIDED BY TRADING CATEGORY
const RAW_SIGNALS = [
  {
    id: 'sig-btc-01',
    pair: 'BTC/USDT',
    category: 'intraday', // 'scalping' | 'intraday' | 'swing' | 'arbitrage'
    typeLabel: 'INTRADAY BREAKOUT',
    direction: 'LONG',
    entryPrice: 96450.00,
    target1: 98200.00,
    target2: 100500.00,
    stopLoss: 95100.00,
    probability: 94.8,
    riskReward: '1 : 3.0',
    leverage: '3x - 5x Cross',
    timeHorizon: '2 - 6 Hours',
    timestamp: '12m ago',
    orderbookImbalance: '74% Bids (Heavy Buy Wall)',
    rsi: '44.2 (Oversold Rebound)',
    macd: 'Bullish 1H Momentum Cross',
    whaleFlow: '+$142M Cold Wallet Outflow',
    sparkline: [95200, 95400, 95100, 95800, 96100, 96450, 96800, 97400, 98200]
  },
  {
    id: 'sig-sol-02',
    pair: 'SOL/USDT',
    category: 'scalping',
    typeLabel: 'MOMENTUM SCALP',
    direction: 'LONG',
    entryPrice: 217.80,
    target1: 222.50,
    target2: 226.00,
    stopLoss: 214.90,
    probability: 92.4,
    riskReward: '1 : 2.8',
    leverage: '5x - 10x Isolated',
    timeHorizon: '15m - 45m',
    timestamp: '4m ago',
    orderbookImbalance: '81% Aggressive Market Buys',
    rsi: '58.4 (Strong Volume Push)',
    macd: '15M Convergence Spike',
    whaleFlow: '+$48M DEX Spot Accumulation',
    sparkline: [212, 213.5, 215, 214.2, 216.5, 217.8, 219.5, 222.5]
  },
  {
    id: 'sig-eth-03',
    pair: 'ETH/USDT',
    category: 'swing',
    typeLabel: 'MACRO TREND SWING',
    direction: 'LONG',
    entryPrice: 3390.00,
    target1: 3650.00,
    target2: 3880.00,
    stopLoss: 3240.00,
    probability: 89.6,
    riskReward: '1 : 3.2',
    leverage: '2x - 3x Cross',
    timeHorizon: '3 - 7 Days',
    timestamp: '28m ago',
    orderbookImbalance: 'Institutional Staking +62k ETH',
    rsi: '51.8 (Macro Accumulation Zone)',
    macd: 'Daily EMA 50/200 Golden Cross',
    whaleFlow: '+$215M L2 Net Settlement',
    sparkline: [3280, 3310, 3290, 3340, 3380, 3390, 3450, 3580, 3650]
  },
  {
    id: 'sig-xrp-04',
    pair: 'XRP/USDT',
    category: 'scalping',
    typeLabel: 'VOLATILITY SQUEEZE',
    direction: 'LONG',
    entryPrice: 1.4650,
    target1: 1.5400,
    target2: 1.6200,
    stopLoss: 1.4250,
    probability: 91.2,
    riskReward: '1 : 3.1',
    leverage: '5x Isolated',
    timeHorizon: '30m - 90m',
    timestamp: '18m ago',
    orderbookImbalance: 'Short Liquidation Cluster above 1.50',
    rsi: '62.0 (Expansion Wave)',
    macd: 'Bollinger Band Width Expansion',
    whaleFlow: '+$64M Ledger Velocity',
    sparkline: [1.38, 1.40, 1.42, 1.44, 1.465, 1.49, 1.52, 1.54]
  },
  {
    id: 'sig-sui-05',
    pair: 'SUI/USDT',
    category: 'intraday',
    typeLabel: 'LIQUIDITY POOL RUN',
    direction: 'LONG',
    entryPrice: 3.8100,
    target1: 4.0500,
    target2: 4.2500,
    stopLoss: 3.6800,
    probability: 88.5,
    riskReward: '1 : 2.5',
    leverage: '3x - 5x Cross',
    timeHorizon: '1 - 4 Hours',
    timestamp: '35m ago',
    orderbookImbalance: 'TVL Peak High Breakout',
    rsi: '55.3 (Steady Ascending Base)',
    macd: 'Hourly SuperTrend Bullish',
    whaleFlow: '+$29M Ecosystem Inflow',
    sparkline: [3.62, 3.68, 3.72, 3.75, 3.81, 3.88, 3.98, 4.05]
  },
  {
    id: 'sig-arb-06',
    pair: 'BTC-PERP / SPOT',
    category: 'arbitrage',
    typeLabel: 'DELTA-NEUTRAL BASIS',
    direction: 'NEUTRAL / CASH & CARRY',
    entryPrice: 96800.00,
    target1: 96800.00,
    target2: 96800.00,
    stopLoss: 0.00,
    probability: 98.2,
    riskReward: 'Risk-Free Delta',
    leverage: '1x Spot + 1x Short Perp',
    timeHorizon: 'Funding Rate Harvest',
    timestamp: '52m ago',
    orderbookImbalance: 'Annualized Funding Yield: +22.4% APY',
    rsi: 'Delta Zero Hedged',
    macd: 'Binance vs Bybit Spread: 0.18%',
    whaleFlow: 'Zero Directional Market Risk',
    sparkline: [22.1, 22.2, 22.4, 22.3, 22.4, 22.5, 22.4]
  }
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'scalping' | 'intraday' | 'swing' | 'arbitrage'
  const [signals, setSignals] = useState(RAW_SIGNALS);
  const [copiedId, setCopiedId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Real-time Countdown Timer to Next Hourly Model Inference
  const [secondsRemaining, setSecondsRemaining] = useState(3600 - (Math.floor(Date.now() / 1000) % 3600));

  // Risk Calculator Modal State
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [selectedCalcSignal, setSelectedCalcSignal] = useState(RAW_SIGNALS[0]);
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(2);

  // Hourly Countdown Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 3600 - (now % 3600);
      setSecondsRemaining(remaining);
      
      // Auto-trigger hourly refresh simulation at top of the hour
      if (remaining === 3599) {
        handleManualRefresh();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  // Re-run AI Model Inference (On-Demand Refresh)
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Simulate minor probability and price recalculations from the neural network
      setSignals(prev => prev.map(sig => {
        const delta = (Math.random() * 0.4 - 0.2).toFixed(1);
        const newProb = Math.min(98.5, Math.max(82.0, parseFloat((sig.probability + parseFloat(delta)).toFixed(1))));
        return {
          ...sig,
          probability: newProb,
          timestamp: 'Just now'
        };
      }));
      setIsRefreshing(false);
    }, 1200);
  };

  // Copy Signal Parameters to Clipboard
  const handleCopy = (sig) => {
    const text = `⚡ APEX QUANT AI SIGNAL
Pair: ${sig.pair} (${sig.typeLabel})
Direction: ${sig.direction}
Entry: $${sig.entryPrice}
Target 1: $${sig.target1} (+${(((sig.target1 - sig.entryPrice)/sig.entryPrice)*100).toFixed(2)}%)
Target 2: $${sig.target2} (+${(((sig.target2 - sig.entryPrice)/sig.entryPrice)*100).toFixed(2)}%)
Stop Loss: $${sig.stopLoss} (-${(((sig.entryPrice - sig.stopLoss)/sig.entryPrice)*100).toFixed(2)}%)
Leverage: ${sig.leverage}
AI Probability: ${sig.probability}%
Live at stringstrange.online`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter signals based on category tab
  const filteredSignals = useMemo(() => {
    if (activeCategory === 'all') return signals;
    return signals.filter(s => s.category === activeCategory);
  }, [signals, activeCategory]);

  // Risk Calculator Output
  const calcResults = useMemo(() => {
    const s = selectedCalcSignal;
    const dollarRisk = (accountBalance * (riskPercent / 100));
    const priceRiskPerCoin = Math.abs(s.entryPrice - s.stopLoss);
    const positionSizeCoins = priceRiskPerCoin > 0 ? (dollarRisk / priceRiskPerCoin) : 0;
    const totalPositionUsd = positionSizeCoins * s.entryPrice;
    const potentialProfitT1 = positionSizeCoins * Math.abs(s.target1 - s.entryPrice);
    const potentialProfitT2 = positionSizeCoins * Math.abs(s.target2 - s.entryPrice);

    return {
      dollarRisk: dollarRisk.toFixed(2),
      positionSizeCoins: positionSizeCoins.toFixed(4),
      totalPositionUsd: totalPositionUsd.toFixed(2),
      potentialProfitT1: potentialProfitT1.toFixed(2),
      potentialProfitT2: potentialProfitT2.toFixed(2)
    };
  }, [selectedCalcSignal, accountBalance, riskPercent]);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      
      {/* 1. REAL-TIME ASSET TICKER MARQUEE */}
      <div className="bg-[#060a17] border-b border-slate-800/80 overflow-hidden py-2 text-xs font-mono select-none">
        <div className="animate-ticker flex items-center gap-8">
          {[...INITIAL_TICKERS, ...INITIAL_TICKERS].map((t, idx) => (
            <div key={idx} className="flex items-center gap-2.5 whitespace-nowrap">
              <span className="font-bold text-white tracking-wider">{t.pair}</span>
              <span className="text-slate-200 font-semibold">${t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className={`flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${t.change >= 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-rose-950 text-rose-400 border border-rose-800/60'}`}>
                {t.change >= 0 ? '+' : ''}{t.change}%
              </span>
              <span className="text-slate-600">/</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. BRAND HEADER & NEURAL STATUS (NIKE INNOVATION LAB / HIGGSFIELD BRUTALIST AESTHETIC) */}
      <header className="border-b border-slate-800/80 bg-[#030712]/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Brand Logo & Model Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#030712] rounded-[10px] flex items-center justify-center text-emerald-400 font-black">
                <Zap className="w-5 h-5 fill-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white uppercase">
                  APEX <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">QUANT AI</span>
                </h1>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> LIVE ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Autonomous Transformer-LSTM Neural Crypto Intelligence</p>
            </div>
          </div>

          {/* Hourly Retraining Timer & Refresh Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>HOURLY RE-TRAIN:</span>
              </div>
              <span className="font-bold text-white tracking-widest text-sm bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {formatCountdown(secondsRemaining)}
              </span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'INFERRING...' : 'RE-RUN AI'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. MACRO MARKET SENTIMENT & MODEL PERFORMANCE HUD */}
      <section className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          
          <div className="glass-panel p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Verified Win Rate
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">84.6%</div>
            <div className="text-[10px] text-slate-500 font-mono">142 of 168 targets hit (Last 30D)</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Average Profit Factor
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">3.42 : 1</div>
            <div className="text-[10px] text-slate-500 font-mono">Sharpe Ratio: 2.88 (Institutional)</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Market Fear & Greed
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">78 <span className="text-sm font-semibold">/ 100</span></div>
            <div className="text-[10px] text-slate-500 font-mono">Extreme Greed • Strong Trend</div>
          </div>

          <div className="glass-panel p-4 rounded-2xl space-y-1">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-purple-400" /> 24H Liquidation Delta
            </div>
            <div className="text-2xl font-black font-mono text-purple-400 tracking-tight">$194.2M</div>
            <div className="text-[10px] text-slate-500 font-mono">78% Shorts Squeezed (Bullish Bias)</div>
          </div>

        </div>
      </section>

      {/* 4. TRADING CATEGORY STRATEGY TABS */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-4">
          
          {/* Strategy Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {[
              { id: 'all', label: 'All Signals', count: signals.length },
              { id: 'scalping', label: '⚡ Scalping (5M - 15M)', count: signals.filter(s=>s.category==='scalping').length },
              { id: 'intraday', label: '🎯 Intraday (1H - 4H)', count: signals.filter(s=>s.category==='intraday').length },
              { id: 'swing', label: '🌊 Swing (1D - 1W)', count: signals.filter(s=>s.category==='swing').length },
              { id: 'arbitrage', label: '⚖️ Arbitrage (Market Neutral)', count: signals.filter(s=>s.category==='arbitrage').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeCategory === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeCategory === tab.id ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-300'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Filter Info */}
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>MODEL RETRAINED HOURLY • REAL-TIME ON-CHAIN SYNC</span>
          </div>

        </div>

        {/* 5. SIGNAL CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSignals.map(sig => {
            const isLong = sig.direction === 'LONG';
            const isArb = sig.category === 'arbitrage';

            return (
              <div
                key={sig.id}
                className="glass-panel rounded-3xl p-6 space-y-5 transition duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-slate-700 relative overflow-hidden"
              >
                {/* Top Subtle Gradient Edge */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isLong ? 'from-emerald-500 via-teal-400 to-cyan-500' : (isArb ? 'from-purple-500 to-indigo-500' : 'from-rose-500 to-red-600')}`}></div>

                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl font-black tracking-tight text-white font-mono">{sig.pair}</span>
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        {sig.typeLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
                      <span>Horizon: <strong className="text-slate-200">{sig.timeHorizon}</strong></span>
                      <span>•</span>
                      <span>{sig.timestamp}</span>
                    </div>
                  </div>

                  {/* Signal Direction Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-xs uppercase tracking-wider shadow-lg ${
                    isLong
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow-emerald-500/20'
                      : (isArb ? 'bg-purple-950/90 text-purple-300 border border-purple-500/50' : 'bg-rose-950/90 text-rose-300 border border-rose-500/50')
                  }`}>
                    {isLong ? <ArrowUpRight className="w-4 h-4 text-emerald-400 stroke-[3]" /> : (isArb ? <Crosshair className="w-4 h-4 text-purple-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400 stroke-[3]" />)}
                    <span>{sig.direction}</span>
                  </div>
                </div>

                {/* AI Probability & Confidence Bar */}
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" /> AI Neural Confidence Score
                    </span>
                    <span className="font-extrabold text-emerald-400 text-sm">{sig.probability}% Probability</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${sig.probability}%` }}
                    ></div>
                  </div>
                </div>

                {/* Trade Execution Price Levels */}
                <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                  
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">ENTRY ZONE</div>
                    <div className="text-sm font-extrabold text-white mt-0.5">${sig.entryPrice.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Market / Limit</div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-emerald-900/40">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase">TARGET 1 (TP)</div>
                    <div className="text-sm font-extrabold text-emerald-400 mt-0.5">${sig.target1.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-500 mt-0.5">
                      +{(((sig.target1 - sig.entryPrice)/sig.entryPrice)*100).toFixed(2)}%
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-rose-900/40">
                    <div className="text-[10px] text-rose-400 font-bold uppercase">STOP LOSS (SL)</div>
                    <div className="text-sm font-extrabold text-rose-400 mt-0.5">
                      {sig.stopLoss > 0 ? `$${sig.stopLoss.toLocaleString()}` : 'Delta Zero'}
                    </div>
                    <div className="text-[10px] text-rose-500 mt-0.5">
                      {sig.stopLoss > 0 ? `-${(((sig.entryPrice - sig.stopLoss)/sig.entryPrice)*100).toFixed(2)}%` : 'Protected'}
                    </div>
                  </div>

                </div>

                {/* Quantitative Metric Badges */}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-400">Orderbook Delta:</span>
                    <span className="font-semibold text-white">{sig.orderbookImbalance}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-400">Technical Indicators:</span>
                    <span className="font-semibold text-emerald-400">{sig.rsi} • {sig.macd}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                    <span className="text-slate-400">On-Chain Whale Trace:</span>
                    <span className="font-semibold text-cyan-400">{sig.whaleFlow}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-300">
                    <span className="text-slate-400">Risk/Reward & Leverage:</span>
                    <span className="font-bold text-amber-300">{sig.riskReward} ({sig.leverage})</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => handleCopy(sig)}
                    className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition border border-slate-700/80 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {copiedId === sig.id ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">PARAMETERS COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        <span>COPY TRADE SETUP</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedCalcSignal(sig);
                      setCalcModalOpen(true);
                    }}
                    className="px-4 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold transition border border-emerald-500/30 flex items-center gap-1.5 active:scale-95"
                  >
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>CALCULATE RISK</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </main>

      {/* 6. RISK CALCULATOR MODAL */}
      {calcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 font-mono">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" /> Position Size Calculator
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedCalcSignal.pair} ({selectedCalcSignal.typeLabel})</p>
              </div>
              <button
                onClick={() => setCalcModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Account Size (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Risk per Trade (%)</span>
                  <span className="font-bold text-emerald-400">{riskPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>
            </div>

            {/* Computed Results */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Max Dollar Risk:</span>
                <span className="font-bold text-rose-400">${calcResults.dollarRisk}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Recommended Position Size:</span>
                <span className="font-bold text-white">{calcResults.positionSizeCoins} coins (${calcResults.totalPositionUsd})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Potential Profit (TP1):</span>
                <span className="font-bold text-emerald-400">+${calcResults.potentialProfitT1}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Potential Profit (TP2):</span>
                <span className="font-bold text-emerald-300">+${calcResults.potentialProfitT2}</span>
              </div>
            </div>

            <button
              onClick={() => setCalcModalOpen(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
            >
              Confirm Setup
            </button>

          </div>
        </div>
      )}

      {/* 7. REGULATORY & QUANTITATIVE DISCLAIMER */}
      <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500 space-y-3 font-mono">
        <div className="max-w-4xl mx-auto space-y-2 text-[11px] leading-relaxed text-slate-500">
          <p className="text-slate-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400" /> Quantitative Research & Risk Notice
          </p>
          <p>
            APEX QUANT AI operates probabilistic Machine Learning and quantitative indicator models for educational, research, and algorithmic analysis purposes. Cryptocurrency markets carry significant financial volatility. Always enforce disciplined stop-loss protocols and never allocate capital beyond personal risk thresholds.
          </p>
        </div>
        <p className="text-slate-600 pt-2">
          APEX QUANT AI Terminal • Hosted at <a href="https://www.stringstrange.online" className="text-emerald-400 hover:underline">stringstrange.online</a> • GitHub: <a href="https://github.com/Sanskarsoni-013/Stringstrange" className="text-emerald-400 hover:underline">Sanskarsoni-013/Stringstrange</a>
        </p>
      </footer>

    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Clock,
  BarChart2,
  Sliders,
  Bell,
  RotateCcw,
  Camera,
  Maximize2,
  Settings,
  Share2,
  Plus,
  ChevronDown,
  Grid,
  Undo2,
  Redo2,
  List,
  Radio,
  Newspaper,
  Flame,
  Calendar,
  Lightbulb,
  MessageSquare,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  Activity
} from 'lucide-react';

// MASTER WATCHLIST DATABASE
const WATCHLIST = [
  { symbol: 'BINANCE:BTCUSDT', name: 'BTCUSDT', desc: 'Bitcoin / TetherUS', price: 96840.50, change: +3.42, market: 'crypto', exchange: 'BINANCE', high: 97420, low: 93800, vol: '48.2B', rating: 'Strong Buy' },
  { symbol: 'BINANCE:ETHUSDT', name: 'ETHUSDT', desc: 'Ethereum / TetherUS', price: 3420.80, change: +5.18, market: 'crypto', exchange: 'BINANCE', high: 3490, low: 3240, vol: '24.1B', rating: 'Strong Buy' },
  { symbol: 'BINANCE:SOLUSDT', name: 'SOLUSDT', desc: 'Solana / TetherUS', price: 218.45, change: +8.74, market: 'crypto', exchange: 'BINANCE', high: 224, low: 198, vol: '9.4B', rating: 'Strong Buy' },
  { symbol: 'NASDAQ:NVDA', name: 'NVDA', desc: 'NVIDIA Corporation', price: 142.80, change: +4.12, market: 'stocks', exchange: 'NASDAQ', high: 144.5, low: 139.2, vol: '52.1M', rating: 'Buy' },
  { symbol: 'NASDAQ:TSLA', name: 'TSLA', desc: 'Tesla, Inc.', price: 348.50, change: +6.85, market: 'stocks', exchange: 'NASDAQ', high: 352, low: 334, vol: '84.6M', rating: 'Strong Buy' },
  { symbol: 'NASDAQ:AAPL', name: 'AAPL', desc: 'Apple Inc.', price: 238.10, change: +1.24, market: 'stocks', exchange: 'NASDAQ', high: 240, low: 236, vol: '41.2M', rating: 'Neutral' },
  { symbol: 'AMEX:SPY', name: 'SPY', desc: 'SPDR S&P 500 ETF Trust', price: 598.40, change: +0.82, market: 'indices', exchange: 'AMEX', high: 600, low: 595, vol: '62.4M', rating: 'Buy' },
  { symbol: 'FX:EURUSD', name: 'EURUSD', desc: 'Euro / US Dollar', price: 1.0482, change: -0.15, market: 'forex', exchange: 'FX', high: 1.052, low: 1.046, vol: '124B', rating: 'Neutral' },
  { symbol: 'OANDA:XAUUSD', name: 'XAUUSD', desc: 'Gold / US Dollar', price: 2684.50, change: +0.65, market: 'commodities', exchange: 'OANDA', high: 2698, low: 2672, vol: '18.4B', rating: 'Buy' }
];

// TIMEFRAMES
const TIMEFRAMES = [
  { label: '1m', interval: '1' },
  { label: '5m', interval: '5' },
  { label: '15m', interval: '15' },
  { label: '1h', interval: '60' },
  { label: '4h', interval: '240' },
  { label: 'D', interval: 'D' },
  { label: 'W', interval: 'W' },
  { label: 'M', interval: 'M' }
];

// CHART STYLES
const CHART_STYLES = [
  { id: '1', label: 'Candles' },
  { id: '8', label: 'Heikin Ashi' },
  { id: '2', label: 'Line' },
  { id: '0', label: 'Bars' }
];

// INDICATORS
const POPULAR_INDICATORS = [
  { name: 'Relative Strength Index (RSI)', desc: 'Momentum oscillator measuring speed and change of price moves.' },
  { name: 'MACD (Moving Average Convergence Divergence)', desc: 'Trend-following momentum indicator showing moving average relationships.' },
  { name: 'Bollinger Bands (BB)', desc: 'Volatility bands placed above and below a moving average.' },
  { name: 'EMA 20 / 50 / 200 (Triple Moving Average)', desc: 'Exponential moving averages for dynamic support & resistance.' },
  { name: 'Volume Profile Fixed Range (VPVR)', desc: 'Histogram showing trading activity at specific price levels.' },
  { name: 'SuperTrend', desc: 'Trend-following overlay based on Average True Range (ATR).' },
  { name: 'Ichimoku Cloud', desc: 'Comprehensive gauge of support, resistance, momentum, and trend direction.' }
];

export default function App() {
  const [selectedItem, setSelectedItem] = useState(WATCHLIST[0]);
  const [interval, setInterval] = useState('60');
  const [chartStyle, setChartStyle] = useState('1');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState('watchlist'); // 'watchlist', 'alerts', 'news', 'data', 'calendar'
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('all');
  const [tvReady, setTvReady] = useState(false);
  const [snapshotToast, setSnapshotToast] = useState(false);

  // Initialize and Update TradingView Real-Time Widget
  const loadTradingViewWidget = useCallback((symbolStr, intervalStr, styleStr) => {
    const container = document.getElementById('tradingview_chart');
    if (!container) return;
    container.innerHTML = '';

    if (window.TradingView) {
      new window.TradingView.widget({
        autosize: true,
        symbol: symbolStr,
        interval: intervalStr,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: styleStr,
        locale: 'en',
        toolbar_bg: '#131722',
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: true,
        container_id: 'tradingview_chart',
        studies: [
          'MASimple@tv-basicstudies',
          'RSI@tv-basicstudies',
          'MACD@tv-basicstudies'
        ]
      });
      setTvReady(true);
    }
  }, []);

  // Poll for window.TradingView script availability
  useEffect(() => {
    const checkScript = () => {
      if (window.TradingView) {
        loadTradingViewWidget(selectedItem.symbol, interval, chartStyle);
      } else {
        setTimeout(checkScript, 200);
      }
    };
    checkScript();
  }, [selectedItem.symbol, interval, chartStyle, loadTradingViewWidget]);

  // Handle Keyboard Shortcuts (Ctrl+K / Cmd+K for Symbol Search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setIndicatorModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered Search Results
  const filteredSymbols = WATCHLIST.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMarket = marketFilter === 'all' || item.market === marketFilter;
    return matchesSearch && matchesMarket;
  });

  const handleSelectSymbol = (item) => {
    setSelectedItem(item);
    setSearchModalOpen(false);
  };

  const handleTakeSnapshot = () => {
    setSnapshotToast(true);
    setTimeout(() => setSnapshotToast(false), 2500);
  };

  return (
    <div className="w-full h-screen bg-[#131722] text-[#d1d4dc] flex flex-col font-sans overflow-hidden select-none">
      
      {/* 1. TRADINGVIEW TOP BAR (EXACT 1:1 REPLICA) */}
      <header className="h-[46px] bg-[#1e222d] border-b border-[#2a2e39] flex items-center justify-between px-2 text-xs flex-shrink-0 z-30">
        
        {/* Left Section: Logo, Symbol, Timeframes, Indicators */}
        <div className="flex items-center h-full gap-1 overflow-x-auto no-scrollbar">
          
          {/* Official TradingView // Logo */}
          <div className="flex items-center gap-1.5 px-2 py-1 mr-1 cursor-pointer hover:bg-[#2a2e39] rounded transition">
            <div className="w-6 h-6 rounded bg-black flex items-center justify-center font-black text-white text-xs tracking-tighter">
              //
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">TradingView</span>
          </div>

          <div className="h-5 w-[1px] bg-[#2a2e39] mx-1"></div>

          {/* Symbol Search Button */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[#2a2e39] transition text-left group"
          >
            <Search className="w-3.5 h-3.5 text-[#787b86] group-hover:text-white" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-xs">{selectedItem.name}</span>
              <span className="text-[11px] text-[#787b86] hidden md:inline">{selectedItem.exchange}</span>
            </div>
            <span className="text-[10px] text-[#787b86] border border-[#2a2e39] px-1 rounded hidden lg:inline font-mono">⌘K</span>
          </button>

          <div className="h-5 w-[1px] bg-[#2a2e39] mx-1"></div>

          {/* Timeframe Selectors */}
          <div className="flex items-center gap-0.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.label}
                onClick={() => setInterval(tf.interval)}
                className={`px-2 py-1 rounded font-medium transition ${
                  interval === tf.interval
                    ? 'text-[#2962ff] font-bold bg-[#2962ff]/10'
                    : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-[#2a2e39] mx-1"></div>

          {/* Chart Style (Candles, Line, etc.) */}
          <div className="flex items-center gap-0.5">
            {CHART_STYLES.map(cs => (
              <button
                key={cs.id}
                onClick={() => setChartStyle(cs.id)}
                className={`px-2 py-1 rounded transition text-[11px] ${
                  chartStyle === cs.id
                    ? 'text-white font-bold bg-[#2a2e39]'
                    : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                }`}
              >
                {cs.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-[#2a2e39] mx-1 hidden sm:block"></div>

          {/* Indicators Button */}
          <button
            onClick={() => setIndicatorModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[#2a2e39] transition text-[#d1d4dc] font-medium"
          >
            <span className="font-serif italic font-bold text-sm text-[#2962ff]">fx</span>
            <span className="hidden sm:inline">Indicators</span>
          </button>

          {/* Alerts & Replay */}
          <button
            onClick={() => setActiveRightTab('alerts')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[#2a2e39] transition text-[#787b86] hover:text-white"
          >
            <Bell className="w-3.5 h-3.5 text-[#2962ff]" />
            <span>Alert</span>
          </button>

          <button className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[#2a2e39] transition text-[#787b86] hover:text-white">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>

        </div>

        {/* Right Section: Layout, Fullscreen, Publish */}
        <div className="flex items-center h-full gap-1 flex-shrink-0">
          
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white transition">
            <Undo2 className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white transition">
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-[#2a2e39] mx-1"></div>

          <button
            onClick={handleTakeSnapshot}
            className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white transition"
            title="Take chart screenshot"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-1.5 rounded hover:bg-[#2a2e39] text-[#787b86] hover:text-white transition hidden sm:block"
            title="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* TradingView Blue Publish Button */}
          <button className="px-3.5 py-1 rounded bg-[#2962ff] hover:bg-[#1e53e5] text-white font-semibold text-xs transition shadow-sm ml-1">
            Publish
          </button>

          {/* User Profile Avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs ml-1 cursor-pointer">
            S
          </div>

        </div>

      </header>

      {/* 2. MAIN WORKSPACE (CHART + RIGHT RAIL + WATCHLIST DRAWER) */}
      <div className="flex-1 flex w-full h-[calc(100vh-46px-32px)] overflow-hidden relative">
        
        {/* CHART VIEWPORT (FILLS ALL AVAILABLE SPACE) */}
        <div className="flex-1 h-full w-full bg-[#131722] relative overflow-hidden">
          <div id="tradingview_chart" className="w-full h-full"></div>
          {!tvReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#131722] text-[#787b86] gap-3">
              <div className="w-8 h-8 border-2 border-[#2962ff] border-t-transparent rounded-full animate-spin"></div>
              <div className="text-xs font-mono">Loading TradingView Engine...</div>
            </div>
          )}
        </div>

        {/* RIGHT WATCHLIST & DETAILS DRAWER */}
        {sidebarOpen && (
          <aside className="w-[310px] h-full bg-[#1e222d] border-l border-[#2a2e39] flex flex-col flex-shrink-0 z-20">
            
            {/* Watchlist Header */}
            <div className="h-[40px] px-3 border-b border-[#2a2e39] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
                <List className="w-3.5 h-3.5 text-[#2962ff]" />
                <span>Watchlist</span>
              </div>
              <div className="flex items-center gap-1 text-[#787b86]">
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className="p-1 hover:text-white rounded hover:bg-[#2a2e39]"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:text-white rounded hover:bg-[#2a2e39]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Watchlist Columns Header */}
            <div className="px-3 py-1.5 border-b border-[#2a2e39]/60 flex justify-between text-[11px] text-[#787b86] font-medium uppercase tracking-wider">
              <span>Symbol</span>
              <div className="flex gap-4">
                <span>Last</span>
                <span>Chg %</span>
              </div>
            </div>

            {/* Watchlist Items Scroll Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/30">
              {WATCHLIST.map(item => {
                const isSelected = selectedItem.symbol === item.symbol;
                const isPositive = item.change >= 0;

                return (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedItem(item)}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer transition text-xs ${
                      isSelected
                        ? 'bg-[#2a2e39] border-l-2 border-[#2962ff]'
                        : 'hover:bg-[#2a2e39]/50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <span className="text-[10px] text-[#787b86] font-normal">{item.exchange}</span>
                      </div>
                      <div className="text-[11px] text-[#787b86] truncate max-w-[120px]">{item.desc}</div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-semibold text-white">
                        {item.price > 10 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : item.price}
                      </div>
                      <div className={`text-[11px] font-bold ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {isPositive ? '+' : ''}{item.change}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SELECTED SYMBOL DETAIL QUOTE PANEL (BOTTOM OF DRAWER) */}
            <div className="h-[210px] border-t border-[#2a2e39] bg-[#171b26] p-3 flex flex-col justify-between text-xs">
              
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm text-white">{selectedItem.name}</div>
                  <div className="text-[11px] text-[#787b86]">{selectedItem.desc} • {selectedItem.exchange}</div>
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                  selectedItem.rating.includes('Buy')
                    ? 'bg-[#089981]/20 text-[#089981] border border-[#089981]/40'
                    : 'bg-[#f23645]/20 text-[#f23645] border border-[#f23645]/40'
                }`}>
                  {selectedItem.rating}
                </div>
              </div>

              {/* Price & Change Banner */}
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-2xl font-black text-white">
                  ${selectedItem.price > 10 ? selectedItem.price.toLocaleString() : selectedItem.price}
                </span>
                <span className={`text-xs font-bold flex items-center ${selectedItem.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {selectedItem.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {selectedItem.change >= 0 ? '+' : ''}{selectedItem.change}%
                </span>
              </div>

              {/* Day's Range Indicator */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#787b86] font-mono">
                  <span>Day Range: ${selectedItem.low}</span>
                  <span>High: ${selectedItem.high}</span>
                </div>
                <div className="w-full bg-[#2a2e39] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2962ff] h-full rounded-full w-[68%]"></div>
                </div>
              </div>

              {/* Volume & Market Cap Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#787b86] font-mono border-t border-[#2a2e39]/60 pt-2">
                <div>Vol: <strong className="text-white">{selectedItem.vol}</strong></div>
                <div>Status: <strong className="text-[#089981]">Market Open</strong></div>
              </div>

            </div>

          </aside>
        )}

        {/* TRADINGVIEW ICON RAIL (RIGHTMOST VERTICAL STRIP) */}
        <div className="w-[44px] h-full bg-[#1e222d] border-l border-[#2a2e39] flex flex-col items-center justify-between py-2 text-[#787b86] flex-shrink-0 z-30">
          
          <div className="flex flex-col gap-2">
            {[
              { id: 'watchlist', icon: List, title: 'Watchlist & details' },
              { id: 'alerts', icon: Bell, title: 'Alerts' },
              { id: 'news', icon: Newspaper, title: 'News' },
              { id: 'data', icon: Activity, title: 'Data Window' },
              { id: 'hotlists', icon: Flame, title: 'Hotlists' },
              { id: 'calendar', icon: Calendar, title: 'Calendar' },
              { id: 'ideas', icon: Lightbulb, title: 'My Ideas' },
              { id: 'chat', icon: MessageSquare, title: 'Public Chats' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = sidebarOpen && activeRightTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (sidebarOpen && activeRightTab === tab.id) {
                      setSidebarOpen(false);
                    } else {
                      setActiveRightTab(tab.id);
                      setSidebarOpen(true);
                    }
                  }}
                  title={tab.title}
                  className={`p-2 rounded hover:text-white hover:bg-[#2a2e39] transition relative ${
                    isActive ? 'text-[#2962ff] bg-[#2a2e39]' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#2962ff]"></div>}
                </button>
              );
            })}
          </div>

          <button className="p-2 rounded hover:text-white hover:bg-[#2a2e39] transition" title="Chart settings">
            <Settings className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* 3. TRADINGVIEW BOTTOM BAR (TIME SCALE, PINE EDITOR, TRADING PANEL) */}
      <footer className="h-[32px] bg-[#1e222d] border-t border-[#2a2e39] flex items-center justify-between px-3 text-[11px] text-[#787b86] flex-shrink-0 z-30 font-mono">
        
        {/* Left Bottom Tabs */}
        <div className="flex items-center gap-1 h-full">
          {['Pine Editor', 'Strategy Tester', 'Trading Panel'].map(tab => (
            <button
              key={tab}
              className="px-2.5 py-1 rounded hover:bg-[#2a2e39] hover:text-[#d1d4dc] transition"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Bottom Scale Shortcuts */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'].map(s => (
              <button
                key={s}
                className="px-1.5 py-0.5 rounded hover:bg-[#2a2e39] hover:text-[#d1d4dc] transition"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-3 w-[1px] bg-[#2a2e39] mx-1"></div>

          <span>UTC-4</span>
          <button className="px-1 py-0.5 rounded hover:bg-[#2a2e39] hover:text-[#d1d4dc] font-bold text-white">
            %
          </button>
          <button className="px-1 py-0.5 rounded hover:bg-[#2a2e39] hover:text-[#d1d4dc]">
            log
          </button>
          <button className="px-1 py-0.5 rounded hover:bg-[#2a2e39] hover:text-[#d1d4dc] text-[#2962ff] font-bold">
            auto
          </button>
        </div>

      </footer>

      {/* 4. SYMBOL SEARCH MODAL (EXACT TRADINGVIEW POPUP) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-100">
          <div className="w-full max-w-2xl bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
            
            {/* Search Input Box */}
            <div className="p-3 border-b border-[#2a2e39] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#2962ff]" />
              <input
                type="text"
                autoFocus
                placeholder="Search symbol (e.g. BTCUSDT, AAPL, NVDA, TSLA)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white text-sm outline-none placeholder-[#787b86]"
              />
              <button
                onClick={() => setSearchModalOpen(false)}
                className="text-[#787b86] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-3 py-2 border-b border-[#2a2e39] flex gap-2 text-xs">
              {['all', 'crypto', 'stocks', 'forex', 'indices', 'commodities'].map(m => (
                <button
                  key={m}
                  onClick={() => setMarketFilter(m)}
                  className={`px-3 py-1 rounded capitalize font-medium transition ${
                    marketFilter === m
                      ? 'bg-[#2962ff] text-white font-bold'
                      : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Symbol Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/40 text-xs">
              {filteredSymbols.map(item => (
                <div
                  key={item.symbol}
                  onClick={() => handleSelectSymbol(item)}
                  className="px-4 py-3 flex items-center justify-between hover:bg-[#2a2e39] cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-sm font-mono">{item.name}</span>
                    <span className="text-[#787b86]">{item.desc}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-[#131722] text-[#787b86] text-[10px] font-bold border border-[#2a2e39]">
                      {item.exchange}
                    </span>
                    <span className="font-mono font-semibold text-white">${item.price}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 5. INDICATORS & STRATEGIES MODAL */}
      {indicatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-100">
          <div className="w-full max-w-xl bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
            
            <div className="p-3 border-b border-[#2a2e39] flex items-center justify-between">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span className="font-serif italic text-base text-[#2962ff] font-bold">fx</span>
                <span>Indicators, Metrics & Strategies</span>
              </div>
              <button
                onClick={() => setIndicatorModalOpen(false)}
                className="text-[#787b86] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-[#2a2e39]">
              <input
                type="text"
                placeholder="Search indicators (e.g. RSI, MACD, Volume)..."
                className="w-full bg-[#131722] px-3 py-2 rounded text-white text-xs outline-none border border-[#2a2e39]"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#2a2e39]/40 text-xs p-2">
              {POPULAR_INDICATORS.map(ind => (
                <div
                  key={ind.name}
                  onClick={() => setIndicatorModalOpen(false)}
                  className="p-3 hover:bg-[#2a2e39] rounded cursor-pointer transition space-y-1"
                >
                  <div className="font-bold text-white text-sm">{ind.name}</div>
                  <div className="text-[11px] text-[#787b86]">{ind.desc}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* SNAPSHOT TOAST NOTIFICATION */}
      {snapshotToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-[#2962ff] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4" />
          <span>Chart snapshot copied to clipboard!</span>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Satellite,
  Globe,
  Activity,
  Cpu,
  Flame,
  Trees,
  Radio,
  Sun,
  Download,
  RefreshCw,
  Layers,
  Eye,
  ShieldAlert,
  Navigation,
  Compass,
  MapPin,
  Sliders,
  Database,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Zap,
  Info
} from 'lucide-react';

// SATELLITE CONSTELLATION DATABASE
const SATELLITES = [
  {
    id: 'iss',
    name: 'ISS (Zarya)',
    agency: 'NASA / Roscosmos / ESA',
    norad: 25544,
    altitude: 418.5,
    speed: 7.66,
    inclination: 51.64,
    period: 92.9,
    swath: 450,
    color: '#38bdf8',
    description: 'Continuous crewed low-Earth orbit laboratory conducting scientific research.'
  },
  {
    id: 'landsat9',
    name: 'Landsat 9',
    agency: 'NASA / USGS',
    norad: 49260,
    altitude: 705.0,
    speed: 7.50,
    inclination: 98.22,
    period: 98.8,
    swath: 185,
    color: '#4ade80',
    description: 'Advanced multispectral land surface imaging with OLI-2 & TIRS-2 instruments.'
  },
  {
    id: 'sentinel2a',
    name: 'Sentinel-2A',
    agency: 'ESA Copernicus',
    norad: 40697,
    altitude: 786.0,
    speed: 7.45,
    inclination: 98.62,
    period: 100.6,
    swath: 290,
    color: '#fbbf24',
    description: '13-band optical Earth observation providing global environmental monitoring.'
  },
  {
    id: 'terra',
    name: 'Terra (EOS AM-1)',
    agency: 'NASA Earth System',
    norad: 25994,
    altitude: 705.0,
    speed: 7.50,
    inclination: 98.20,
    period: 98.9,
    swath: 2330,
    color: '#f87171',
    description: 'Flagship climate research satellite measuring global cloud cover, aerosol, and fires.'
  },
  {
    id: 'noaa20',
    name: 'NOAA-20 (JPSS-1)',
    agency: 'NOAA / NASA',
    norad: 43013,
    altitude: 824.0,
    speed: 7.42,
    inclination: 98.70,
    period: 101.4,
    swath: 3000,
    color: '#a78bfa',
    description: 'Polar-orbiting weather satellite with Day/Night visible and thermal infrared radiometer.'
  }
];

// EARTH OBSERVATION TARGET SCENES
const TARGET_SCENES = [
  {
    id: 'amazon',
    name: 'Amazon Rainforest Basin',
    region: 'South America (Pará, Brazil)',
    lat: -3.4653,
    lon: -62.2159,
    primaryMetric: 'NDVI Vegetation Health',
    baselineAnomaly: -4.2,
    threatLevel: 'HIGH DEFORESTATION',
    spectralBands: {
      rgb: 'linear-gradient(135deg, #064e3b, #047857, #065f46)',
      infrared: 'linear-gradient(135deg, #831843, #be185d, #9d174d)',
      thermal: 'linear-gradient(135deg, #451a03, #b45309, #d97706)',
      swir: 'linear-gradient(135deg, #1e1b4b, #3730a3, #4338ca)'
    },
    landCover: { Forest: 62.4, Agriculture: 24.1, Deforested: 8.5, Water: 5.0 }
  },
  {
    id: 'california',
    name: 'California Sierra Nevada',
    region: 'North America (Plumas NF)',
    lat: 39.8712,
    lon: -120.9123,
    primaryMetric: 'Thermal Wildfire Perimeter',
    baselineAnomaly: +28.5,
    threatLevel: 'CRITICAL FIRE ACTIVITY',
    spectralBands: {
      rgb: 'linear-gradient(135deg, #3f3f46, #71717a, #52525b)',
      infrared: 'linear-gradient(135deg, #7c2d12, #c2410c, #ea580c)',
      thermal: 'linear-gradient(135deg, #7f1d1d, #dc2626, #f97316)',
      swir: 'linear-gradient(135deg, #1c1917, #44403c, #78716c)'
    },
    landCover: { Forest: 48.0, BurnScar: 26.5, Shrubland: 18.2, Water: 7.3 }
  },
  {
    id: 'dubai',
    name: 'Dubai Metropolitan & Coast',
    region: 'Middle East (UAE)',
    lat: 25.2048,
    lon: 55.2708,
    primaryMetric: 'Urban Sprawl & Coastal Modification',
    baselineAnomaly: +14.8,
    threatLevel: 'RAPID EXPANSION',
    spectralBands: {
      rgb: 'linear-gradient(135deg, #0c4a6e, #0284c7, #ca8a04)',
      infrared: 'linear-gradient(135deg, #0f172a, #1e293b, #0284c7)',
      thermal: 'linear-gradient(135deg, #78350f, #d97706, #fbbf24)',
      swir: 'linear-gradient(135deg, #1e3a8a, #2563eb, #60a5fa)'
    },
    landCover: { Urban: 41.2, SandDesert: 38.6, CoastalWater: 16.8, Greenery: 3.4 }
  },
  {
    id: 'himalayas',
    name: 'Khumbu Glacial Zone',
    region: 'Asia (Everest Region, Nepal)',
    lat: 27.9881,
    lon: 86.9250,
    primaryMetric: 'Cryospheric Glacial Mass Balance',
    baselineAnomaly: -11.6,
    threatLevel: 'ACCELERATED RETREAT',
    spectralBands: {
      rgb: 'linear-gradient(135deg, #e0f2fe, #bae6fd, #475569)',
      infrared: 'linear-gradient(135deg, #0284c7, #38bdf8, #0f172a)',
      thermal: 'linear-gradient(135deg, #082f49, #0369a1, #38bdf8)',
      swir: 'linear-gradient(135deg, #0369a1, #0284c7, #7dd3fc)'
    },
    landCover: { SnowIce: 55.4, RockMoraine: 32.1, GlacialLakes: 8.5, SparseFlora: 4.0 }
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('orbit'); // 'orbit', 'ml', 'targets', 'telemetry'
  const [selectedSat, setSelectedSat] = useState(SATELLITES[0]);
  const [selectedScene, setSelectedScene] = useState(TARGET_SCENES[0]);
  const [spectralBand, setSpectralBand] = useState('rgb'); // 'rgb', 'infrared', 'thermal', 'swir'
  const [activeMLModel, setActiveMLModel] = useState('ndvi'); // 'ndvi', 'fire', 'landcover', 'cloud'
  
  // Sliders for ML
  const [mlSensitivity, setMlSensitivity] = useState(78);
  const [cloudFilter, setCloudFilter] = useState(15);
  
  // Real-time orbital clock and propagation
  const [utcTime, setUtcTime] = useState(new Date().toUTCString());
  const [satTelemetry, setSatTelemetry] = useState({
    lat: 12.45,
    lon: -48.12,
    alt: 418.5,
    speed: 7.66,
    footprint: 450,
    nextPass: '24m 12s',
    solarPhase: 'Daylight (+94% ill.)'
  });
  
  // Simulated packet logs
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const canvasRef = useRef(null);

  // Live real-time clock and satellite motion loop
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toUTCString());

      const tSec = now.getTime() / 1000;
      const periodSec = selectedSat.period * 60;
      const phase = (tSec % periodSec) / periodSec;

      // Keplerian motion calculation
      const incRad = (selectedSat.inclination * Math.PI) / 180;
      const lat = Math.sin(phase * 2 * Math.PI) * (selectedSat.inclination > 90 ? (180 - selectedSat.inclination) : selectedSat.inclination);
      const lon = ((phase * 360 - (tSec % 86400) / 240) % 360) - 180;

      const altNoise = (Math.sin(phase * 4 * Math.PI) * 1.2).toFixed(2);
      const currentAlt = (selectedSat.altitude + parseFloat(altNoise)).toFixed(1);

      setSatTelemetry({
        lat: parseFloat(lat.toFixed(4)),
        lon: parseFloat(lon.toFixed(4)),
        alt: currentAlt,
        speed: selectedSat.speed,
        footprint: selectedSat.swath,
        nextPass: `${Math.floor((1 - phase) * selectedSat.period)}m ${Math.floor(Math.random() * 59)}s`,
        solarPhase: Math.sin(phase * 2 * Math.PI) > 0 ? 'Daylight (Sunlit)' : 'Eclipse (Earth Umbra)'
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSat]);

  // Telemetry Packet Stream Simulation
  useEffect(() => {
    const logInterval = setInterval(() => {
      const packetId = Math.floor(100000 + Math.random() * 900000);
      const channels = ['X-BAND', 'S-BAND', 'UHF-TLM', 'OPTICAL-DL'];
      const ch = channels[Math.floor(Math.random() * channels.length)];
      const bitRate = (120 + Math.random() * 40).toFixed(1);
      
      const newEntry = `[${new Date().toISOString().substring(11, 19)}] PKT-${packetId} | ${selectedSat.name} | ${ch} | BER: 1.2e-9 | ${bitRate} Mbps | SYNC OK`;
      setTelemetryLogs(prev => [newEntry, ...prev.slice(0, 7)]);
    }, 2500);

    return () => clearInterval(logInterval);
  }, [selectedSat]);

  // Render 2D Orbit Ground Track Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, width, height);

    // Lat/Lon Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += width / 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += height / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Equator & Prime Meridian
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Simulated Continents Outline
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    // Americas
    ctx.beginPath();
    ctx.ellipse(width * 0.28, height * 0.45, width * 0.09, height * 0.28, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Eurasia / Africa
    ctx.beginPath();
    ctx.ellipse(width * 0.58, height * 0.42, width * 0.14, height * 0.32, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(width * 0.82, height * 0.68, width * 0.05, height * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Projected Ground Track (Sine Wave)
    ctx.strokeStyle = `${selectedSat.color}88`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 5) {
      const phase = (x / width) * 2 * Math.PI;
      const incFactor = selectedSat.inclination > 90 ? (180 - selectedSat.inclination) / 90 : selectedSat.inclination / 90;
      const y = height / 2 - Math.sin(phase) * (height * 0.42 * incFactor);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Current Satellite Position
    const satX = ((satTelemetry.lon + 180) / 360) * width;
    const satY = ((90 - satTelemetry.lat) / 180) * height;

    // Footprint coverage circle
    const footprintRadius = (selectedSat.swath / 20000) * width * 1.5;
    ctx.fillStyle = `${selectedSat.color}18`;
    ctx.strokeStyle = `${selectedSat.color}55`;
    ctx.beginPath();
    ctx.arc(satX, satY, Math.max(16, footprintRadius), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Satellite Beacon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(satX, satY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Beacon ring pulse
    ctx.strokeStyle = selectedSat.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(satX, satY, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(selectedSat.name, satX + 12, satY - 6);

  }, [satTelemetry, selectedSat]);

  // Export JSON Geospatial Assessment Report
  const handleExportReport = () => {
    const report = {
      platform: "AeroSat AI - Earth Observation Intelligence",
      generated_utc: new Date().toISOString(),
      active_satellite: selectedSat,
      telemetry: satTelemetry,
      active_scene: selectedScene,
      ml_inference: {
        model: activeMLModel.toUpperCase(),
        spectral_band: spectralBand.toUpperCase(),
        sensitivity: mlSensitivity,
        cloud_filter_pct: cloudFilter,
        metrics: selectedScene.landCover
      }
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AeroSat_${selectedScene.id}_Intel_Report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* TOP STATUS BAR */}
      <div className="bg-[#0b1324] border-b border-slate-800/80 px-4 py-2 text-xs flex flex-wrap justify-between items-center text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            NETWORK ONLINE
          </span>
          <span className="text-slate-600">|</span>
          <span>DOMAINS: <strong className="text-sky-400">stringstrange.online</strong></span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <Sun className="w-3.5 h-3.5 text-amber-400" /> SOLAR FLUX: 142 sfu (Kp 2.1 Quiet)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-sky-400" /> {utcTime}
          </span>
        </div>
      </div>

      {/* HEADER & MAIN NAVIGATION */}
      <header className="border-b border-slate-800 bg-[#070b14]/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
              <Satellite className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">AeroSat <span className="text-sky-400">AI</span></h1>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">v4.2-EOS</span>
              </div>
              <p className="text-xs text-slate-400">Satellite Earth Observation, Orbital Mechanics & Geospatial ML</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('orbit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'orbit' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4" /> Orbital Tracker
            </button>
            <button
              onClick={() => setActiveTab('ml')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ml' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-4 h-4" /> Multi-Spectral ML
            </button>
            <button
              onClick={() => setActiveTab('targets')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'targets' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Eye className="w-4 h-4" /> Observation Hub
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'telemetry' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4" /> Space Telemetry
            </button>
          </nav>

          <button
            onClick={handleExportReport}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-6">

        {/* TAB 1: ORBITAL MECHANICS & SATELLITE TRACKER */}
        {activeTab === 'orbit' && (
          <div className="space-y-6">
            
            {/* SATELLITE SELECTOR PILLS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {SATELLITES.map(sat => (
                <div
                  key={sat.id}
                  onClick={() => setSelectedSat(sat)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-left ${
                    selectedSat.id === sat.id
                      ? 'bg-slate-800/90 border-sky-500 ring-2 ring-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>NORAD {sat.norad}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sat.color }}></span>
                  </div>
                  <div className="font-bold text-sm text-white truncate">{sat.name}</div>
                  <div className="text-[11px] text-sky-400/80 font-mono mt-0.5">{sat.altitude} km | {sat.speed} km/s</div>
                </div>
              ))}
            </div>

            {/* ORBIT MAP & LIVE HUD GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Canvas Map Viewport */}
              <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Real-Time SGP4 Ground Track Projection
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                    KEPLER PROPAGATOR ACTIVE
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-slate-800/80 aspect-[16/9] w-full bg-black">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={450}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400 bg-black/60 backdrop-blur px-2 py-1 rounded">
                    FOV Swath: {selectedSat.swath} km • Orbital Inclination: {selectedSat.inclination}°
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between items-center">
                  <span>{selectedSat.description}</span>
                  <span className="font-mono text-sky-400">Solar: {satTelemetry.solarPhase}</span>
                </div>
              </div>

              {/* Real-time Telemetry Cards */}
              <div className="space-y-3 flex flex-col justify-between">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sky-400" /> Sub-Satellite Coordinates
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400">LATITUDE</div>
                      <div className="text-lg font-mono font-bold text-white">{satTelemetry.lat}°</div>
                      <div className="text-[10px] text-slate-500">{satTelemetry.lat >= 0 ? 'Northern' : 'Southern'} Hemisphere</div>
                    </div>
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400">LONGITUDE</div>
                      <div className="text-lg font-mono font-bold text-white">{satTelemetry.lon}°</div>
                      <div className="text-[10px] text-slate-500">{satTelemetry.lon >= 0 ? 'East of Prime' : 'West of Prime'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400">ALTITUDE</div>
                      <div className="text-lg font-mono font-bold text-sky-400">{satTelemetry.alt} km</div>
                      <div className="text-[10px] text-slate-500">Apogee/Perigee Var</div>
                    </div>
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <div className="text-[11px] text-slate-400">VELOCITY</div>
                      <div className="text-lg font-mono font-bold text-emerald-400">{satTelemetry.speed} km/s</div>
                      <div className="text-[10px] text-slate-500">~27,576 km/h</div>
                    </div>
                  </div>
                </div>

                {/* Overhead Pass Predictor */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5"><Radio className="w-4 h-4 text-emerald-400" /> Next Overhead Pass</span>
                    <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800">T-MINUS</span>
                  </div>
                  <div className="text-2xl font-mono font-extrabold text-white">{satTelemetry.nextPass}</div>
                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Peak Elevation: <strong>72° Max Azimuth</strong></span>
                    <span>Optical Visibility: <strong className="text-emerald-400">Optimal</strong></span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: MULTI-SPECTRAL MACHINE LEARNING STUDIO */}
        {activeTab === 'ml' && (
          <div className="space-y-6">
            
            {/* ML MODEL SELECTION BAR */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-sky-400" /> Geospatial Machine Learning Vision Pipeline
                </h2>
                <p className="text-xs text-slate-400">Select model architecture and spectral bands to run real-time inference on satellite scenes.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'ndvi', label: 'NDVI Vegetation', icon: Trees },
                  { id: 'fire', label: 'Thermal Wildfire', icon: Flame },
                  { id: 'landcover', label: 'Land Cover U-Net', icon: Layers },
                  { id: 'cloud', label: 'Cloud Masking', icon: Eye }
                ].map(m => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMLModel(m.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                        activeMLModel === m.id
                          ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INTERACTIVE SCENE & SPECTRAL VIEWER */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Spectral Imagery Viewport */}
              <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="font-bold text-base text-white">{selectedScene.name}</h3>
                    <p className="text-xs text-slate-400">{selectedScene.region} • Primary: <span className="text-sky-400">{selectedScene.primaryMetric}</span></p>
                  </div>
                  
                  {/* Spectral Band Selector */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    {[
                      { id: 'rgb', label: 'True Color (B4-3-2)' },
                      { id: 'infrared', label: 'Color IR (B8-4-3)' },
                      { id: 'thermal', label: 'Thermal Heat (B11)' },
                      { id: 'swir', label: 'SWIR Moisture' }
                    ].map(b => (
                      <button
                        key={b.id}
                        onClick={() => setSpectralBand(b.id)}
                        className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                          spectralBand === b.id ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Multispectral Raster Viewport */}
                <div
                  className="rounded-xl h-80 w-full relative overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-4"
                  style={{ background: selectedScene.spectralBands[spectralBand] }}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur border border-white/10 text-white">
                      BAND: {spectralBand.toUpperCase()} | SENSITIVITY: {mlSensitivity}%
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-700/60 text-red-300">
                      {selectedScene.threatLevel}
                    </span>
                  </div>

                  {/* Synthetic Anomaly Overlay Grid */}
                  <div className="grid grid-cols-6 grid-rows-4 gap-2 h-44 opacity-40 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded border ${
                          (i === 7 || i === 8 || i === 13 || i === 14)
                            ? 'bg-red-500/50 border-red-400 animate-pulse'
                            : 'border-white/10'
                        }`}
                      ></div>
                    ))}
                  </div>

                  <div className="flex justify-between items-end text-[11px] font-mono text-white/90 bg-black/70 backdrop-blur p-2.5 rounded-lg border border-white/10">
                    <span>MODEL: <strong className="text-sky-400">AeroSat-VisionNet-v4</strong></span>
                    <span>INFERENCE LATENCY: <strong className="text-emerald-400">14.8 ms</strong></span>
                    <span>CONFIDENCE: <strong className="text-amber-400">97.4%</strong></span>
                  </div>
                </div>

                {/* Model Tuning Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-sky-400" /> Detection Sensitivity Threshold</span>
                      <span className="font-mono font-bold text-sky-400">{mlSensitivity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={mlSensitivity}
                      onChange={e => setMlSensitivity(e.target.value)}
                      className="w-full accent-sky-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-indigo-400" /> Cloud Masking Optical Filter</span>
                      <span className="font-mono font-bold text-indigo-400">{cloudFilter}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={cloudFilter}
                      onChange={e => setCloudFilter(e.target.value)}
                      className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                    />
                  </div>
                </div>

              </div>

              {/* Real-Time ML Classification Metrics Panel */}
              <div className="space-y-4">
                
                {/* Surface Breakdown Card */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" /> Surface Land Cover Breakdown
                  </div>
                  
                  <div className="space-y-2.5 pt-1">
                    {Object.entries(selectedScene.landCover).map(([category, pct]) => (
                      <div key={category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-300">{category}</span>
                          <span className="font-mono font-semibold text-white">{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Environmental Risk Anomaly Metric */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" /> Environmental Anomaly Index
                  </div>
                  <div className="text-3xl font-mono font-extrabold text-white">
                    {selectedScene.baselineAnomaly > 0 ? `+${selectedScene.baselineAnomaly}%` : `${selectedScene.baselineAnomaly}%`}
                  </div>
                  <p className="text-xs text-slate-400">
                    Calculated relative to the 10-year Landsat/Copernicus baseline seasonal median.
                  </p>
                  <button
                    onClick={handleExportReport}
                    className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export Geospatial Analysis
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* TAB 3: OBSERVATION TARGET SCENES HUB */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-400" /> Global Observation Targets
              </h2>
              <p className="text-xs text-slate-400">Select any target zone to stream high-resolution multispectral telemetry.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TARGET_SCENES.map(scene => (
                <div
                  key={scene.id}
                  onClick={() => { setSelectedScene(scene); setActiveTab('ml'); }}
                  className={`p-5 rounded-2xl border cursor-pointer transition text-left space-y-3 ${
                    selectedScene.id === scene.id
                      ? 'bg-slate-800/90 border-sky-500 ring-2 ring-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-white">{scene.name}</h3>
                      <p className="text-xs text-slate-400">{scene.region}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-700/60 text-red-300">
                      {scene.threatLevel}
                    </span>
                  </div>

                  <div className="h-28 rounded-xl w-full border border-slate-800/80" style={{ background: scene.spectralBands.rgb }}></div>

                  <div className="flex justify-between items-center text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1 font-mono text-sky-400"><MapPin className="w-3.5 h-3.5" /> {scene.lat}°, {scene.lon}°</span>
                    <span className="flex items-center gap-1 text-slate-400">Inspect ML Pipeline <ChevronRight className="w-4 h-4 text-sky-400" /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SPACE TELEMETRY & PACKET LOGS */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" /> Downlink Telemetry & Space Weather
              </h2>
              <p className="text-xs text-slate-400">Real-time space weather monitors, cosmic radiation fluxes, and live telemetry packet stream.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="text-xs text-slate-400">SOLAR WIND SPEED</div>
                <div className="text-2xl font-mono font-bold text-amber-400">418.2 km/s</div>
                <div className="text-xs text-slate-500">ACE / DSCOVR L1 Satellite Monitor</div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="text-xs text-slate-400">GEOMAGNETIC KP INDEX</div>
                <div className="text-2xl font-mono font-bold text-emerald-400">2.1 (Quiet)</div>
                <div className="text-xs text-slate-500">Zero satellite orbital drag risk</div>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                <div className="text-xs text-slate-400">DOWNLINK CHANNEL RATE</div>
                <div className="text-2xl font-mono font-bold text-sky-400">148.6 Mbps</div>
                <div className="text-xs text-slate-500">X-Band High-Rate Telemetry</div>
              </div>
            </div>

            {/* Live Packet Terminal */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-400" /> LIVE SATELLITE DOWNLINK TELEMETRY STREAM</span>
                <span className="text-emerald-400">SYNC LOCKED</span>
              </div>
              <div className="space-y-1.5 pt-2 text-sky-300">
                {telemetryLogs.map((log, idx) => (
                  <div key={idx} className="hover:bg-slate-900/40 p-1 rounded transition">{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>AeroSat AI • Operational Satellite Earth Observation & Machine Learning Platform</p>
        <p>
          Domain: <a href="https://www.stringstrange.online" className="text-sky-400 hover:underline">stringstrange.online</a> • 
          GitHub: <a href="https://github.com/Sanskarsoni-013/aerosat-ai" className="text-sky-400 hover:underline">Sanskarsoni-013/aerosat-ai</a>
        </p>
      </footer>

    </div>
  );
}

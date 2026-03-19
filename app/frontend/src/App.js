import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EVENTS = [
  {
    id: 1,
    title: 'France Economic Transition 2025',
    image: 'https://static.prod-images.emergentagent.com/jobs/8fb521bf-5591-4aca-b6af-073ec8e3be27/images/c6e8190a6d789d896b585cc64a777c04159e189c7031588e78020087ddc8157d.png',
    badge: null
  },
  {
    id: 2,
    title: 'Eastern Europe Conflict',
    image: 'https://static.prod-images.emergentagent.com/jobs/8fb521bf-5591-4aca-b6af-073ec8e3be27/images/58bdc08e132260c7d869eb924e53e75b4f56ce945df35457cf00a96c83974e60.png',
    badge: null
  },
  {
    id: 3,
    title: 'Middle East Tensions 2026',
    image: 'https://static.prod-images.emergentagent.com/jobs/8fb521bf-5591-4aca-b6af-073ec8e3be27/images/43e7d320f95b1429a0d83f08cd99ae9d0b8495f2304d0360426031c53415c780.png',
    badge: 'ONGOING'
  },
  {
    id: 4,
    title: 'US-China Trade Relations',
    image: 'https://static.prod-images.emergentagant.com/jobs/8fb521bf-5591-4aca-b6af-073ec8e3be27/images/00d221e24ffd9dff52f2561e1e6a56d83bb120b96c9699d1b048d3866fdf8acb.png',
    badge: null
  },
  {
    id: 5,
    title: 'Middle East Energy Shifts',
    image: 'https://static.prod-images.emergentagent.com/jobs/8fb521bf-5591-4aca-b6af-073ec8e3be27/images/430371927fdc91057be4566dcc65fbb8b8a8dba970b0f4af7688cdff6ca82345.png',
    badge: null
  }
];

function App() {
  const [business, setBusiness] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!business.trim() || !selectedEvent) {
      return;
    }

    setLoading(true);
    setLoadingStage('Fetching live data...');
    
    try {
      setTimeout(() => setLoadingStage('Analyzing business impact...'), 1500);
      setTimeout(() => setLoadingStage('Generating insights...'), 3000);

      const response = await axios.post(`${API}/analyze`, {
        business: business.trim(),
        event: selectedEvent.title
      });

      setResults(response.data);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleCopyReport = async () => {
    if (!results) return;

    const report = `
GLOBAL EVENT IMPACT ANALYSIS
=============================
Business: ${results.business}
Event: ${results.event}
Date: ${new Date().toLocaleDateString()}

CURRENCY RATES
USD/INR: ${results.currency_rates.USD_INR}
EUR/INR: ${results.currency_rates.EUR_INR}

RECENT CONTEXT
${results.recent_context}

RISK FACTORS
${results.risk_factors.map(r => `- ${r.title} (${r.timeframe})`).join('\n')}

HEADWINDS
${results.headwinds.map(h => `- ${h}`).join('\n')}

OPPORTUNITIES
${results.opportunities.map(o => `- ${o}`).join('\n')}

ACTION ITEMS
${results.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

RESILIENCE SCORE: ${results.resilience_score}/10

SECTOR OVERVIEW
${results.sector_overview.map(s => `- ${s.name}: ${s.status} (Intensity: ${s.intensity}/10)`).join('\n')}
    `.trim();

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Clipboard error:', error);
      const textarea = document.createElement('textarea');
      textarea.value = report;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textarea);
    }
  };

  const handleNewAnalysis = () => {
    setResults(null);
    setBusiness('');
    setSelectedEvent(null);
  };

  if (results) {
    return (
      <div className="min-h-screen bg-white">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-6xl mx-auto px-4 py-8"
        >
          {/* Summary Bar */}
          <div className="bg-slate-50 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs" data-testid="summary-bar">
            <div>
              <span className="font-jetbrains text-slate-500">Business:</span>
              <span className="ml-2 font-ibm font-semibold">{results.business}</span>
            </div>
            <div>
              <span className="font-jetbrains text-slate-500">Event:</span>
              <span className="ml-2 font-ibm font-semibold">{results.event}</span>
            </div>
            <div>
              <span className="font-jetbrains text-slate-500">USD/INR:</span>
              <span className="ml-2 font-jetbrains font-bold text-blue-600">{results.currency_rates.USD_INR}</span>
            </div>
            <div>
              <span className="font-jetbrains text-slate-500">EUR/INR:</span>
              <span className="ml-2 font-jetbrains font-bold text-blue-600">{results.currency_rates.EUR_INR}</span>
            </div>
            <div className="font-jetbrains text-slate-400">
              {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Recent Context */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 rounded-xl p-4 mb-6"
            data-testid="recent-context"
          >
            <h3 className="font-barlow text-sm uppercase tracking-wide text-blue-900 mb-2">Recent Context</h3>
            <p className="font-ibm text-sm text-slate-700 leading-relaxed">{results.recent_context}</p>
          </motion.div>

          {/* Risk Factors */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="font-barlow text-lg uppercase tracking-wide text-slate-800 mb-3" data-testid="risk-factors-title">Risk Factors</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {results.risk_factors.map((risk, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  className="bg-slate-50 rounded-xl p-3 border border-slate-200"
                  data-testid={`risk-factor-${idx}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-jetbrains uppercase ${
                      risk.timeframe === 'short' ? 'bg-slate-200 text-slate-700' :
                      risk.timeframe === 'medium' ? 'bg-slate-300 text-slate-800' :
                      'bg-slate-400 text-white'
                    }`}>
                      {risk.timeframe}
                    </span>
                  </div>
                  <p className="font-ibm text-sm text-slate-800">{risk.title}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Headwinds & Opportunities */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-4 mb-6"
          >
            <div>
              <h3 className="font-barlow text-lg uppercase tracking-wide text-slate-800 mb-3" data-testid="headwinds-title">Headwinds</h3>
              <div className="space-y-2">
                {results.headwinds.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border-l-4 border-slate-400" data-testid={`headwind-${idx}`}>
                    <p className="font-ibm text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-barlow text-lg uppercase tracking-wide text-slate-800 mb-3" data-testid="opportunities-title">Opportunities</h3>
              <div className="space-y-2">
                {results.opportunities.map((item, idx) => (
                  <div key={idx} className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500" data-testid={`opportunity-${idx}`}>
                    <p className="font-ibm text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-6"
            data-testid="actions-section"
          >
            <h3 className="font-barlow text-lg uppercase tracking-wide text-blue-900 mb-3">Recommended Actions</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {results.actions.map((action, idx) => (
                <div key={idx} className="bg-white rounded-xl p-3 shadow-sm" data-testid={`action-${idx}`}>
                  <div className="text-2xl font-barlow font-bold text-blue-600 mb-1">{idx + 1}</div>
                  <p className="font-ibm text-sm text-slate-700">{action}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Resilience Score */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-barlow text-lg uppercase tracking-wide text-slate-800" data-testid="resilience-score-title">Resilience Score</h3>
              <span className="font-jetbrains text-2xl font-bold text-slate-800" data-testid="resilience-score-value">{results.resilience_score}/10</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${results.resilience_score * 10}%` }}
                transition={{ duration: 1, delay: 0.7 }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                data-testid="resilience-score-bar"
              />
            </div>
          </motion.div>

          {/* Sector Overview */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mb-6"
          >
            <h3 className="font-barlow text-lg uppercase tracking-wide text-slate-800 mb-3" data-testid="sector-overview-title">Sector Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {results.sector_overview.map((sector, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-3" data-testid={`sector-${idx}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-ibm text-xs font-semibold text-slate-700">{sector.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-jetbrains ${
                      sector.status === 'RISK' ? 'bg-slate-200 text-slate-700' :
                      sector.status === 'OPP' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {sector.status}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        sector.status === 'RISK' ? 'bg-slate-400' :
                        sector.status === 'OPP' ? 'bg-green-500' :
                        'bg-blue-400'
                      }`}
                      style={{ width: `${sector.intensity * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg font-ibm text-sm hover:bg-slate-700 transition-colors"
              data-testid="copy-report-button"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Report'}
            </button>
            <button
              onClick={handleNewAnalysis}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-ibm text-sm hover:bg-blue-700 transition-colors"
              data-testid="new-analysis-button"
            >
              New Analysis
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="font-barlow text-5xl md:text-7xl font-bold text-slate-900 mb-3" data-testid="landing-title">
            Global Event Impact Analyser
          </h1>
          <p className="font-ibm text-lg text-slate-600" data-testid="landing-tagline">
            Understanding how global macro shifts affect your business
          </p>
        </motion.div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div className="text-left" data-testid="loading-indicator">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1.5 font-ibm text-sm text-slate-600"
                >
                  <div className={loadingStage.includes('Fetching') ? 'text-blue-600' : 'text-slate-400'}>
                    {loadingStage.includes('Fetching') ? '→' : '✓'} Fetching live data...
                  </div>
                  <div className={loadingStage.includes('Analyzing') ? 'text-blue-600' : loadingStage.includes('Generating') ? 'text-slate-400' : 'text-slate-300'}>
                    {loadingStage.includes('Generating') ? '✓' : loadingStage.includes('Analyzing') ? '→' : '○'} Analyzing business impact...
                  </div>
                  <div className={loadingStage.includes('Generating') ? 'text-blue-600' : 'text-slate-300'}>
                    {loadingStage.includes('Generating') ? '→' : '○'} Generating insights...
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gradient Input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <div className="relative">
            <div className="absolute -inset-[3px] bg-gradient-conic from-orange-400 via-pink-400 to-orange-400 rounded-2xl opacity-75" />
            <div className="absolute -inset-[2px] bg-gradient-conic from-pink-300 via-orange-300 to-pink-300 rounded-2xl opacity-60" />
            <div className="absolute -inset-[1px] bg-gradient-conic from-orange-200 via-pink-200 to-orange-200 rounded-2xl opacity-50" />
            <textarea
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder="Enter your business name (e.g., 'Textile Exporter', 'IT Services Company')..."
              className="relative bg-white w-full px-6 py-4 rounded-2xl font-ibm text-base text-slate-800 placeholder-slate-400 focus:outline-none resize-none"
              rows={2}
              data-testid="business-input"
            />
          </div>
        </motion.div>

        {/* Event Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <h2 className="font-barlow text-xl uppercase tracking-wide text-slate-700 mb-4" data-testid="events-section-title">Select Global Event</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {EVENTS.map((event, idx) => (
              <motion.button
                key={event.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                onClick={() => setSelectedEvent(event)}
                className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all ${
                  selectedEvent?.id === event.id
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-transparent hover:border-slate-300'
                }`}
                data-testid={`event-card-${event.id}`}
              >
                <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {event.badge && (
                  <div className="absolute top-2 right-2 bg-slate-500 text-white text-[9px] px-2 py-1 rounded-full font-jetbrains">
                    {event.badge}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="font-ibm text-xs text-white font-semibold leading-tight">{event.title}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Analyze Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button
            onClick={handleAnalyze}
            disabled={loading || !business.trim() || !selectedEvent}
            className="px-8 py-3.5 bg-slate-900 text-white rounded-lg font-barlow text-lg uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="analyze-button"
          >
            Analyze Impact
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default App;


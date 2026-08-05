import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Timeline from './pages/Timeline';
import Analytics from './pages/Analytics';
import Screenshots from './pages/Screenshots';
import SearchPage from './pages/Search';
import SettingsPage from './pages/Settings';
import { useWebSocket } from './hooks/useWebSocket';
import { Search, Shield, Key, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const { messages, isConnected } = useWebSocket();
  const [userKey, setUserKey] = useState('usr_demo_active_session');

  // Try retrieving client sync key if stored in local storage
  useEffect(() => {
    const savedKey = localStorage.getItem('userKey');
    if (savedKey) {
      setUserKey(savedKey);
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-obsidian-mesh text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
        {/* Fixed Navigation Sidebar */}
        <Sidebar isConnected={isConnected} />

        {/* Top Header Command Bar */}
        <header className="ml-64 h-16 cortex-panel border-b border-white/10 px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xl">
          {/* Quick Search Shortcut Trigger */}
          <Link 
            to="/search" 
            className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl cortex-card text-slate-400 hover:text-slate-200 hover:border-cyan-500/40 transition text-xs font-medium w-72 border border-white/10"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="flex-1 truncate">Search browsing history or OCR text...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/5 border border-white/10 rounded text-slate-400">⌘K</kbd>
          </Link>

          {/* Right Header Status Widgets */}
          <div className="flex items-center gap-4">
            {/* User Sync Key Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
              <Key className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[11px] font-medium text-slate-400">Sync Key:</span>
              <span className="font-mono text-[11px] font-bold text-cyan-300 truncate max-w-[140px]">
                {userKey}
              </span>
            </div>

            {/* PII Redaction Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PII Shield</span> Active
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 ml-64 p-8 max-w-7xl">
          <Routes>
            <Route path="/" element={<Timeline liveMessages={messages} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/screenshots" element={<Screenshots />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

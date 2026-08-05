import React, { useState, useEffect } from 'react';
import { Sliders, Shield, Trash2, Key, Save, AlertTriangle, Check, Copy, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [retentionDays, setRetentionDays] = useState(30);
  const [excludedDomains, setExcludedDomains] = useState('bank.com, login.gov, paypal.com');
  const [apiKey] = useState(import.meta.env.VITE_EXTENSION_API_KEY || 'dev_api_key_visual_agent_2026_abc123def456ghi789jkl012mno345pqr');
  const [userKey, setUserKey] = useState('usr_demo_active_session');
  const [saved, setSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('userKey');
    if (savedKey) setUserKey(savedKey);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopyUserKey = () => {
    navigator.clipboard.writeText(userKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <Sliders className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Control & Privacy Settings</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Manage retention windows, site exclusion blocklists, User Sync Keys, and extension credentials.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Sync Key Identity Panel */}
        <div className="cortex-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" /> Active User Sync Key
            </h3>
            <button
              type="button"
              onClick={handleCopyUserKey}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition flex items-center gap-1.5"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? 'Copied Key!' : 'Copy Key'}
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your unique 128-bit identity token used to segregate and sync your browsing records across browsers.
          </p>
          <div className="p-3 rounded-2xl bg-[#05070c] border border-white/10 font-mono text-xs text-cyan-300 truncate font-bold">
            {userKey}
          </div>
        </div>

        {/* Data Retention Settings */}
        <div className="cortex-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Auto-Purge Retention Window
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically purge activity records and redacted screenshots older than the configured threshold.
          </p>

          <div className="flex items-center gap-5 pt-2">
            <input
              type="range"
              min="7"
              max="90"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-full accent-cyan-400 h-2 rounded-lg bg-slate-800 cursor-pointer"
            />
            <span className="text-sm font-black text-cyan-400 min-w-[80px] px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
              {retentionDays} Days
            </span>
          </div>
        </div>

        {/* Domain Exclusion Blocklist */}
        <div className="cortex-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> Domain Exclusion Blocklist
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Websites listed here (comma-separated) will be ignored by the Chrome extension. Zero activity or screenshots will be captured.
          </p>

          <textarea
            value={excludedDomains}
            onChange={(e) => setExcludedDomains(e.target.value)}
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-[#05070c] border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 leading-relaxed"
          />
        </div>

        {/* Extension API Key */}
        <div className="cortex-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-violet-400" /> Extension Authorization Key
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Authentication key used by the Chrome extension to ingest activity data into the backend.
          </p>

          <div className="p-3.5 rounded-2xl bg-[#05070c] border border-white/10 font-mono text-xs text-slate-300 truncate">
            {apiKey}
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-indigo-600/30 hover:opacity-90 transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>

          {saved && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4" /> Configuration saved successfully!
            </span>
          )}
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-3">
          <h3 className="text-sm font-extrabold text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" /> Danger Zone
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Permanently delete all stored activity logs and redacted screenshot files from PostgreSQL database and disk.
          </p>
          <button
            type="button"
            onClick={() => alert('This action is irreversible in production.')}
            className="px-4 py-2.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/40 text-xs font-extrabold hover:bg-rose-600 hover:text-white transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete All My Data
          </button>
        </div>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { fetchActivityStats } from '../utils/api';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Clock, Globe, Shield, Sparkles, Layers } from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const data = await fetchActivityStats(days);
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [days]);

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#64748b'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-2xl cortex-card animate-shimmer border border-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 rounded-2xl cortex-card animate-shimmer border border-white/5" />
          <div className="h-72 rounded-2xl cortex-card animate-shimmer border border-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">Analytics & Intelligence</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated domain frequency, category distribution, and active usage metrics.
          </p>
        </div>

        {/* Days Filter Selector */}
        <div className="flex gap-1.5 cortex-card p-1.5 rounded-2xl border border-white/10">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                days === d
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Highlights Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="cortex-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tracked Events</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-100">{stats?.total_events || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Logged in last {days} days</p>
        </div>

        <div className="cortex-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unique Domains Visited</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-100">{stats?.domains?.length || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Distinct web applications</p>
        </div>

        <div className="cortex-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Categories</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-100">{stats?.categories?.length || 0}</p>
          <p className="text-[11px] text-slate-500 font-medium">Intent classifications</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Visited Domains Bar Chart */}
        <div className="cortex-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Top Visited Domains
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Frequency
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.domains || []}>
                <XAxis dataKey="domain" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f121d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Category Breakdown Donut Chart */}
        <div className="cortex-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-violet-400" />
              Category Breakdown
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
              VLM Classified
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.categories || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={6}
                >
                  {(stats?.categories || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f121d', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Domain Breakdown Table */}
      <div className="cortex-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-100">Domain Frequency Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-white/10 uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Domain</th>
                <th className="pb-3 px-3 text-right">Event Count</th>
                <th className="pb-3 px-3 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-slate-200">
              {(stats?.domains || []).map((d) => {
                const pct = stats.total_events ? Math.round((d.count / stats.total_events) * 100) : 0;
                return (
                  <tr key={d.domain} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 flex items-center gap-2 font-mono text-cyan-300">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=32`}
                        alt={d.domain}
                        className="w-4 h-4 rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      {d.domain}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">{d.count}</td>
                    <td className="py-3 px-3 text-right text-slate-400 font-mono">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

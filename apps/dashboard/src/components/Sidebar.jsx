import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Activity, 
  BarChart3, 
  Layers, 
  Search, 
  Sliders, 
  Zap, 
  Radio,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ isConnected }) {
  const navItems = [
    { path: '/', label: 'Live Activity', icon: Activity, badge: 'Stream' },
    { path: '/analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { path: '/screenshots', label: 'Captured Screen Vault', icon: Layers },
    { path: '/search', label: 'Semantic Search', icon: Search },
    { path: '/settings', label: 'Control & Privacy', icon: Sliders },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 cortex-panel border-r border-white/10 p-5 flex flex-col justify-between z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-8">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0d101a] rounded-[11px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/20 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-sm text-slate-100 tracking-tight">Visual AI</h1>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Activity Agent Core</p>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Workspace Navigation
          </span>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600/15 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-indigo-950/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-white/5'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}

                    {/* Active Accent Bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r-full shadow-sm shadow-cyan-400/80" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status Footnote */}
      <div className="cortex-card p-3.5 rounded-2xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            <span className="text-xs font-bold text-slate-200">
              {isConnected ? 'Agent Stream Active' : 'Disconnected'}
            </span>
          </div>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-400'}`} />
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          {isConnected ? 'Real-time WebSocket monitoring active tab events.' : 'Attempting server reconnection...'}
        </p>
      </div>
    </aside>
  );
}

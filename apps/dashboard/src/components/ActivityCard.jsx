import React from 'react';
import { ExternalLink, ShieldCheck, Sparkles, Clock, Globe, ArrowUpRight, Cpu } from 'lucide-react';

export default function ActivityCard({ activity, onSelect }) {
  const {
    timestamp,
    url,
    domain,
    page_title,
    summary,
    category,
    confidence,
    event_type,
    screenshot_path
  } = activity;

  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const categoryBadges = {
    Development: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    Productivity: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    Entertainment: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    Shopping: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    Social: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    Research: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    Travel: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  };

  const badgeStyle = categoryBadges[category] || 'bg-slate-800/80 text-slate-300 border-slate-700';

  const eventTypeLabels = {
    tab_switch: { label: 'Tab Switch', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    page_visit: { label: 'Page Visit', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    periodic_alarm: { label: 'Active Session', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  };

  const eventMeta = eventTypeLabels[event_type] || { label: event_type || 'Event', color: 'text-slate-400 bg-white/5 border-white/10' };

  return (
    <div
      onClick={() => onSelect && onSelect(activity)}
      className="cortex-card-interactive rounded-2xl p-5 cursor-pointer group relative overflow-hidden"
    >
      {/* Subtle top border glow line on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/0 group-hover:via-cyan-400/80 to-transparent transition-all duration-300" />

      <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
        {/* Left Core Info */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Metadata Header Row */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* Domain Favicon Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 font-medium">
              <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt={domain}
                className="w-3.5 h-3.5 rounded"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="font-semibold text-cyan-300">{domain}</span>
            </div>

            {/* Event Type Chip */}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${eventMeta.color}`}>
              {eventMeta.label}
            </span>

            {/* Category Tag */}
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle}`}>
              {category || 'Browsing'}
            </span>

            {/* Timestamp */}
            <span className="text-[11px] text-slate-500 flex items-center gap-1 ml-auto sm:ml-0">
              <Clock className="w-3 h-3 text-slate-400" />
              {formattedTime}
            </span>
          </div>

          {/* AI Activity Summary Title */}
          <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-200 transition-colors line-clamp-2 leading-snug">
            {summary || page_title || url}
          </h3>

          {/* URL & Security Footnote */}
          <div className="pt-1 flex items-center justify-between gap-4 text-xs">
            <span className="truncate max-w-md text-slate-500 font-mono text-[11px] group-hover:text-slate-400 transition-colors flex items-center gap-1">
              {url}
              <ArrowUpRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all" />
            </span>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                PII Protected
              </span>
              {confidence && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                  <Cpu className="w-3 h-3 text-violet-400" />
                  {Math.round(confidence * 100)}% Match
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Screenshot Preview Card */}
        {screenshot_path && (
          <div className="relative w-full sm:w-36 h-24 rounded-xl overflow-hidden border border-white/10 bg-[#07090e] flex-shrink-0 group-hover:border-cyan-500/50 transition-all shadow-md">
            <img
              src={screenshot_path.startsWith('http') ? screenshot_path : `/screenshots/${screenshot_path.replace(/^\/+/, '').replace(/^screenshots\//, '')}`}
              alt="Screen Capture"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
              <span className="text-[10px] font-bold text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Expand Frame
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

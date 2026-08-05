import React, { useState } from 'react';
import { Search, X, Sparkles, Command } from 'lucide-react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  const quickPrompts = [
    'GitHub pull requests',
    'Kayak flights',
    'Amazon shopping',
    'FastAPI documentation',
    'YouTube tutorials',
  ];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <div className="cortex-card rounded-2xl p-2 flex items-center gap-3 border border-white/10 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/40 transition-all shadow-xl">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any search query, domain, or intent (e.g. 'flight booking' or 'Python code')..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-medium"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 hover:opacity-90 transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggested Quick Search Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Suggestions:
        </span>
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => {
              setQuery(prompt);
              if (onSearch) onSearch(prompt);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-[11px] font-medium text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

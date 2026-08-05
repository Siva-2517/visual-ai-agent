import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import ActivityCard from '../components/ActivityCard';
import ScreenshotModal from '../components/ScreenshotModal';
import { searchActivities } from '../utils/api';
import { Search as SearchIcon, Sparkles, Terminal, Cpu } from 'lucide-react';

export default function SearchPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleSearch = async (query) => {
    if (!query) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const data = await searchActivities(query);
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <SearchIcon className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Semantic & Keyword Search</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Query your browsing history by intent, domain, OCR text, or page context.
        </p>
      </div>

      {/* Search Input Component */}
      <SearchBar onSearch={handleSearch} />

      {/* Search Results Display */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl cortex-card animate-shimmer border border-white/5 p-5" />
          ))}
        </div>
      ) : searched && results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Found {results.length} matching event{results.length > 1 ? 's' : ''}
            </p>
          </div>
          {results.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onSelect={(act) => setSelectedActivity(act)}
            />
          ))}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="cortex-card p-12 text-center rounded-3xl border border-white/10 space-y-3 max-w-lg mx-auto">
          <SearchIcon className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No matching activities found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Try broader terms like "flights", "shopping", "code", or domain names.
          </p>
        </div>
      ) : (
        <div className="cortex-card p-12 rounded-3xl border border-white/10 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Natural Language Intent Query</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Search by natural phrase or keyword to instant query across activity summaries, EasyOCR text, and page URLs.
            </p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedActivity && (
        <ScreenshotModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}

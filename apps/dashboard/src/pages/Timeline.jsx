import React, { useState, useEffect } from 'react';
import ActivityCard from '../components/ActivityCard';
import ScreenshotModal from '../components/ScreenshotModal';
import { fetchActivityHistory } from '../utils/api';
import { 
  Activity, 
  RefreshCw, 
  Sparkles, 
  Filter, 
  Zap, 
  Layers, 
  Radio, 
  Flame 
} from 'lucide-react';

export default function Timeline({ liveMessages = [] }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newLiveCount, setNewLiveCount] = useState(0);

  const loadActivities = async () => {
    setLoading(true);
    setNewLiveCount(0);
    try {
      const data = await fetchActivityHistory({
        page: 1,
        limit: 30,
        domain: selectedDomain || null,
        category: selectedCategory || null,
      });
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load activity history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [selectedDomain, selectedCategory]);

  // Prepend incoming live WebSocket messages to top of timeline
  useEffect(() => {
    if (liveMessages && liveMessages.length > 0) {
      const latest = liveMessages[0];
      setActivities((prev) => {
        if (prev.some((a) => a.id === latest.id)) return prev;
        setNewLiveCount((c) => c + 1);
        return [latest, ...prev];
      });
    }
  }, [liveMessages]);

  const categories = ['Development', 'Productivity', 'Entertainment', 'Shopping', 'Social', 'Research'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">Activity Timeline</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual capture stream with client-side PII redaction and VLM intent analysis.
          </p>
        </div>

        <button
          onClick={loadActivities}
          className="px-4 py-2.5 rounded-xl cortex-card text-slate-300 hover:text-white hover:border-cyan-500/40 transition flex items-center gap-2 text-xs font-bold border border-white/10 shadow-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {/* Incoming Live Stream Banner */}
      {newLiveCount > 0 && (
        <div className="cortex-card p-3 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-transparent flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-cyan-300 font-bold">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>{newLiveCount} new live activity event{newLiveCount > 1 ? 's' : ''} received via WebSocket stream</span>
          </div>
          <button
            onClick={() => setNewLiveCount(0)}
            className="text-[11px] font-bold px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="cortex-panel p-2 rounded-2xl border border-white/10 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 px-3 text-xs font-bold text-slate-400 border-r border-white/10 pr-4">
          <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter:
        </div>

        <button
          onClick={() => { setSelectedCategory(''); setSelectedDomain(''); }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            !selectedCategory && !selectedDomain
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          All Activity
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Activity Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl cortex-card animate-shimmer border border-white/5 p-5" />
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity, idx) => (
            <ActivityCard
              key={activity.id || idx}
              activity={activity}
              onSelect={(act) => setSelectedActivity(act)}
            />
          ))}
        </div>
      ) : (
        <div className="cortex-card p-14 text-center rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">No activity events recorded yet</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Activate the Chrome extension in your browser and switch tabs or navigate to any site. Live events will stream here automatically.
            </p>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {selectedActivity && (
        <ScreenshotModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </div>
  );
}

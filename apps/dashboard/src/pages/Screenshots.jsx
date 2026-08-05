import React, { useState, useEffect } from 'react';
import ScreenshotModal from '../components/ScreenshotModal';
import { fetchActivityHistory } from '../utils/api';
import { Layers, ShieldCheck, Sparkles, Eye, ArrowUpRight } from 'lucide-react';

export default function Screenshots() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    async function loadScreenshots() {
      setLoading(true);
      try {
        const data = await fetchActivityHistory({ page: 1, limit: 50 });
        const withScreenshots = (data.activities || []).filter((a) => a.screenshot_path);
        setActivities(withScreenshots);
      } catch (err) {
        console.error('Failed to load screenshots gallery:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScreenshots();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">Captured Screen Vault</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Visual gallery of captured browser frames with client-side PII blackout masks applied.
        </p>
      </div>

      {/* Grid gallery */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-3xl cortex-card animate-shimmer border border-white/5" />
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className="cortex-card-interactive rounded-3xl overflow-hidden border border-white/10 group cursor-pointer flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div className="relative h-44 bg-[#05070c] flex items-center justify-center overflow-hidden border-b border-white/10">
                <img
                  src={activity.screenshot_path.startsWith('http') ? activity.screenshot_path : `/screenshots/${activity.screenshot_path.replace(/^\/+/, '').replace(/^screenshots\//, '')}`}
                  alt="Redacted frame capture"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Top Security Badge */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> Redacted
                </div>

                {/* Hover Mask Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Inspect Frame
                  </span>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${activity.domain}&sz=32`}
                    alt={activity.domain}
                    className="w-4 h-4 rounded"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <p className="text-xs font-bold text-cyan-300 truncate">{activity.domain}</p>
                </div>
                <p className="text-[11px] text-slate-400 truncate leading-snug">
                  {activity.summary || activity.page_title}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cortex-card p-14 text-center rounded-3xl border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">No screenshots captured yet</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Browse web pages with the extension active to generate visual redacted captures.
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

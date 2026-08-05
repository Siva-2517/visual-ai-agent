import React, { useState } from 'react';
import { X, ShieldCheck, ExternalLink, Clock, Copy, Check, FileText, Sparkles, Globe, Cpu } from 'lucide-react';

export default function ScreenshotModal({ activity, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'ocr'

  if (!activity) return null;

  const {
    timestamp,
    url,
    domain,
    page_title,
    summary,
    action_type,
    category,
    confidence,
    ocr_text,
    screenshot_path
  } = activity;

  const formattedTime = new Date(timestamp).toLocaleString();

  const handleCopyOCR = () => {
    if (ocr_text) {
      navigator.clipboard.writeText(ocr_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn">
      {/* Modal Container */}
      <div className="cortex-panel rounded-3xl border border-white/10 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-cyan-950/40">
        
        {/* Left Side: Screenshot Display Area */}
        <div className="flex-1 bg-[#05070c] p-6 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
          {/* Header Status Bar */}
          <div className="flex items-center justify-between mb-4 z-10">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> PII Masked & Redacted
              </span>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 transition"
            >
              Open URL <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Screenshot Main Image */}
          <div className="relative flex-1 flex items-center justify-center min-h-[300px] max-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-black/60 p-2">
            {screenshot_path ? (
              <img
                src={screenshot_path.startsWith('http') ? screenshot_path : `/screenshots/${screenshot_path.replace(/^\/+/, '').replace(/^screenshots\//, '')}`}
                alt="Captured activity frame"
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
              />
            ) : (
              <div className="text-center p-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No visual screenshot frame attached</p>
              </div>
            )}
          </div>

          {/* Bottom Footnote */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Captured via Chrome Service Worker</span>
            <span>Local Client Redaction Engine</span>
          </div>
        </div>

        {/* Right Side: Metadata & AI Analytics Panel */}
        <div className="w-full md:w-96 p-6 flex flex-col justify-between bg-[#0b0e18] space-y-6 overflow-y-auto">
          <div>
            {/* Close Button Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                  alt={domain}
                  className="w-5 h-5 rounded"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <h3 className="font-bold text-sm text-slate-100 truncate max-w-[200px]">{domain}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Meta Badges */}
            <div className="space-y-3 mb-5">
              <div className="text-xs text-slate-400 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Page Title</span>
                <p className="font-semibold text-slate-200 line-clamp-2">{page_title || url}</p>
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-y border-white/10">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Timestamp
                </span>
                <span className="font-mono text-slate-300 font-medium text-[11px]">{formattedTime}</span>
              </div>

              {confidence && (
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-violet-400" /> AI Confidence
                  </span>
                  <span className="font-bold text-emerald-400">{Math.round(confidence * 100)}%</span>
                </div>
              )}
            </div>

            {/* Tab Navigation (AI Summary vs OCR Text) */}
            <div className="flex gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'summary' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AI Summary
              </button>
              <button
                onClick={() => setActiveTab('ocr')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'ocr' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Extracted OCR
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'summary' ? (
              <div className="cortex-card p-4 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  VLM Intent Analysis
                </div>
                <p className="text-xs font-medium text-slate-200 leading-relaxed">
                  {summary || 'No AI summary generated for this frame.'}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Category: {category || 'Browsing'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Action: {action_type || 'browsing'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">OCR Extracted Text</span>
                  <button
                    onClick={handleCopyOCR}
                    className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 border border-white/10 text-cyan-300 hover:bg-white/10 transition flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                </div>
                <div className="p-3 rounded-2xl bg-[#05070c] border border-white/10 max-h-48 overflow-y-auto text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {ocr_text || 'No on-screen text extracted by EasyOCR.'}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}

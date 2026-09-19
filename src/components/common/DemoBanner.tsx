import React, { useState } from 'react';
import { Sparkles, RefreshCw, Check } from 'lucide-react';
import { mockDb } from '../../data/mockDatabase';
import { useToast } from '../../context/ToastContext';

export const DemoBanner: React.FC = () => {
  const { showToast } = useToast();
  const [resetting, setResetting] = useState(false);

  const handleReset = () => {
    setResetting(true);
    mockDb.resetAllData();
    showToast('Demo mock data restored to default state.', 'success');
    setTimeout(() => {
      setResetting(false);
      window.location.reload();
    }, 400);
  };

  return (
    <aside aria-label="Demo environment notification" className="bg-slate-900 text-slate-200 text-xs py-2 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-[#081217] text-slate-200 font-semibold px-2 py-0.5 rounded-full border border-slate-800 text-[11px]">
            <Sparkles className="w-3 h-3 text-slate-400" />
            Demo Mode
          </span>
          <span className="text-slate-300">
            Running independently on sample healthcare data & local persistence. No backend required.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-700"
            title="Reset localStorage datasets to fresh initial sample"
          >
            <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting...' : 'Reset Demo Data'}
          </button>
        </div>
      </div>
    </aside>
  );
};

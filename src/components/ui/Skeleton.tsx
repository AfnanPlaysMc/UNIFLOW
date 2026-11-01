import React from 'react';

export const TrackSkeleton: React.FC = () => (
  <div className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-100 dark:border-slate-800 animate-pulse shadow-xs">
    <div className="w-6 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
    <div className="w-11 h-11 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="w-48 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="w-28 h-3 bg-slate-150 dark:bg-slate-850 rounded" />
    </div>
    <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 animate-pulse shadow-xs">
    <div className="aspect-square w-full bg-slate-200 dark:bg-slate-800 rounded-xl mb-3" />
    <div className="w-3/4 h-3.5 bg-slate-200 dark:bg-slate-800 rounded mb-1.5" />
    <div className="w-1/2 h-3 bg-slate-150 dark:bg-slate-850 rounded" />
  </div>
);

import React from 'react';

export const QuestSkeleton: React.FC = () => (
  <div className="quest-card p-4 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-5 bg-slate-800 rounded w-1/3" />
      <div className="h-4 bg-slate-800 rounded w-16" />
    </div>
    <div className="h-3.5 bg-slate-800/60 rounded w-4/5" />
    <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
      <div className="flex gap-2">
        <div className="h-4 bg-slate-800 rounded w-12" />
        <div className="h-4 bg-slate-800 rounded w-12" />
      </div>
      <div className="h-7 bg-slate-800 rounded w-20" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="rpg-panel p-5 rounded-xl border border-slate-800 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-slate-800" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-slate-800 rounded w-1/4" />
          <div className="h-3 bg-slate-800/60 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-slate-800 rounded-full w-full" />
    </div>
    <div className="space-y-3">
      <QuestSkeleton />
      <QuestSkeleton />
      <QuestSkeleton />
    </div>
  </div>
);

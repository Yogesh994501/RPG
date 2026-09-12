import React from 'react';
import { BookOpen, CheckCircle2, ShieldCheck, Coins, Sparkles, Award, History } from 'lucide-react';
import { Transaction, QuestLog } from '../types';

interface ChronicleViewProps {
  transactions: Transaction[];
  questLogs: QuestLog[];
  stats: {
    totalCompletedQuests: number;
    lifetimeGold: number;
    lifetimeXp: number;
    bossesDefeated: number;
  };
}

export const ChronicleView: React.FC<ChronicleViewProps> = ({
  transactions,
  stats
}) => {
  const getBadgeStyle = (type: Transaction['type']) => {
    switch (type) {
      case 'QUEST_COMPLETION':
        return 'bg-amber-950/60 text-amber-300 border-amber-700/50';
      case 'SHOP_PURCHASE':
        return 'bg-blue-950/60 text-blue-300 border-blue-700/50';
      case 'BOSS_REWARD':
        return 'bg-red-950/60 text-red-300 border-red-700/50';
      case 'CUSTOM_REWARD':
        return 'bg-purple-950/60 text-purple-300 border-purple-700/50';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rpg-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-amber-400" />
          <h2 className="panel-title text-base font-bold">The Hero's Chronicle</h2>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
          <ShieldCheck size={14} />
          <span>Authoritative Immutable Ledger</span>
        </div>
      </div>

      {/* Lifetime Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Deeds Finished</div>
          <div className="font-rpg text-base font-bold text-white mt-0.5">
            {stats.totalCompletedQuests}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Total XP Gained</div>
          <div className="font-rpg text-base font-bold text-purple-400 mt-0.5">
            {stats.lifetimeXp} XP
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Wealth Harvested</div>
          <div className="font-rpg text-base font-bold text-amber-400 mt-0.5">
            {stats.lifetimeGold} Gold
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
          <div className="text-[10px] text-slate-400 font-semibold uppercase">Titans Slain</div>
          <div className="font-rpg text-base font-bold text-red-400 mt-0.5">
            {stats.bossesDefeated}
          </div>
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No chronicles etched yet. Complete your first deed!</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="relative group">
              {/* Timeline Node Icon */}
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-amber-400 group-hover:scale-125 transition" />

              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getBadgeStyle(tx.type)}`}>
                    {tx.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatTime(tx.created_at)}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-200 mt-1 leading-snug">
                  {tx.description}
                </p>

                {/* Amount Badges */}
                <div className="flex items-center gap-3 mt-2 text-[11px] font-mono">
                  {tx.amount_gold !== 0 && (
                    <span className={`flex items-center gap-1 font-bold ${tx.amount_gold > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      <Coins size={12} />
                      <span>{tx.amount_gold > 0 ? `+${tx.amount_gold}` : tx.amount_gold} Gold</span>
                    </span>
                  )}
                  {tx.amount_xp > 0 && (
                    <span className="flex items-center gap-1 font-bold text-purple-400">
                      <Sparkles size={12} />
                      <span>+{tx.amount_xp} XP</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

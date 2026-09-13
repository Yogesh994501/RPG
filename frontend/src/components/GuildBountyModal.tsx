import React, { useState, useEffect } from 'react';
import { Scroll, Plus, Check, Brain, Dumbbell, Hammer, Scale, Sparkles, X, Filter } from 'lucide-react';
import { api } from '../services/api';
import { soundEngine } from '../services/soundEngine';

interface GuildBounty {
  id: string;
  title: string;
  description: string;
  category: 'mind' | 'body' | 'craft' | 'discipline';
  attribute: string;
  difficulty: string;
  quest_type: string;
  recurrence: string;
}

interface GuildBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdopted: (newQuest: any) => void;
}

export const GuildBountyModal: React.FC<GuildBountyModalProps> = ({
  isOpen,
  onClose,
  onAdopted
}) => {
  const [bounties, setBounties] = useState<GuildBounty[]>([]);
  const [selectedTree, setSelectedTree] = useState<string>('All');
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      api.getGuildBounties().then((res) => {
        if (res.bounties) setBounties(res.bounties);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdopt = async (bounty: GuildBounty) => {
    setAdoptingId(bounty.id);
    try {
      const res = await api.adoptGuildBounty(bounty.id);
      if (res.quest) {
        soundEngine.playQuestComplete();
        setAdoptedIds((prev) => new Set(prev).add(bounty.id));
        onAdopted(res.quest);
      }
    } catch (err: any) {
      console.error('Failed to adopt bounty:', err);
    } finally {
      setAdoptingId(null);
    }
  };

  const filtered = selectedTree === 'All'
    ? bounties
    : bounties.filter(b => b.category.toLowerCase() === selectedTree.toLowerCase());

  const getTreeIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'mind': return <Brain size={14} className="text-sky-400" />;
      case 'body': return <Dumbbell size={14} className="text-emerald-400" />;
      case 'craft': return <Hammer size={14} className="text-purple-400" />;
      case 'discipline': return <Scale size={14} className="text-amber-400" />;
      default: return <Sparkles size={14} className="text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="rpg-panel max-w-2xl w-full border-amber-500/50 bg-[#0E121E] max-h-[85vh] flex flex-col p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <Scroll size={22} className="text-amber-400" />
            <div>
              <h2 className="font-rpg text-lg font-bold text-white tracking-wide">
                Guild Bounty Hall
              </h2>
              <p className="text-xs text-amber-300/80">
                Official curated training deeds sanctioned by the Study Guild
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn w-8 h-8 rounded-lg hover:text-white"
            title="Close Bounty Hall"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tree Selector Tabs */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-800/80 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter size={12} /> Domain:
          </span>
          {[
            { id: 'All', label: 'All Bounties' },
            { id: 'mind', label: '🧠 Mind' },
            { id: 'body', label: '🏃 Body' },
            { id: 'craft', label: '⚒️ Craft' },
            { id: 'discipline', label: '⚖️ Discipline' }
          ].map((tree) => (
            <button
              key={tree.id}
              onClick={() => setSelectedTree(tree.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedTree === tree.id
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tree.label}
            </button>
          ))}
        </div>

        {/* Bounties List */}
        <div className="overflow-y-auto space-y-3 py-3 pr-1 flex-1">
          {filtered.map((bounty) => {
            const isAdopted = adoptedIds.has(bounty.id);
            return (
              <div
                key={bounty.id}
                className="p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/50 hover:border-amber-500/40 hover:bg-slate-900/80 transition flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700">
                      {getTreeIcon(bounty.category)}
                      <span className="capitalize text-slate-200">{bounty.category}</span>
                    </span>
                    <span className="badge-tag text-[10px] bg-slate-950 border border-slate-800 text-amber-300 font-bold">
                      {bounty.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {bounty.recurrence}
                    </span>
                  </div>
                  <h3 className="font-rpg font-bold text-sm text-white truncate">
                    {bounty.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                    {bounty.description}
                  </p>
                </div>

                {/* Claim Button */}
                <button
                  onClick={() => handleAdopt(bounty)}
                  disabled={isAdopted || adoptingId === bounty.id}
                  className={`rpg-btn py-1.5 px-3 text-xs whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                    isAdopted 
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 cursor-default' 
                      : 'rpg-btn-gold'
                  }`}
                >
                  {isAdopted ? (
                    <>
                      <Check size={13} strokeWidth={3} />
                      <span>Inscribed</span>
                    </>
                  ) : adoptingId === bounty.id ? (
                    <span>Summoning...</span>
                  ) : (
                    <>
                      <Plus size={13} />
                      <span>Claim Bounty</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-right">
          <button onClick={onClose} className="rpg-btn border border-slate-700 text-xs py-1.5 px-4 text-slate-300 hover:text-white">
            Return to Guild
          </button>
        </div>
      </div>
    </div>
  );
};

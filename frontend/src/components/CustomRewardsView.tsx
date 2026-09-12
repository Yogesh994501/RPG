import React, { useState } from 'react';
import { Gift, Plus, Trash2, Coins, Check, Sparkles } from 'lucide-react';
import { CustomReward } from '../types';
import { soundEngine } from '../services/soundEngine';

interface CustomRewardsViewProps {
  rewards: CustomReward[];
  userGold: number;
  onCreateReward: (data: { title: string; cost: number }) => Promise<void>;
  onClaimReward: (rewardId: string) => Promise<void>;
  onDeleteReward: (rewardId: string) => Promise<void>;
}

export const CustomRewardsView: React.FC<CustomRewardsViewProps> = ({
  rewards,
  userGold,
  onCreateReward,
  onClaimReward,
  onDeleteReward
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('100');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await onCreateReward({
        title: newTitle.trim(),
        cost: parseInt(newCost, 10) || 50
      });
      setNewTitle('');
      setNewCost('100');
      setShowAddForm(false);
      soundEngine.playCoinClink();
    } catch (err: any) {
      setError(err.message || 'Failed to create reward');
    }
  };

  const handleClaim = async (reward: CustomReward) => {
    if (userGold < reward.cost) {
      setError(`Need ${reward.cost - userGold} more Gold to claim "${reward.title}"!`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setClaimingId(reward.id);
    setError(null);
    try {
      soundEngine.playCoinClink();
      await onClaimReward(reward.id);
      setSuccessMsg(`🎉 Claimed "${reward.title}"! Enjoy your well-earned reward!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Claim failed');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="rpg-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Gift size={20} className="text-pink-400" />
          <h2 className="panel-title text-base font-bold">Real-World Rewards</h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rpg-btn rpg-btn-gold text-xs"
        >
          <Plus size={14} />
          <span>Add Custom Reward</span>
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded bg-red-950/70 border border-red-800 text-red-300 text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-3 p-2.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Add Custom Reward Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="mb-4 p-3 rounded-lg bg-slate-900 border border-amber-500/30 space-y-3">
          <h3 className="text-xs font-bold text-amber-300 uppercase">Set a Real-Life Bounty</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              placeholder="e.g. 1 Hour Video Gaming, Favorite Takeout..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="form-input text-xs sm:col-span-2"
            />
            <input
              type="number"
              min="10"
              required
              placeholder="Gold Cost"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              className="form-input text-xs"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rpg-btn rpg-btn-secondary text-xs py-1"
            >
              Cancel
            </button>
            <button type="submit" className="rpg-btn rpg-btn-gold text-xs py-1">
              Save Bounty
            </button>
          </div>
        </form>
      )}

      {/* Rewards List */}
      <div className="space-y-2.5">
        {rewards.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            No real-world rewards configured yet. Create one like "Cheat Meal" or "Movie Night"!
          </div>
        ) : (
          rewards.map((reward) => {
            const canAfford = userGold >= reward.cost;
            return (
              <div
                key={reward.id}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-pink-950/40 border border-pink-900/50 text-pink-400">
                    <Gift size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{reward.title}</h3>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-semibold">
                      <Coins size={12} />
                      <span>{reward.cost} Gold</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleClaim(reward)}
                    disabled={!canAfford || claimingId === reward.id}
                    className={`rpg-btn text-xs py-1 px-3 ${
                      canAfford
                        ? 'rpg-btn-gold'
                        : 'rpg-btn-secondary opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {claimingId === reward.id ? 'Claiming...' : 'Redeem'}
                  </button>

                  <button
                    onClick={() => onDeleteReward(reward.id)}
                    className="icon-btn w-7 h-7 hover:text-red-400"
                    title="Remove Reward"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

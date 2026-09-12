import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Coins, 
  Check, 
  Shield, 
  Sword, 
  FlaskConical, 
  Sparkles, 
  Award,
  Zap
} from 'lucide-react';
import { ShopItem, InventoryItem, ItemCategory } from '../types';
import { soundEngine } from '../services/soundEngine';

interface ArmoryShopProps {
  shopItems: ShopItem[];
  userInventory: InventoryItem[];
  userGold: number;
  onBuyItem: (itemId: string) => Promise<void>;
  onEquipItem: (inventoryId: string) => Promise<void>;
}

export const ArmoryShop: React.FC<ArmoryShopProps> = ({
  shopItems,
  userInventory,
  userGold,
  onBuyItem,
  onEquipItem
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'badge-common';
      case 'Uncommon': return 'badge-uncommon';
      case 'Rare': return 'badge-rare';
      case 'Epic': return 'badge-epic';
      case 'Legendary': return 'badge-legendary';
      case 'Mythic': return 'badge-mythic';
      default: return 'badge-common';
    }
  };

  const getCategoryIcon = (category: ItemCategory) => {
    switch (category) {
      case 'Weapon': return <Sword size={14} className="text-amber-400" />;
      case 'Armor': return <Shield size={14} className="text-blue-400" />;
      case 'Consumable': return <FlaskConical size={14} className="text-emerald-400" />;
      case 'Relic': return <Sparkles size={14} className="text-purple-400" />;
      case 'Title': return <Award size={14} className="text-pink-400" />;
    }
  };

  const filteredItems = shopItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    return true;
  });

  const isItemOwned = (itemId: string): InventoryItem | undefined => {
    return userInventory.find((inv) => inv.item_id === itemId);
  };

  const handleBuy = async (item: ShopItem) => {
    if (userGold < item.cost) {
      setError(`Need ${item.cost - userGold} more Gold to purchase ${item.name}!`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setBuyingId(item.id);
    setError(null);
    try {
      soundEngine.playCoinClink();
      await onBuyItem(item.id);
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
      setTimeout(() => setError(null), 3500);
    } finally {
      setBuyingId(null);
    }
  };

  const handleEquipToggle = async (invItem: InventoryItem) => {
    try {
      soundEngine.playEquipItem();
      await onEquipItem(invItem.inventory_id);
    } catch (err: any) {
      setError(err.message || 'Equip action failed');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="rpg-panel">
      {/* Shop Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className="text-amber-400" />
          <h2 className="panel-title text-base font-bold">The Merchant's Armory</h2>
        </div>
        <div className="stat-pill stat-pill-gold text-xs">
          <Coins size={14} />
          <span>{userGold} Gold Available</span>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="quest-tabs mb-4">
        {['All', 'Weapon', 'Armor', 'Relic', 'Consumable', 'Title'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`quest-tab-btn ${selectedCategory === cat ? 'quest-tab-btn-active' : ''}`}
          >
            {cat}s
          </button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const ownedInv = isItemOwned(item.id);
          const canAfford = userGold >= item.cost;

          return (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                {/* Item Top Row */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getCategoryIcon(item.category)}
                    <h3 className="text-xs font-bold text-white leading-tight">
                      {item.name}
                    </h3>
                  </div>
                  <span className={`badge-tag ${getRarityBadge(item.rarity)} text-[10px]`}>
                    {item.rarity}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Bonus Stat Chip */}
                {item.bonus_stat && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-amber-300 font-semibold mb-3">
                    <Zap size={10} />
                    <span>+{item.bonus_value} {item.bonus_stat}</span>
                  </div>
                )}
              </div>

              {/* Purchase / Equip Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1 font-bold text-xs text-amber-400 font-mono">
                  <Coins size={13} />
                  <span>{item.cost} Gold</span>
                </div>

                {ownedInv && item.category !== 'Consumable' ? (
                  <button
                    onClick={() => handleEquipToggle(ownedInv)}
                    className={`text-xs px-3 py-1 rounded font-semibold border transition ${
                      ownedInv.is_equipped
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {ownedInv.is_equipped ? 'Equipped ✓' : 'Equip Gear'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={buyingId === item.id || !canAfford}
                    className={`rpg-btn text-xs py-1 px-3 ${
                      canAfford ? 'rpg-btn-gold' : 'rpg-btn-secondary opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {buyingId === item.id ? 'Purchasing...' : 'Acquire'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

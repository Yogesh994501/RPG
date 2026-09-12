import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CharacterPanel } from './components/CharacterPanel';
import { QuestBoard } from './components/QuestBoard';
import { QuestModal } from './components/QuestModal';
import { BossRaid } from './components/BossRaid';
import { ArmoryShop } from './components/ArmoryShop';
import { ChronicleView } from './components/ChronicleView';
import { CustomRewardsView } from './components/CustomRewardsView';
import { AuthModal } from './components/AuthModal';
import { LevelUpCelebration } from './components/LevelUpCelebration';
import { 
  User, 
  Character, 
  Quest, 
  ShopItem, 
  InventoryItem, 
  Boss, 
  CombatAttributes, 
  Transaction, 
  QuestLog, 
  CustomReward, 
  LevelUpEvent 
} from './types';
import { api } from './services/api';
import { soundEngine } from './services/soundEngine';
import { 
  Scroll, 
  Skull, 
  ShoppingBag, 
  BookOpen, 
  Gift, 
  Sparkles, 
  Coins, 
  Flame 
} from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [equippedItems, setEquippedItems] = useState<InventoryItem[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [userInventory, setUserInventory] = useState<InventoryItem[]>([]);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [combatAttributes, setCombatAttributes] = useState<CombatAttributes | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [questLogs, setQuestLogs] = useState<QuestLog[]>([]);
  const [chronicleStats, setChronicleStats] = useState({
    totalCompletedQuests: 0,
    lifetimeGold: 0,
    lifetimeXp: 0,
    bossesDefeated: 0
  });
  const [customRewards, setCustomRewards] = useState<CustomReward[]>([]);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'quests' | 'boss' | 'armory' | 'chronicle' | 'rewards'>('quests');
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load all user data cold from SQLite backend
  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [charRes, questsRes, shopRes, bossRes, chronicleRes, rewardsRes] = await Promise.all([
        api.getCharacter(),
        api.getQuests(),
        api.getShop(),
        api.getBoss(),
        api.getChronicle(),
        api.getCustomRewards()
      ]);

      if (charRes.character) {
        setUser(charRes.user);
        setCharacter(charRes.character);
        setEquippedItems(charRes.equipped_items || []);
      }

      if (questsRes.quests) {
        setQuests(questsRes.quests);
      }

      if (shopRes.shop_items) {
        setShopItems(shopRes.shop_items);
        setUserInventory(shopRes.user_inventory || []);
      }

      if (bossRes.boss) {
        setBoss(bossRes.boss);
        setCombatAttributes(bossRes.combatAttributes);
      }

      if (chronicleRes.chronicle) {
        setTransactions(chronicleRes.chronicle);
        setQuestLogs(chronicleRes.questLogs || []);
        setChronicleStats(chronicleRes.stats);
      }

      if (rewardsRes.rewards) {
        setCustomRewards(rewardsRes.rewards);
      }
    } catch (err: any) {
      console.warn('Authentication or connection issue:', err.message);
      if (!api.getToken()) {
        setIsAuthModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Keyboard Shortcuts (N/Q: New Quest, B: Boss, S: Shop, C: Chronicle, M: Mute, ESC: close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if active element is an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        const nextMuted = soundEngine.toggleMute();
        setIsMuted(nextMuted);
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setEditingQuest(null);
        setIsQuestModalOpen(true);
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveTab('boss');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTab('armory');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveTab('chronicle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSound = () => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCharacter(null);
    setQuests([]);
    setIsAuthModalOpen(true);
  };

  // Quests CRUD Handlers
  const handleSaveQuest = async (questData: any) => {
    if (editingQuest) {
      const res = await api.updateQuest(editingQuest.id, questData);
      setQuests((prev) => prev.map((q) => (q.id === editingQuest.id ? res.quest : q)));
      showToast(`Quest "${res.quest.title}" revised!`);
    } else {
      const res = await api.createQuest(questData);
      setQuests((prev) => [res.quest, ...prev]);
      showToast(`Summoned new quest: "${res.quest.title}"!`);
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    await api.deleteQuest(questId);
    setQuests((prev) => prev.filter((q) => q.id !== questId));
    showToast('Quest abandoned.');
  };

  const handleCompleteQuest = async (questId: string) => {
    try {
      // 1. Optimistically mark quest as completed
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, is_completed: 1, completed_at: new Date().toISOString() } : q))
      );

      // 2. Authoritative server calculation
      const res = await api.completeQuest(questId);

      // 3. Update character stats
      if (res.reward) {
        setCharacter(res.reward.character);

        showToast(
          `⚔️ Deed Fulfilled! +${res.reward.xpEarned} XP, +${res.reward.goldEarned} Gold, ${res.reward.attributeGained} +${res.reward.attributeBonus}!`
        );

        if (res.reward.leveledUp) {
          setLevelUpEvent({
            level: res.reward.newLevel,
            hpRestored: res.reward.character.max_hp,
            attributeGained: res.reward.attributeGained,
            attributeBonus: res.reward.attributeBonus
          });
        }
      }

      // 4. Update Boss stats if affected
      if (res.bossCombat && res.bossCombat.boss) {
        setBoss(res.bossCombat.boss);
      }

      // 5. Refresh chronicle in background
      api.getChronicle().then((cRes) => {
        if (cRes.chronicle) {
          setTransactions(cRes.chronicle);
          setQuestLogs(cRes.questLogs || []);
          setChronicleStats(cRes.stats);
        }
      });
    } catch (err: any) {
      showToast(`Failed to complete quest: ${err.message}`);
      loadUserData();
    }
  };

  // Boss Attack Handler
  const handleAttackBoss = async () => {
    const res = await api.attackBoss();
    setBoss(res.boss);
    setCharacter(res.character);
    return res;
  };

  // Shop Buy Handler
  const handleBuyItem = async (itemId: string) => {
    const res = await api.buyItem(itemId);
    setCharacter(res.character);
    setUserInventory((prev) => [res.inventoryItem, ...prev]);
    showToast(`Acquired ${res.item.name}!`);

    // Reload chronicle
    api.getChronicle().then((cRes) => {
      if (cRes.chronicle) {
        setTransactions(cRes.chronicle);
        setChronicleStats(cRes.stats);
      }
    });
  };

  // Equip Item Handler
  const handleEquipItem = async (inventoryId: string) => {
    await api.equipItem(inventoryId);
    const charRes = await api.getCharacter();
    setCharacter(charRes.character);
    setEquippedItems(charRes.equipped_items || []);

    const shopRes = await api.getShop();
    setUserInventory(shopRes.user_inventory || []);
  };

  // Custom Rewards Handlers
  const handleCreateCustomReward = async (data: { title: string; cost: number }) => {
    const res = await api.createCustomReward(data);
    setCustomRewards((prev) => [...prev, res.reward]);
    showToast(`Registered bounty: "${res.reward.title}"!`);
  };

  const handleClaimCustomReward = async (rewardId: string) => {
    const res = await api.claimCustomReward(rewardId);
    setCharacter(res.character);
    showToast(`Claimed real-world reward: "${res.reward.title}"!`);

    api.getChronicle().then((cRes) => {
      if (cRes.chronicle) {
        setTransactions(cRes.chronicle);
        setChronicleStats(cRes.stats);
      }
    });
  };

  const handleDeleteCustomReward = async (rewardId: string) => {
    await api.deleteCustomReward(rewardId);
    setCustomRewards((prev) => prev.filter((r) => r.id !== rewardId));
    showToast('Reward discarded.');
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B0E14] border border-amber-500 text-amber-300 px-4 py-3 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles size={16} className="text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        user={user}
        character={character}
        onOpenNewQuest={() => {
          setEditingQuest(null);
          setIsQuestModalOpen(true);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        isMuted={isMuted}
        onToggleSound={handleToggleSound}
      />

      {/* Mobile Tab Bar */}
      <div className="flex sm:hidden items-center justify-around bg-slate-950 border-b border-slate-800 py-2 px-1 text-xs">
        <button
          onClick={() => setActiveTab('quests')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'quests' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          <Scroll size={16} />
          <span>Quests</span>
        </button>
        <button
          onClick={() => setActiveTab('boss')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'boss' ? 'text-red-400 font-bold' : 'text-slate-400'}`}
        >
          <Skull size={16} />
          <span>Boss</span>
        </button>
        <button
          onClick={() => setActiveTab('armory')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'armory' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
        >
          <ShoppingBag size={16} />
          <span>Armory</span>
        </button>
        <button
          onClick={() => setActiveTab('chronicle')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'chronicle' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}
        >
          <BookOpen size={16} />
          <span>Chronicle</span>
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'rewards' ? 'text-pink-400 font-bold' : 'text-slate-400'}`}
        >
          <Gift size={16} />
          <span>Rewards</span>
        </button>
      </div>

      {/* Main App Layout */}
      <main className="main-layout flex-1">
        {/* Left Column: Character Sheet */}
        {user && character ? (
          <CharacterPanel
            user={user}
            character={character}
            equippedItems={equippedItems}
            onUnequip={handleEquipItem}
          />
        ) : (
          <aside className="rpg-panel text-center py-12">
            <Sparkles size={36} className="mx-auto text-amber-400 mb-3 animate-pulse" />
            <h2 className="font-rpg text-base font-bold text-white mb-2">Awaken Your Hero</h2>
            <p className="text-xs text-slate-400 mb-4">
              Step into the realm of Aetheria to translate daily actions into heroic power.
            </p>
            <button onClick={() => setIsAuthModalOpen(true)} className="rpg-btn rpg-btn-gold text-xs">
              Enter the Realm
            </button>
          </aside>
        )}

        {/* Center Column: Primary Active View */}
        <div className="space-y-4">
          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <button
              onClick={() => setActiveTab('quests')}
              className={`rpg-btn text-xs ${activeTab === 'quests' ? 'rpg-btn-gold' : 'rpg-btn-secondary'}`}
            >
              <Scroll size={15} />
              <span>Quests & Deeds</span>
            </button>
            <button
              onClick={() => setActiveTab('boss')}
              className={`rpg-btn text-xs ${activeTab === 'boss' ? 'rpg-btn-gold' : 'rpg-btn-secondary'}`}
            >
              <Skull size={15} />
              <span>World Boss Raid</span>
            </button>
            <button
              onClick={() => setActiveTab('armory')}
              className={`rpg-btn text-xs ${activeTab === 'armory' ? 'rpg-btn-gold' : 'rpg-btn-secondary'}`}
            >
              <ShoppingBag size={15} />
              <span>Merchant's Armory</span>
            </button>
            <button
              onClick={() => setActiveTab('chronicle')}
              className={`rpg-btn text-xs ${activeTab === 'chronicle' ? 'rpg-btn-gold' : 'rpg-btn-secondary'}`}
            >
              <BookOpen size={15} />
              <span>The Chronicle</span>
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`rpg-btn text-xs ${activeTab === 'rewards' ? 'rpg-btn-gold' : 'rpg-btn-secondary'}`}
            >
              <Gift size={15} />
              <span>Real-World Rewards</span>
            </button>
          </div>

          {/* View Content based on Tab */}
          {activeTab === 'quests' && (
            <QuestBoard
              quests={quests}
              onCompleteQuest={handleCompleteQuest}
              onOpenNewQuest={() => {
                setEditingQuest(null);
                setIsQuestModalOpen(true);
              }}
              onEditQuest={(q) => {
                setEditingQuest(q);
                setIsQuestModalOpen(true);
              }}
              onDeleteQuest={handleDeleteQuest}
            />
          )}

          {activeTab === 'boss' && (
            <BossRaid
              boss={boss}
              combatAttributes={combatAttributes}
              onAttackBoss={handleAttackBoss}
            />
          )}

          {activeTab === 'armory' && (
            <ArmoryShop
              shopItems={shopItems}
              userInventory={userInventory}
              userGold={character?.gold || 0}
              onBuyItem={handleBuyItem}
              onEquipItem={handleEquipItem}
            />
          )}

          {activeTab === 'chronicle' && (
            <ChronicleView
              transactions={transactions}
              questLogs={questLogs}
              stats={chronicleStats}
            />
          )}

          {activeTab === 'rewards' && (
            <CustomRewardsView
              rewards={customRewards}
              userGold={character?.gold || 0}
              onCreateReward={handleCreateCustomReward}
              onClaimReward={handleClaimCustomReward}
              onDeleteReward={handleDeleteCustomReward}
            />
          )}
        </div>

        {/* Right Column: World Boss Raid Widget (on Desktop) */}
        <div className="right-sidebar hidden lg:block">
          <BossRaid
            boss={boss}
            combatAttributes={combatAttributes}
            onAttackBoss={handleAttackBoss}
          />
        </div>
      </main>

      {/* Footer / Shortcuts */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-2">
          <span>Keyboard Runes:</span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
            [Q/N] New Quest
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
            [B] Boss Raid
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
            [S] Armory
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
            [C] Chronicle
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
            [M] Mute Sound
          </span>
          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px] font-mono text-slate-300">
            [ESC] Close Modal
          </span>
        </div>
        <p>
          ChronoSlayer &copy; 2026. Empowering real-world discipline through server-authoritative RPG mechanics.
        </p>
      </footer>

      {/* Modals */}
      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        onSubmit={handleSaveQuest}
        editingQuest={editingQuest}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(data) => {
          setUser(data.user);
          setCharacter(data.character);
          loadUserData();
          showToast(`Welcome to Aetheria, ${data.user.username}!`);
        }}
      />

      <LevelUpCelebration
        event={levelUpEvent}
        onClose={() => setLevelUpEvent(null)}
      />
    </div>
  );
}

export default App;

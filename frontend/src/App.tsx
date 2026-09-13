import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CharacterPanel } from './components/CharacterPanel';
import { QuestBoard } from './components/QuestBoard';
import { QuestModal } from './components/QuestModal';
import { BossRaid } from './components/BossRaid';
import { BattleArena } from './components/BattleArena';
import { WorldMap } from './components/WorldMap';
import { ArmoryShop } from './components/ArmoryShop';
import { ChronicleView } from './components/ChronicleView';
import { CustomRewardsView } from './components/CustomRewardsView';
import { AuthModal } from './components/AuthModal';
import { LevelUpCelebration } from './components/LevelUpCelebration';
import { LootChestModal, LootReward } from './components/LootChestModal';
import { QuestSkeleton, DashboardSkeleton } from './components/LoadingSkeleton';
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
import { triggerCriticalHitParticles } from './services/particleEngine';
import { 
  Scroll, 
  Skull, 
  ShoppingBag, 
  BookOpen, 
  Gift, 
  Sparkles, 
  Swords,
  Compass
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
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'quests' | 'map' | 'boss' | 'armory' | 'chronicle' | 'rewards'>('quests');
  const [showMapInArena, setShowMapInArena] = useState(true);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);
  const [lootChest, setLootChest] = useState<LootReward | null>(null);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Battle Arena Animations
  const [isLunging, setIsLunging] = useState(false);
  const [isRecoiling, setIsRecoiling] = useState(false);
  const [combatNumber, setCombatNumber] = useState<{ amount: number; isCrit: boolean } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load user data cold from SQLite backend
  const loadUserData = useCallback(async () => {
    setIsLoading(true);
    try {
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

  const triggerCombatClash = (damage: number, isCrit: boolean) => {
    setIsLunging(true);
    setIsRecoiling(true);
    setCombatNumber({ amount: damage, isCrit });

    if (isCrit) {
      soundEngine.playCriticalHit();
      triggerCriticalHitParticles();
    } else {
      soundEngine.playSwordSlash();
    }

    setTimeout(() => {
      setIsLunging(false);
      setIsRecoiling(false);
    }, 500);

    setTimeout(() => {
      setCombatNumber(null);
    }, 1300);
  };

  const handleCompleteQuest = async (questId: string) => {
    const targetQuest = quests.find(q => q.id === questId);
    if (!targetQuest) return;

    // Snapshot state for optimistic rollback if anti-cheat rejects
    const previousQuests = [...quests];
    const previousCharacter = character ? { ...character } : null;

    try {
      // 1. Optimistic update
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, is_completed: 1, completed_at: new Date().toISOString() } : q))
      );

      // 2. Authoritative server calculation
      const res = await api.completeQuest(questId);

      // 3. Trigger Battle Arena Clash
      if (res.bossCombat) {
        triggerCombatClash(res.bossCombat.damageDealt, res.bossCombat.isCritical);
        if (res.bossCombat.boss) {
          setBoss(res.bossCombat.boss);
        }
      }

      // 4. Update character stats
      if (res.reward) {
        setCharacter(res.reward.character);

        showToast(
          `⚔️ Deed Fulfilled! +${res.reward.xpEarned} XP, +${res.reward.goldEarned} Gold, ${res.reward.attributeGained} +${res.reward.attributeBonus}!`
        );

        // Check for Mystery Loot Chest (triggered on Hard/Legendary deeds)
        if (targetQuest && (targetQuest.difficulty === 'Hard' || targetQuest.difficulty === 'Legendary')) {
          setTimeout(() => {
            setLootChest({
              title: `${targetQuest.difficulty} Deed Bounty Unsealed!`,
              gold: res.reward.goldEarned,
              xp: res.reward.xpEarned,
              attribute: res.reward.attributeGained,
              attributeBonus: res.reward.attributeBonus
            });
          }, 600);
        }

        if (res.reward.leveledUp) {
          setLevelUpEvent({
            level: res.reward.newLevel,
            hpRestored: res.reward.character.max_hp,
            attributeGained: res.reward.attributeGained,
            attributeBonus: res.reward.attributeBonus
          });
        }
      }

      // Refresh chronicle
      api.getChronicle().then((cRes) => {
        if (cRes.chronicle) {
          setTransactions(cRes.chronicle);
          setQuestLogs(cRes.questLogs || []);
          setChronicleStats(cRes.stats);
        }
      });
    } catch (err: any) {
      // Rollback optimistic state immediately
      setQuests(previousQuests);
      if (previousCharacter) {
        setCharacter(previousCharacter);
      }

      // Reject shake animation on the card
      const cardEl = document.getElementById(`quest-card-${questId}`);
      if (cardEl) {
        cardEl.classList.remove('shake-reject');
        void cardEl.offsetWidth; // reflow
        cardEl.classList.add('shake-reject');
      }

      soundEngine.playQuestAbandon();
      showToast(`⚠️ Deed Rejected: ${err.message || 'Already completed for this cycle!'}`);
    }
  };

  // Boss Attack Handler
  const handleAttackBoss = async () => {
    const res = await api.attackBoss();
    setBoss(res.boss);
    setCharacter(res.character);
    triggerCombatClash(res.damageDealt, res.isCritical);

    if (res.bossDefeated) {
      soundEngine.playBossVictory();
      setLootChest({
        title: `🏆 TITAN VANQUISHED: ${res.boss.boss_name}!`,
        gold: res.boss.reward_gold,
        xp: res.boss.reward_xp,
        specialItem: 'Titan Core Shard'
      });
    }

    return res;
  };

  // Shop Buy Handler
  const handleBuyItem = async (itemId: string) => {
    const res = await api.buyItem(itemId);
    setCharacter(res.character);
    setUserInventory((prev) => [res.inventoryItem, ...prev]);
    showToast(`Acquired ${res.item.name}!`);

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

  // Avatar Update Handler
  const handleUpdateAvatar = async (avatarId: string) => {
    const res = await api.updateProfile({ avatar_id: avatarId });
    if (res.user) {
      setUser(res.user);
      showToast('Hero archetype & portrait updated!');
    }
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
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'map' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          <Compass size={16} />
          <span>Realm</span>
        </button>
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
        {/* Left Column: Character Sheet with Paper-Doll Rig */}
        {isLoading && !character ? (
          <aside className="rpg-panel p-5 rounded-xl border border-slate-800 space-y-4 animate-pulse">
            <div className="w-20 h-20 rounded-xl bg-slate-800/80 mx-auto" />
            <div className="h-4 bg-slate-800 rounded w-2/3 mx-auto" />
            <div className="h-3 bg-slate-800/60 rounded w-1/2 mx-auto" />
            <div className="h-2.5 bg-slate-800 rounded-full w-full" />
          </aside>
        ) : user && character ? (
          <CharacterPanel
            user={user}
            character={character}
            equippedItems={equippedItems}
            onUnequip={handleEquipItem}
            onUpdateAvatar={handleUpdateAvatar}
            onOpenArmorySlot={(cat) => setActiveTab('armory')}
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

        {/* Center Column: Active View */}
        <div className="space-y-4">
          {/* Desktop Navigation Tabs */}
          <div className="hidden sm:flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <button
              onClick={() => setActiveTab('quests')}
              className={`rpg-btn text-xs ${activeTab === 'quests' ? 'rpg-btn-gold' : 'rpg-btn-secondary'}`}
            >
              <Scroll size={15} />
              <span>Quests & Arena</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`rpg-btn text-xs ${activeTab === 'map' ? 'rpg-btn-gold' : 'rpg-btn-secondary'}`}
            >
              <Compass size={15} />
              <span>🗺️ Realm Map (WASD)</span>
            </button>
            <button
              onClick={() => setActiveTab('boss')}
              className={`rpg-btn text-xs ${activeTab === 'boss' ? 'rpg-btn-gold' : 'rpg-btn-secondary'}`}
            >
              <Skull size={15} />
              <span>Boss Raid</span>
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

          {/* Standalone Realm Map View */}
          {activeTab === 'map' && user && character && (
            <WorldMap
              user={user}
              character={character}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onAwardBonus={(gold, xp, msg) => {
                showToast(msg);
                api.getCharacter().then((res) => {
                  if (res.character) setCharacter(res.character);
                });
              }}
            />
          )}

          {/* View Content based on Tab */}
          {activeTab === 'quests' && (
            isLoading && quests.length === 0 ? (
              <DashboardSkeleton />
            ) : (
              <>
              {/* Quick View Mode Switcher */}
              <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-xs mb-3">
                <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                  <Compass size={14} className="text-amber-400" />
                  <span>Realm View Mode:</span>
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowMapInArena(true)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      showMapInArena ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-sm' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <span>🗺️ 2D Walkable Realm</span>
                    <span className="text-[10px] bg-black/40 px-1 py-0.2 rounded font-mono text-amber-400 font-bold">WASD</span>
                  </button>
                  <button
                    onClick={() => setShowMapInArena(false)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      !showMapInArena ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-sm' : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    }`}
                  >
                    <span>⚔️ 1v1 Battle Arena</span>
                  </button>
                </div>
              </div>

              {/* Show either World Map or Battle Arena based on toggle */}
              {user && character && (
                showMapInArena ? (
                  <WorldMap
                    user={user}
                    character={character}
                    onNavigateTab={(tab) => setActiveTab(tab)}
                    onAwardBonus={(gold, xp, msg) => {
                      showToast(msg);
                      api.getCharacter().then((res) => {
                        if (res.character) setCharacter(res.character);
                      });
                    }}
                  />
                ) : (
                  boss && (
                    <BattleArena
                      user={user}
                      character={character}
                      boss={boss}
                      combatAttributes={combatAttributes}
                      equippedItems={equippedItems}
                      onAttackBoss={handleAttackBoss}
                      isLunging={isLunging}
                      isRecoiling={isRecoiling}
                      combatNumber={combatNumber}
                    />
                  )
                )
              )}

              {/* The Quest Board */}
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
            </>
          )
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

      <LootChestModal
        loot={lootChest}
        onClose={() => setLootChest(null)}
      />
    </div>
  );
}

export default App;

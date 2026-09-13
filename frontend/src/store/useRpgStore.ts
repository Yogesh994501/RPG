import { create } from 'zustand';
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
  CustomReward 
} from '../types';
import { api } from '../services/api';
import { soundEngine } from '../services/soundEngine';

interface RpgStore {
  user: User | null;
  character: Character | null;
  equippedItems: InventoryItem[];
  quests: Quest[];
  shopItems: ShopItem[];
  userInventory: InventoryItem[];
  boss: Boss | null;
  combatAttributes: CombatAttributes | null;
  transactions: Transaction[];
  questLogs: QuestLog[];
  chronicleStats: {
    totalCompletedQuests: number;
    lifetimeGold: number;
    lifetimeXp: number;
    bossesDefeated: number;
  };
  customRewards: CustomReward[];
  isLoading: boolean;
  activeTab: 'quests' | 'map' | 'boss' | 'armory' | 'chronicle' | 'rewards';
  showMapInArena: boolean;
  isMuted: boolean;
  toastMessage: string | null;

  // Actions
  loadUserData: () => Promise<void>;
  setUser: (u: User | null) => void;
  setCharacter: (c: Character | null) => void;
  setBoss: (b: Boss | null) => void;
  setQuests: (q: Quest[]) => void;
  addQuest: (q: Quest) => void;
  setActiveTab: (tab: 'quests' | 'map' | 'boss' | 'armory' | 'chronicle' | 'rewards') => void;
  setShowMapInArena: (val: boolean) => void;
  showToast: (msg: string) => void;
  toggleMute: () => boolean;
  logout: () => void;

  // Domain Actions
  saveQuest: (questData: any, editingId?: string | null) => Promise<Quest>;
  deleteQuest: (questId: string) => Promise<void>;
  completeQuest: (questId: string) => Promise<any>;
  attackBoss: () => Promise<any>;
  buyItem: (itemId: string) => Promise<void>;
  equipItem: (inventoryId: string) => Promise<void>;
  updateAvatar: (avatarId: string) => Promise<void>;
  createCustomReward: (data: { title: string; cost: number }) => Promise<void>;
  claimCustomReward: (rewardId: string) => Promise<void>;
  deleteCustomReward: (rewardId: string) => Promise<void>;
}

export const useRpgStore = create<RpgStore>((set, get) => ({
  user: null,
  character: null,
  equippedItems: [],
  quests: [],
  shopItems: [],
  userInventory: [],
  boss: null,
  combatAttributes: null,
  transactions: [],
  questLogs: [],
  chronicleStats: {
    totalCompletedQuests: 0,
    lifetimeGold: 0,
    lifetimeXp: 0,
    bossesDefeated: 0
  },
  customRewards: [],
  isLoading: true,
  activeTab: 'quests',
  showMapInArena: false,
  isMuted: soundEngine.getMuted(),
  toastMessage: null,

  loadUserData: async () => {
    set({ isLoading: true });
    try {
      const [charRes, questsRes, shopRes, bossRes, chronicleRes, rewardsRes] = await Promise.all([
        api.getCharacter(),
        api.getQuests(),
        api.getShop(),
        api.getBoss(),
        api.getChronicle(),
        api.getCustomRewards()
      ]);

      set({
        user: charRes.user || null,
        character: charRes.character || null,
        equippedItems: charRes.equipped_items || [],
        quests: questsRes.quests || [],
        shopItems: shopRes.shop_items || [],
        userInventory: shopRes.user_inventory || [],
        boss: bossRes.boss || null,
        combatAttributes: bossRes.combatAttributes || null,
        transactions: chronicleRes.chronicle || [],
        questLogs: chronicleRes.questLogs || [],
        chronicleStats: chronicleRes.stats || {
          totalCompletedQuests: 0,
          lifetimeGold: 0,
          lifetimeXp: 0,
          bossesDefeated: 0
        },
        customRewards: rewardsRes.rewards || []
      });
    } catch (err: any) {
      console.warn('Authentication or connection issue:', err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
  setCharacter: (character) => set({ character }),
  setBoss: (boss) => set({ boss }),
  setQuests: (quests) => set({ quests }),
  addQuest: (quest) => set((state) => ({ quests: [quest, ...state.quests] })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setShowMapInArena: (showMapInArena) => set({ showMapInArena }),
  
  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3500);
  },

  toggleMute: () => {
    const nextMuted = soundEngine.toggleMute();
    set({ isMuted: nextMuted });
    return nextMuted;
  },

  logout: () => {
    api.logout();
    set({
      user: null,
      character: null,
      quests: [],
      equippedItems: [],
      userInventory: []
    });
  },

  saveQuest: async (questData: any, editingId?: string | null) => {
    if (editingId) {
      const res = await api.updateQuest(editingId, questData);
      set({
        quests: get().quests.map((q) => (q.id === editingId ? res.quest : q))
      });
      get().showToast(`Quest "${res.quest.title}" revised!`);
      return res.quest;
    } else {
      const res = await api.createQuest(questData);
      set({
        quests: [res.quest, ...get().quests]
      });
      get().showToast(`Summoned new quest: "${res.quest.title}"!`);
      return res.quest;
    }
  },

  deleteQuest: async (questId: string) => {
    await api.deleteQuest(questId);
    set({
      quests: get().quests.filter((q) => q.id !== questId)
    });
    get().showToast('Quest abandoned.');
  },

  completeQuest: async (questId: string) => {
    const prevQuests = get().quests;
    const prevCharacter = get().character ? { ...get().character! } : null;

    // 1. Optimistic update
    set({
      quests: prevQuests.map((q) => 
        q.id === questId ? { ...q, is_completed: 1, completed_at: new Date().toISOString() } : q
      )
    });

    try {
      const res = await api.completeQuest(questId);

      // 2. Authoritative sync
      if (res.reward) {
        set({ character: res.reward.character });
      }
      if (res.bossCombat?.boss) {
        set({ boss: res.bossCombat.boss });
      }

      // Refresh Chronicle asynchronously
      api.getChronicle().then((cRes) => {
        if (cRes.chronicle) {
          set({
            transactions: cRes.chronicle,
            questLogs: cRes.questLogs || [],
            chronicleStats: cRes.stats
          });
        }
      });

      return res;
    } catch (err: any) {
      // Rollback optimistic state
      set({
        quests: prevQuests,
        ...(prevCharacter ? { character: prevCharacter } : {})
      });

      // Card reject shake
      const cardEl = document.getElementById(`quest-card-${questId}`);
      if (cardEl) {
        cardEl.classList.remove('shake-reject');
        void cardEl.offsetWidth;
        cardEl.classList.add('shake-reject');
      }

      soundEngine.playQuestAbandon();
      get().showToast(`⚠️ Deed Rejected: ${err.message || 'Already completed for this cycle!'}`);
      throw err;
    }
  },

  attackBoss: async () => {
    const res = await api.attackBoss();
    set({
      boss: res.boss,
      character: res.character
    });
    return res;
  },

  buyItem: async (itemId: string) => {
    const res = await api.buyItem(itemId);
    set({
      character: res.character,
      userInventory: [res.inventoryItem, ...get().userInventory]
    });
    get().showToast(`Acquired ${res.item.name}!`);

    api.getChronicle().then((cRes) => {
      if (cRes.chronicle) {
        set({
          transactions: cRes.chronicle,
          chronicleStats: cRes.stats
        });
      }
    });
  },

  equipItem: async (inventoryId: string) => {
    await api.equipItem(inventoryId);
    const [charRes, shopRes] = await Promise.all([
      api.getCharacter(),
      api.getShop()
    ]);
    set({
      character: charRes.character,
      equippedItems: charRes.equipped_items || [],
      userInventory: shopRes.user_inventory || []
    });
  },

  updateAvatar: async (avatarId: string) => {
    const res = await api.updateProfile({ avatar_id: avatarId });
    if (res.user) {
      set({ user: res.user });
      get().showToast('Hero archetype updated!');
    }
  },

  createCustomReward: async (data) => {
    const res = await api.createCustomReward(data);
    set({
      customRewards: [...get().customRewards, res.reward]
    });
    get().showToast(`Registered bounty: "${res.reward.title}"!`);
  },

  claimCustomReward: async (rewardId: string) => {
    const res = await api.claimCustomReward(rewardId);
    set({ character: res.character });
    get().showToast(`Claimed real-world reward: "${res.reward.title}"!`);

    api.getChronicle().then((cRes) => {
      if (cRes.chronicle) {
        set({
          transactions: cRes.chronicle,
          chronicleStats: cRes.stats
        });
      }
    });
  },

  deleteCustomReward: async (rewardId: string) => {
    await api.deleteCustomReward(rewardId);
    set({
      customRewards: get().customRewards.filter((r) => r.id !== rewardId)
    });
    get().showToast('Reward discarded.');
  }
}));

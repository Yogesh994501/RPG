const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('chronoslayer_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('chronoslayer_token', token);
    } else {
      localStorage.removeItem('chronoslayer_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({ error: 'Invalid JSON response from server' }));

    if (!res.ok) {
      if (res.status === 401) {
        this.setToken(null);
      }
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data as T;
  }

  // Auth
  public async register(payload: { username: string; email: string; password: string; timezone?: string }) {
    const tz = payload.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const data = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, timezone: tz })
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  public async login(payload: { emailOrUsername: string; password: string }) {
    const data = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.token) this.setToken(data.token);
    return data;
  }

  public async demoLogin() {
    const data = await this.request<any>('/auth/demo', { method: 'POST' });
    if (data.token) this.setToken(data.token);
    return data;
  }

  public async getMe() {
    return this.request<any>('/auth/me');
  }

  public logout() {
    this.setToken(null);
  }

  // Character
  public async getCharacter() {
    return this.request<any>('/character');
  }

  public async equipItem(inventoryId: string) {
    return this.request<any>('/character/equip', {
      method: 'POST',
      body: JSON.stringify({ inventoryId })
    });
  }

  public async updateProfile(payload: { title?: string; avatar_id?: string }) {
    return this.request<any>('/character/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  // Quests
  public async getQuests(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/quests?${query}` : '/quests';
    return this.request<any>(endpoint);
  }

  public async createQuest(payload: {
    title: string;
    description?: string;
    category?: string;
    attribute?: string;
    difficulty: string;
    recurrence?: string;
    quest_type?: string;
    due_date?: string | null;
    tags?: string[];
  }) {
    return this.request<any>('/quests', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async updateQuest(id: string, payload: any) {
    return this.request<any>(`/quests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  public async deleteQuest(id: string) {
    return this.request<any>(`/quests/${id}`, { method: 'DELETE' });
  }

  public async completeQuest(id: string) {
    return this.request<any>(`/quests/${id}/complete`, { method: 'POST' });
  }

  // Shop
  public async getShop() {
    return this.request<any>('/shop');
  }

  public async buyItem(itemId: string) {
    return this.request<any>('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  }

  // Boss
  public async getBoss() {
    return this.request<any>('/boss');
  }

  public async getTitanBestiary() {
    return this.request<any>('/boss/bestiary');
  }

  public async selectBoss(bossName: string) {
    return this.request<any>('/boss/select', {
      method: 'POST',
      body: JSON.stringify({ bossName })
    });
  }

  public async attackBoss() {
    return this.request<any>('/boss/attack', { method: 'POST' });
  }

  public async getGuildBounties() {
    return this.request<any>('/quests/guild-bounties');
  }

  public async adoptGuildBounty(bountyId: string) {
    return this.request<any>('/quests/adopt-bounty', {
      method: 'POST',
      body: JSON.stringify({ bountyId })
    });
  }

  // Chronicle
  public async getChronicle() {
    return this.request<any>('/chronicle');
  }

  // Custom Rewards
  public async getCustomRewards() {
    return this.request<any>('/custom-rewards');
  }

  public async createCustomReward(payload: { title: string; cost: number; icon?: string }) {
    return this.request<any>('/custom-rewards', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  public async claimCustomReward(id: string) {
    return this.request<any>(`/custom-rewards/${id}/claim`, { method: 'POST' });
  }

  public async deleteCustomReward(id: string) {
    return this.request<any>(`/custom-rewards/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiService();

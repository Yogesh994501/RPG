import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authGuard, AuthRequest } from '../middleware/auth.js';
import { processQuestCompletion } from '../services/rpgEngine.js';
import { executeBossAttack, getOrCreateBoss } from '../services/bossEngine.js';
import { validateBody, CreateQuestSchema, UpdateQuestSchema } from '../validators/schemas.js';

const router = Router();

const VALID_ATTRIBUTES = ['STR', 'INT', 'VIT', 'AGI', 'CHA'];
const VALID_CATEGORIES = ['mind', 'body', 'craft', 'discipline'];
const VALID_DIFFICULTIES = ['Trivial', 'Easy', 'Medium', 'Hard', 'Legendary', 'trivial', 'easy', 'medium', 'hard', 'legendary'];
const VALID_TYPES = ['Daily', 'Habit', 'Milestone'];
const VALID_RECURRENCES = ['none', 'daily', 'weekly'];

// In-Memory Rate Limiter for Script Prevention
const userRateLimits = new Map<string, { count: number; lastReset: number }>();
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId) || { count: 0, lastReset: now };
  if (now - entry.lastReset > 10000) {
    entry.count = 1;
    entry.lastReset = now;
  } else {
    entry.count++;
  }
  userRateLimits.set(userId, entry);
  return entry.count > 25; // max 25 actions per 10s
}

// Map skill tree categories to attributes
function mapCategoryToAttribute(cat: string): string {
  switch (cat.toLowerCase()) {
    case 'mind': return 'INT';
    case 'body': return 'VIT';
    case 'craft': return 'STR';
    case 'discipline': return 'CHA';
    default: return 'INT';
  }
}

export const GUILD_BOUNTY_TEMPLATES = [
  // Mind Tree
  { id: 'bounty_mind_deepwork', title: 'Deep Work: 60m Sprint', description: 'Complete a continuous 60-minute uninterrupted work session on your primary craft.', category: 'mind', attribute: 'INT', difficulty: 'Hard', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_mind_read', title: 'Arcane Lore: Read 25 Pages', description: 'Immerse in technical papers, non-fiction, or domain masterworks.', category: 'mind', attribute: 'INT', difficulty: 'Medium', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_mind_algo', title: 'Logic Trial: Solve Hard Problem', description: 'Tackle a challenging algorithmic, mathematical, or architectural problem.', category: 'mind', attribute: 'INT', difficulty: 'Hard', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_mind_vocab', title: 'Lexicon Mastery: 15 Terms', description: 'Learn and review 15 new foreign language or technical vocabulary items.', category: 'mind', attribute: 'INT', difficulty: 'Easy', quest_type: 'Daily', recurrence: 'daily' },

  // Body Tree
  { id: 'bounty_body_iron', title: 'Iron Temple: 45m Resistance Training', description: 'Lift weights, perform calisthenics, or complete rigorous physical exertion.', category: 'body', attribute: 'VIT', difficulty: 'Hard', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_body_cardio', title: 'Ranger Scout: 5km Cardio Run', description: 'Sustain aerobic endurance across a 5km trail, road, or treadmill pace.', category: 'body', attribute: 'VIT', difficulty: 'Hard', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_body_mobility', title: 'Joint Restoration & Stretching', description: 'Perform 15 minutes of dynamic mobility and spinal decompression.', category: 'body', attribute: 'VIT', difficulty: 'Easy', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_body_water', title: 'Elixir of Life: 3L Hydration', description: 'Maintain optimal cellular hydration from sunrise to sundown.', category: 'body', attribute: 'VIT', difficulty: 'Trivial', quest_type: 'Daily', recurrence: 'daily' },

  // Craft Tree
  { id: 'bounty_craft_commit', title: 'Masterwork Commit: Clean PR', description: 'Author a well-documented, test-backed pull request or code feature.', category: 'craft', attribute: 'STR', difficulty: 'Hard', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_craft_cleanse', title: 'Refactor Cleanse: Eliminate Debt', description: 'Prune dead code, optimize slow database queries, or modernize legacy modules.', category: 'craft', attribute: 'STR', difficulty: 'Medium', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_craft_design', title: 'Visual Guild: High-Fi Prototype', description: 'Craft an aesthetically stunning interface or wireframe mockup.', category: 'craft', attribute: 'STR', difficulty: 'Medium', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_craft_publish', title: 'Chronicle Publication: Tech Article', description: 'Share knowledge by writing and publishing an in-depth tutorial or post.', category: 'craft', attribute: 'STR', difficulty: 'Legendary', quest_type: 'Milestone', recurrence: 'weekly' },

  // Discipline Tree
  { id: 'bounty_disc_standup', title: 'Tactical Dawn: Plan Top 3 Goals', description: 'Prioritize your top 3 objectives before touching email or social feeds.', category: 'discipline', attribute: 'CHA', difficulty: 'Easy', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_disc_sunset', title: 'Digital Sunset: Sleep Routine', description: 'No blue-light screens within 60 minutes of sleep; prepare for tomorrow.', category: 'discipline', attribute: 'CHA', difficulty: 'Easy', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_disc_fast', title: 'Mindful Fuel: Zero Sugar Day', description: 'Fuel your vessel with whole foods, avoiding sugary snacks and energy crashes.', category: 'discipline', attribute: 'CHA', difficulty: 'Medium', quest_type: 'Daily', recurrence: 'daily' },
  { id: 'bounty_disc_epic', title: 'Grand Grandmaster Review', description: 'Complete a full retrospective of your weekly deeds, gold, and XP progress.', category: 'discipline', attribute: 'CHA', difficulty: 'Legendary', quest_type: 'Milestone', recurrence: 'weekly' }
];

// GET /api/quests/guild-bounties
router.get('/guild-bounties', authGuard, (req: AuthRequest, res: Response): void => {
  res.json({ success: true, bounties: GUILD_BOUNTY_TEMPLATES });
});

// POST /api/quests/adopt-bounty
router.post('/adopt-bounty', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { bountyId } = req.body;
    const template = GUILD_BOUNTY_TEMPLATES.find(b => b.id === bountyId);
    if (!template) {
      res.status(404).json({ error: 'Guild bounty template not found' });
      return;
    }

    const questId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO quests (id, user_id, title, description, attribute, category, difficulty, quest_type, recurrence, is_active, due_date, is_completed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, null, 0, ?)
    `).run(
      questId,
      userId,
      template.title,
      template.description,
      template.attribute,
      template.category,
      template.difficulty,
      template.quest_type,
      template.recurrence,
      createdAt
    );

    const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId);
    res.status(201).json({ success: true, quest });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quests
router.get('/', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { attribute, difficulty, quest_type, is_completed, search } = req.query;

    let query = 'SELECT * FROM quests WHERE user_id = ?';
    const params: any[] = [userId];

    if (attribute && VALID_ATTRIBUTES.includes(attribute as string)) {
      query += ' AND attribute = ?';
      params.push(attribute);
    }

    if (difficulty && VALID_DIFFICULTIES.includes(difficulty as string)) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (quest_type && VALID_TYPES.includes(quest_type as string)) {
      query += ' AND quest_type = ?';
      params.push(quest_type);
    }

    if (is_completed !== undefined) {
      query += ' AND is_completed = ?';
      params.push(is_completed === 'true' || is_completed === '1' ? 1 : 0);
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY is_completed ASC, created_at DESC';

    const quests = db.prepare(query).all(...params);
    res.json({ success: true, quests });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quests
router.post('/', authGuard, validateBody(CreateQuestSchema), (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    if (isRateLimited(userId)) {
      res.status(429).json({ error: 'Too many quests created recently. Please slow down.' });
      return;
    }
    const { title, description = '', category = 'mind', attribute, difficulty = 'Medium', quest_type = 'Daily', recurrence = 'daily', due_date = null } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Quest title is required and cannot be empty' });
      return;
    }

    const assignedCategory = VALID_CATEGORIES.includes(category?.toLowerCase()) ? category.toLowerCase() : 'mind';
    const assignedAttribute = attribute && VALID_ATTRIBUTES.includes(attribute) ? attribute : mapCategoryToAttribute(assignedCategory);
    const assignedRecurrence = VALID_RECURRENCES.includes(recurrence?.toLowerCase()) ? recurrence.toLowerCase() : (quest_type === 'Habit' || quest_type === 'Daily' ? 'daily' : 'none');

    const questId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO quests (id, user_id, title, description, attribute, category, difficulty, quest_type, recurrence, is_active, due_date, is_completed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, ?)
    `).run(
      questId,
      userId,
      title.trim(),
      description.trim(),
      assignedAttribute,
      assignedCategory,
      difficulty,
      quest_type,
      assignedRecurrence,
      due_date || null,
      createdAt
    );

    const newQuest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId);
    res.status(201).json({ success: true, quest: newQuest });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/quests/:id
router.put('/:id', authGuard, validateBody(UpdateQuestSchema), (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const questId = req.params.id;
    const { title, description, attribute, difficulty, quest_type, due_date } = req.body;

    const quest = db.prepare('SELECT * FROM quests WHERE id = ? AND user_id = ?').get(questId, userId);
    if (!quest) {
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        res.status(400).json({ error: 'Title cannot be blank' });
        return;
      }
      updates.push('title = ?');
      params.push(title.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description.trim());
    }

    if (attribute !== undefined) {
      if (!VALID_ATTRIBUTES.includes(attribute)) {
        res.status(400).json({ error: 'Invalid attribute' });
        return;
      }
      updates.push('attribute = ?');
      params.push(attribute);
    }

    if (difficulty !== undefined) {
      if (!VALID_DIFFICULTIES.includes(difficulty)) {
        res.status(400).json({ error: 'Invalid difficulty' });
        return;
      }
      updates.push('difficulty = ?');
      params.push(difficulty);
    }

    if (quest_type !== undefined) {
      if (!VALID_TYPES.includes(quest_type)) {
        res.status(400).json({ error: 'Invalid quest type' });
        return;
      }
      updates.push('quest_type = ?');
      params.push(quest_type);
    }

    if (due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(due_date || null);
    }

    if (updates.length > 0) {
      params.push(questId, userId);
      db.prepare(`UPDATE quests SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
    }

    const updatedQuest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId);
    res.json({ success: true, quest: updatedQuest });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/quests/:id
router.delete('/:id', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const questId = req.params.id;

    const result = db.prepare('DELETE FROM quests WHERE id = ? AND user_id = ?').run(questId, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    res.json({ success: true, message: 'Quest abandoned' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quests/:id/complete (Server-Authoritative Progression Engine)
router.post('/:id/complete', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    if (isRateLimited(userId)) {
      res.status(429).json({ error: 'Too many actions recorded. Take a breath, adventurer.' });
      return;
    }
    const rawId = req.params.id;
    const questId = Array.isArray(rawId) ? rawId[0] : rawId;
    const userTimezone: string = typeof req.user?.timezone === 'string' ? req.user.timezone : 'UTC';

    // 1. Process XP, Gold, Streaks, Stat Gains & Ledger Transaction (Single DB Transaction)
    const rewardResult = processQuestCompletion(userId, questId, userTimezone);

    // 2. Tying Quest Accomplishment directly to Boss Damage (STR + INT + AGI combat integration)
    const bossAttackResult = executeBossAttack(userId);

    res.json({
      success: true,
      delta: {
        xpGained: rewardResult.xpGained,
        goldGained: rewardResult.goldGained,
        leveledUp: rewardResult.leveledUp,
        newLevel: rewardResult.newLevel,
        streakChanged: rewardResult.streakChanged,
        currentStreak: rewardResult.currentStreak
      },
      reward: rewardResult,
      bossCombat: bossAttackResult
    });
  } catch (err: any) {
    const message = err.message || 'Failed to complete quest';
    if (message.includes('already fulfilled') || message.includes('already completed')) {
      res.status(400).json({ error: message, code: 'ALREADY_COMPLETED' });
      return;
    }
    res.status(500).json({ error: message });
  }
});

export default router;

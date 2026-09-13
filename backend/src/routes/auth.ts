import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authGuard, AuthRequest } from '../middleware/auth.js';
import { getOrCreateBoss } from '../services/bossEngine.js';
import { validateBody, RegisterSchema, LoginSchema } from '../validators/schemas.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chronoslayer_divine_secret_key_change_in_prod_777!';

function createDefaultQuests(userId: string) {
  const starterQuests = [
    // Mind Tree (INT)
    { title: 'Deep Study: 45m Focused Research & Learning', description: 'Immerse in single-task intellectual focus without tab hopping.', attribute: 'INT', category: 'mind', difficulty: 'Medium', quest_type: 'Daily', recurrence: 'daily' },
    { title: 'Algorithm Mastery & System Architecture Run', description: 'Solve a complex technical problem or review core system designs.', attribute: 'INT', category: 'mind', difficulty: 'Hard', quest_type: 'Daily', recurrence: 'daily' },
    { title: 'Read 20 Pages of Heavy Non-Fiction / Science', description: 'Expand your mental model by absorbing high-density literature.', attribute: 'INT', category: 'mind', difficulty: 'Easy', quest_type: 'Daily', recurrence: 'daily' },

    // Body Tree (VIT)
    { title: 'Morning Mobility & 20m Physical Conditioning', description: 'Hydrate with water and complete morning bodyweight fitness.', attribute: 'VIT', category: 'body', difficulty: 'Easy', quest_type: 'Daily', recurrence: 'daily' },
    { title: '10,000 Paces March (Cardio Endurance)', description: 'Hit your daily step goal to sustain energy and combat fatigue.', attribute: 'VIT', category: 'body', difficulty: 'Medium', quest_type: 'Daily', recurrence: 'daily' },
    { title: 'Citadel Hydration: 3 Liters Pure Water', description: 'Nourish every cell and sustain cognitive sharpness throughout the day.', attribute: 'VIT', category: 'body', difficulty: 'Trivial', quest_type: 'Daily', recurrence: 'daily' },

    // Craft Tree (STR)
    { title: 'Build & Ship a Production Feature Component', description: 'Write clean code, document logic, and push an authoritative commit.', attribute: 'STR', category: 'craft', difficulty: 'Hard', quest_type: 'Daily', recurrence: 'daily' },
    { title: 'Code Refactoring & Technical Debt Cleanse', description: 'Identify messy routines, simplify abstractions, and improve test coverage.', attribute: 'STR', category: 'craft', difficulty: 'Medium', quest_type: 'Daily', recurrence: 'daily' },
    { title: 'Guild Chronicle & Knowledge Base Contribution', description: 'Write a technical note or document an architectural learning.', attribute: 'STR', category: 'craft', difficulty: 'Easy', quest_type: 'Daily', recurrence: 'daily' },

    // Discipline Tree (CHA)
    { title: 'Digital Sunset & Habit Reflection', description: 'Power down screens before sleep and review accomplishments in the Chronicle.', attribute: 'CHA', category: 'discipline', difficulty: 'Trivial', quest_type: 'Daily', recurrence: 'daily' },
    { title: 'Morning Tactical Standup: 3 Crucial Deeds', description: 'Define the 3 highest leverage tasks before opening any message inbox.', attribute: 'CHA', category: 'discipline', difficulty: 'Easy', quest_type: 'Daily', recurrence: 'daily' },
    { title: 'Weekly Epic Guild Review & Strategy Planning', description: 'Analyze your weekly XP, streak multipliers, and plan upcoming quests.', attribute: 'CHA', category: 'discipline', difficulty: 'Legendary', quest_type: 'Milestone', recurrence: 'weekly' }
  ];

  const insertQuest = db.prepare(`
    INSERT INTO quests (id, user_id, title, description, attribute, category, difficulty, quest_type, recurrence, is_completed, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
  `);

  for (const q of starterQuests) {
    insertQuest.run(
      crypto.randomUUID(),
      userId,
      q.title,
      q.description,
      q.attribute,
      q.category,
      q.difficulty,
      q.quest_type,
      q.recurrence,
      new Date().toISOString()
    );
  }
}

// POST /api/auth/register
router.post('/register', validateBody(RegisterSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, timezone = 'UTC' } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (username.trim().length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email.toLowerCase(), username.trim());
    if (existing) {
      res.status(409).json({ error: 'Username or email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const createUserTx = db.transaction(() => {
      // 1. Insert user
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, avatar_id, title, timezone, created_at)
        VALUES (?, ?, ?, ?, 'warrior_1', 'Novice Adventurer', ?, ?)
      `).run(userId, username.trim(), email.toLowerCase(), passwordHash, timezone, now);

      // 2. Insert character
      db.prepare(`
        INSERT INTO characters (user_id, level, current_xp, gold, hp, max_hp, str, int, vit, agi, cha, current_streak, longest_streak, last_active_date)
        VALUES (?, 1, 0, 50, 100, 100, 10, 10, 10, 10, 10, 0, 0, NULL)
      `).run(userId);

      // 3. Insert starter transactions record
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount_gold, amount_xp, description, reference_id, created_at)
        VALUES (?, ?, 'ADMIN_ADJUSTMENT', 50, 0, 'Welcome to ChronoSlayer! Novice Adventurer Starter Pack', NULL, ?)
      `).run(crypto.randomUUID(), userId, now);

      // 4. Create starter quests & boss
      createDefaultQuests(userId);
      getOrCreateBoss(userId);
    });

    createUserTx();

    const token = jwt.sign({ id: userId, username: username.trim(), email: email.toLowerCase(), timezone }, JWT_SECRET, { expiresIn: '7d' });
    const character = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId);

    res.status(201).json({
      success: true,
      token,
      user: { id: userId, username: username.trim(), email: email.toLowerCase(), timezone, title: 'Novice Adventurer', avatar_id: 'warrior_1' },
      character
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', validateBody(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      res.status(400).json({ error: 'Email/Username and password are required' });
      return;
    }

    const user = db.prepare(`
      SELECT * FROM users WHERE email = ? OR username = ?
    `).get(emailOrUsername.toLowerCase().trim(), emailOrUsername.trim()) as any;

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, timezone: user.timezone }, JWT_SECRET, { expiresIn: '7d' });
    const character = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        timezone: user.timezone,
        title: user.title,
        avatar_id: user.avatar_id
      },
      character
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// POST /api/auth/demo (Instant one-click demo login for reviewers)
router.post('/demo', async (req: Request, res: Response): Promise<void> => {
  try {
    const demoEmail = 'hero.demo@chronoslayer.dev';
    const demoUsername = 'GrandChampion';
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(demoEmail) as any;

    if (!user) {
      const userId = 'demo-hero-id-001';
      const passwordHash = await bcrypt.hash('DemoHeroPass123!', 10);
      const now = new Date().toISOString();

      const createDemoTx = db.transaction(() => {
        db.prepare(`
          INSERT INTO users (id, username, email, password_hash, avatar_id, title, timezone, created_at)
          VALUES (?, ?, ?, ?, 'paladin_1', 'Vanquisher of Doubt', 'UTC', ?)
        `).run(userId, demoUsername, demoEmail, passwordHash, now);

        db.prepare(`
          INSERT INTO characters (user_id, level, current_xp, gold, hp, max_hp, str, int, vit, agi, cha, current_streak, longest_streak, last_active_date)
          VALUES (?, 3, 140, 280, 120, 120, 16, 18, 14, 15, 12, 5, 5, ?)
        `).run(userId, now.split('T')[0]);

        db.prepare(`
          INSERT INTO transactions (id, user_id, type, amount_gold, amount_xp, description, reference_id, created_at)
          VALUES (?, ?, 'ADMIN_ADJUSTMENT', 280, 140, 'Heroic Awakening: Demo Adventurer Initialized', NULL, ?)
        `).run(crypto.randomUUID(), userId, now);

        createDefaultQuests(userId);
        getOrCreateBoss(userId);
      });

      createDemoTx();
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(demoEmail) as any;
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email, timezone: user.timezone }, JWT_SECRET, { expiresIn: '7d' });
    const character = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        timezone: user.timezone,
        title: user.title,
        avatar_id: user.avatar_id
      },
      character
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo initialization failed' });
  }
});

// GET /api/auth/me
router.get('/me', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const user = db.prepare('SELECT id, username, email, avatar_id, title, timezone, created_at FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const character = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(req.user!.id);
    res.json({ success: true, user, character });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

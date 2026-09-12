import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authGuard, AuthRequest } from '../middleware/auth.js';
import { CharacterData } from '../services/rpgEngine.js';

const router = Router();

// GET /api/custom-rewards
router.get('/', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const rewards = db.prepare('SELECT * FROM custom_rewards WHERE user_id = ? ORDER BY cost ASC').all(userId);
    res.json({ success: true, rewards });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/custom-rewards
router.post('/', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { title, cost, icon = 'gift' } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Reward title is required' });
      return;
    }

    const numCost = parseInt(cost, 10);
    if (isNaN(numCost) || numCost <= 0) {
      res.status(400).json({ error: 'Cost must be a positive number' });
      return;
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO custom_rewards (id, user_id, title, cost, icon, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, title.trim(), numCost, icon, createdAt);

    const reward = db.prepare('SELECT * FROM custom_rewards WHERE id = ?').get(id);
    res.status(201).json({ success: true, reward });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/custom-rewards/:id/claim
router.post('/:id/claim', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const rewardId = req.params.id;

    const claimTx = db.transaction(() => {
      const reward = db.prepare('SELECT * FROM custom_rewards WHERE id = ? AND user_id = ?').get(rewardId, userId) as any;
      if (!reward) {
        throw new Error('Reward not found');
      }

      const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as CharacterData;
      if (!char) {
        throw new Error('Character not found');
      }

      if (char.gold < reward.cost) {
        throw new Error(`Insufficient gold! Reward costs ${reward.cost} Gold, but you have ${char.gold} Gold.`);
      }

      // Deduct gold
      db.prepare('UPDATE characters SET gold = gold - ? WHERE user_id = ?').run(reward.cost, userId);

      // Write to transaction ledger
      const txId = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount_gold, amount_xp, description, reference_id, created_at)
        VALUES (?, ?, 'CUSTOM_REWARD', ?, 0, ?, ?, ?)
      `).run(txId, userId, -reward.cost, `Claimed Real-World Reward: "${reward.title}"`, reward.id, now);

      const updatedChar = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId);
      return { reward, character: updatedChar };
    });

    const result = claimTx();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/custom-rewards/:id
router.delete('/:id', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const rewardId = req.params.id;

    const result = db.prepare('DELETE FROM custom_rewards WHERE id = ? AND user_id = ?').run(rewardId, userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Reward not found' });
      return;
    }

    res.json({ success: true, message: 'Reward removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

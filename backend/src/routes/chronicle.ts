import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authGuard, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/chronicle
router.get('/', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;

    // Fetch latest 50 transaction records (the immutable audit ledger)
    const transactions = db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(userId);

    // Fetch latest 50 quest completions
    const questLogs = db.prepare(`
      SELECT * FROM quest_logs 
      WHERE user_id = ? 
      ORDER BY completed_at DESC 
      LIMIT 50
    `).all(userId);

    // Aggregate lifetime stats
    const totalCompletedQuests = (db.prepare(`
      SELECT COUNT(*) as count FROM quest_logs WHERE user_id = ?
    `).get(userId) as { count: number }).count;

    const totals = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN amount_gold > 0 THEN amount_gold ELSE 0 END), 0) as lifetime_gold,
        COALESCE(SUM(amount_xp), 0) as lifetime_xp
      FROM transactions
      WHERE user_id = ?
    `).get(userId) as { lifetime_gold: number; lifetime_xp: number };

    const bossesDefeated = (db.prepare(`
      SELECT COUNT(*) as count FROM boss_raids WHERE user_id = ? AND is_defeated = 1
    `).get(userId) as { count: number }).count;

    res.json({
      success: true,
      chronicle: transactions,
      questLogs,
      stats: {
        totalCompletedQuests,
        lifetimeGold: totals.lifetime_gold,
        lifetimeXp: totals.lifetime_xp,
        bossesDefeated
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

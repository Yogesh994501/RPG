import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authGuard, AuthRequest } from '../middleware/auth.js';
import { getOrCreateBoss, executeBossAttack, getTitanBestiary, selectBossTarget } from '../services/bossEngine.js';

const router = Router();

// GET /api/boss
router.get('/', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const boss = getOrCreateBoss(userId);
    const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId);

    // Compute player's boss combat stats based on attributes
    const str = (char as any)?.str || 10;
    const int = (char as any)?.int || 10;
    const agi = (char as any)?.agi || 10;
    const vit = (char as any)?.vit || 10;
    const cha = (char as any)?.cha || 10;

    const baseDamage = 15 + Math.floor(str * 1.3);
    const critChance = Math.min(60, 5 + Math.floor(int * 0.5));
    const comboMultiplier = Number((1.0 + (agi * 0.015)).toFixed(2));
    const bonusLootMultiplier = Number((1.0 + (cha * 0.01)).toFixed(2));

    res.json({
      success: true,
      boss,
      combatAttributes: {
        baseDamage,
        critChance,
        comboMultiplier,
        vitalityShield: vit * 5,
        bonusLootMultiplier
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/boss/bestiary
router.get('/bestiary', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const titans = getTitanBestiary(userId);
    res.json({ success: true, titans });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boss/select
router.post('/select', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { bossName } = req.body;
    if (!bossName) {
      res.status(400).json({ error: 'bossName is required' });
      return;
    }
    const boss = selectBossTarget(userId, bossName);
    res.json({ success: true, boss });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/boss/attack
router.post('/attack', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const result = executeBossAttack(userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

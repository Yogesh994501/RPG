import { Router, Response } from 'express';
import { db } from '../db/database.js';
import { authGuard, AuthRequest } from '../middleware/auth.js';
import { getRequiredXpForLevel, CharacterData } from '../services/rpgEngine.js';

const router = Router();

// GET /api/character
router.get('/', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as CharacterData;
    if (!char) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    const equippedItems = db.prepare(`
      SELECT i.id as inventory_id, i.acquired_at, s.*
      FROM inventory i
      JOIN shop_items s ON i.item_id = s.id
      WHERE i.user_id = ? AND i.is_equipped = 1
    `).all(userId);

    const user = db.prepare('SELECT id, username, email, avatar_id, title, timezone FROM users WHERE id = ?').get(userId);

    const nextLevelXp = getRequiredXpForLevel(char.level);
    const xpProgressPercent = Math.min(100, Math.round((char.current_xp / nextLevelXp) * 100));

    // Calculate active multipliers
    let streakMultiplier = 1.0;
    if (char.current_streak >= 7) streakMultiplier = 1.30;
    else if (char.current_streak >= 3) streakMultiplier = 1.15;

    res.json({
      success: true,
      user,
      character: {
        ...char,
        next_level_xp: nextLevelXp,
        xp_progress_percent: xpProgressPercent,
        streak_multiplier: streakMultiplier
      },
      equipped_items: equippedItems
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/character/equip
router.post('/equip', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { inventoryId } = req.body;

    if (!inventoryId) {
      res.status(400).json({ error: 'inventoryId is required' });
      return;
    }

    const equipTx = db.transaction(() => {
      const invItem = db.prepare(`
        SELECT i.*, s.category, s.name 
        FROM inventory i
        JOIN shop_items s ON i.item_id = s.id
        WHERE i.id = ? AND i.user_id = ?
      `).get(inventoryId, userId) as any;

      if (!invItem) {
        throw new Error('Item not found in your inventory');
      }

      const newEquippedState = invItem.is_equipped ? 0 : 1;

      // If equipping, unequip existing item of same category (e.g. Weapon or Armor)
      if (newEquippedState === 1 && (invItem.category === 'Weapon' || invItem.category === 'Armor')) {
        db.prepare(`
          UPDATE inventory 
          SET is_equipped = 0 
          WHERE user_id = ? AND item_id IN (SELECT id FROM shop_items WHERE category = ?)
        `).run(userId, invItem.category);
      }

      db.prepare('UPDATE inventory SET is_equipped = ? WHERE id = ?').run(newEquippedState, inventoryId);

      return { is_equipped: newEquippedState, name: invItem.name, category: invItem.category };
    });

    const result = equipTx();
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/character/profile
router.put('/profile', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { title, avatar_id } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (avatar_id !== undefined) {
      updates.push('avatar_id = ?');
      params.push(avatar_id);
    }

    if (updates.length > 0) {
      params.push(userId);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedUser = db.prepare('SELECT id, username, email, avatar_id, title, timezone FROM users WHERE id = ?').get(userId);
    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

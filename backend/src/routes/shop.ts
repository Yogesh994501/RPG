import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.js';
import { authGuard, AuthRequest } from '../middleware/auth.js';
import { CharacterData, getRequiredXpForLevel } from '../services/rpgEngine.js';
import { validateBody, BuyItemSchema } from '../validators/schemas.js';

const router = Router();

// GET /api/shop
router.get('/', authGuard, (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const items = db.prepare('SELECT * FROM shop_items ORDER BY cost ASC').all();

    const userInventory = db.prepare(`
      SELECT i.id as inventory_id, i.item_id, i.is_equipped, i.acquired_at, s.*
      FROM inventory i
      JOIN shop_items s ON i.item_id = s.id
      WHERE i.user_id = ?
    `).all(userId);

    res.json({ success: true, shop_items: items, user_inventory: userInventory });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shop/buy
router.post('/buy', authGuard, validateBody(BuyItemSchema), (req: AuthRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { itemId } = req.body;

    if (!itemId) {
      res.status(400).json({ error: 'itemId is required' });
      return;
    }

    const buyTx = db.transaction(() => {
      // 1. Fetch item
      const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId) as any;
      if (!item) {
        throw new Error('Item does not exist');
      }

      // 2. Fetch character gold
      const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as CharacterData;
      if (!char) {
        throw new Error('Character not found');
      }

      if (char.gold < item.cost) {
        throw new Error(`Insufficient gold! Item costs ${item.cost} Gold, but you only have ${char.gold} Gold.`);
      }

      // 3. For non-consumables, verify user does not already own this item
      if (item.category !== 'Consumable') {
        const owned = db.prepare('SELECT id FROM inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId);
        if (owned) {
          throw new Error('You already possess this item in your inventory!');
        }
      }

      // 4. Deduct gold
      let newGold = char.gold - item.cost;
      let newHp = char.hp;
      let newMaxHp = char.max_hp;
      let newXp = char.current_xp;
      let newLevel = char.level;

      // Special consumable effects
      if (item.id === 'con_draught_vitality') {
        newHp = newMaxHp; // full heal
      } else if (item.id === 'con_elixir_clarity') {
        newXp += 100;
        const reqXp = getRequiredXpForLevel(newLevel);
        if (newXp >= reqXp) {
          newXp -= reqXp;
          newLevel += 1;
          newMaxHp += 10;
          newHp = newMaxHp;
        }
      }

      db.prepare(`
        UPDATE characters 
        SET gold = ?, hp = ?, max_hp = ?, current_xp = ?, level = ?
        WHERE user_id = ?
      `).run(newGold, newHp, newMaxHp, newXp, newLevel, userId);

      // 5. Insert into inventory
      const invId = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO inventory (id, user_id, item_id, is_equipped, acquired_at)
        VALUES (?, ?, ?, 0, ?)
      `).run(invId, userId, itemId, now);

      // 6. Record transaction
      const txId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO transactions (id, user_id, type, amount_gold, amount_xp, description, reference_id, created_at)
        VALUES (?, ?, 'SHOP_PURCHASE', ?, 0, ?, ?, ?)
      `).run(txId, userId, -item.cost, `Purchased ${item.rarity} ${item.category}: "${item.name}"`, itemId, now);

      const updatedChar = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(userId) as any;
      const nextLevelXp = getRequiredXpForLevel(updatedChar.level);
      updatedChar.next_level_xp = nextLevelXp;
      updatedChar.xp_progress_percent = Math.min(100, Math.round((updatedChar.current_xp / nextLevelXp) * 100));
      let sMult = 1.0;
      if (updatedChar.current_streak >= 7) sMult = 1.30;
      else if (updatedChar.current_streak >= 3) sMult = 1.15;
      updatedChar.streak_multiplier = sMult;

      const inventoryItem = db.prepare(`
        SELECT i.id as inventory_id, i.item_id, i.is_equipped, i.acquired_at, s.*
        FROM inventory i
        JOIN shop_items s ON i.item_id = s.id
        WHERE i.id = ?
      `).get(invId);

      return {
        item,
        inventoryItem,
        character: updatedChar
      };
    });

    const result = buyTx();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

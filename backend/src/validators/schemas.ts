import { z, ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

// 1. Auth Schemas
export const RegisterSchema = z.object({
  username: z.string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long'),
  timezone: z.string().optional().default('UTC')
});

export const LoginSchema = z.object({
  emailOrUsername: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

// 2. Quest Schemas
export const CreateQuestSchema = z.object({
  title: z.string().trim().min(1, 'Quest title cannot be empty').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().default(''),
  category: z.enum(['mind', 'body', 'craft', 'discipline']).optional().default('mind'),
  attribute: z.enum(['STR', 'INT', 'VIT', 'AGI', 'CHA']).optional(),
  difficulty: z.enum(['Trivial', 'Easy', 'Medium', 'Hard', 'Legendary']).optional().default('Medium'),
  recurrence: z.enum(['none', 'daily', 'weekly']).optional().default('none'),
  quest_type: z.enum(['Daily', 'Habit', 'Milestone']).optional().default('Daily'),
  due_date: z.string().nullable().optional()
});

export const UpdateQuestSchema = CreateQuestSchema.partial();

// 3. Custom Rewards Schemas
export const CreateRewardSchema = z.object({
  title: z.string().trim().min(1, 'Reward title cannot be empty').max(100, 'Title cannot exceed 100 characters'),
  cost: z.number().int('Cost must be an integer').positive('Cost must be greater than 0').max(1000000, 'Cost is too high'),
  icon: z.string().optional().default('gift')
});

// 4. Shop Schemas
export const BuyItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required')
});

export const EquipItemSchema = z.object({
  inventoryId: z.string().min(1, 'Inventory ID is required')
});

// 5. Generic Validation Middleware
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues;
        return res.status(400).json({
          error: issues[0]?.message || 'Validation Error',
          code: 'VALIDATION_ERROR',
          details: issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
        });
      }
      return res.status(400).json({ error: 'Malformed request payload', code: 'MALFORMED_INPUT' });
    }
  };
};

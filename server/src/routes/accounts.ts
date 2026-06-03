import { Router, Response } from 'express';
import prisma from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const accounts = await prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id, name, type, currency } = req.body;

    const account = await prisma.account.create({
      data: {
        id: id || undefined,
        userId,
        name,
        type,
        currency
      }
    });

    res.status(201).json(account);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { name, type, currency, isArchived } = req.body;

    const account = await prisma.account.update({
      where: { id, userId },
      data: { name, type, currency, isArchived }
    });

    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update account' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    await prisma.account.update({
      where: { id, userId },
      data: { isArchived: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
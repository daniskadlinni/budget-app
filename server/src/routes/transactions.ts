import { Router, Response } from 'express';
import prisma from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { page = '1', limit = '50', startDate, endDate, accountId } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    if (accountId) where.accountId = accountId;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { date: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    });

    const total = await prisma.transaction.count({ where });

    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { id, accountId, categoryId, type, amount, date, note, tags } = req.body;
    const userId = String(req.userId);

    const transaction = await prisma.transaction.create({
      data: {
        id,
        userId,
        accountId,
        categoryId,
        type,
        amount,
        date: new Date(date),
        note,
        tags: tags || []
      } as any
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { accountId, categoryId, type, amount, date, note, tags } = req.body;

    const transaction = await prisma.transaction.update({
      where: { id, userId },
      data: {
        accountId,
        categoryId,
        type,
        amount,
        date: date ? new Date(date) : undefined,
        note,
        tags
      },
      include: { account: true, category: true }
    });

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await prisma.transaction.delete({ where: { id, userId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
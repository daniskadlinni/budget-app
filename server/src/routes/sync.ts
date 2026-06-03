import { Router, Request, Response } from 'express';
import prisma from '../db/prisma';
import { io } from '../index';

const router = Router();

interface SyncChange {
  id: string;
  _deleted?: boolean;
  updatedAt?: string;
  [key: string]: any;
}

router.post('/push', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { lastSyncTimestamp, changes } = req.body;

    const results: any = { accounts: [], categories: [], transactions: [] };

    if (changes.accounts?.length) {
      for (const account of changes.accounts) {
        if (account._deleted) {
          await prisma.account.update({
            where: { id: account.id, userId },
            data: { isArchived: true }
          });
        } else if (account.updatedAt) {
          const existing = await prisma.account.findUnique({ where: { id: account.id } });
          if (!existing || new Date(existing.updatedAt) < new Date(account.updatedAt)) {
            await prisma.account.upsert({
              where: { id: account.id },
              create: { id: account.id, userId, name: account.name, type: account.type, currency: account.currency },
              update: { name: account.name, type: account.type, currency: account.currency }
            });
          }
        } else {
          await prisma.account.upsert({
            where: { id: account.id },
            create: { id: account.id, userId, name: account.name, type: account.type, currency: account.currency },
            update: { name: account.name, type: account.type, currency: account.currency }
          });
        }
        results.accounts.push(account.id);
      }
    }

    if (changes.categories?.length) {
      for (const category of changes.categories) {
        if (category._deleted) {
          await prisma.category.delete({ where: { id: category.id, userId } });
        } else {
          await prisma.category.upsert({
            where: { id: category.id },
            create: { id: category.id, userId, name: category.name, type: category.type, icon: category.icon, color: category.color },
            update: { name: category.name, type: category.type, icon: category.icon, color: category.color }
          });
        }
        results.categories.push(category.id);
      }
    }

    if (changes.transactions?.length) {
      for (const transaction of changes.transactions) {
        if (transaction._deleted) {
          await prisma.transaction.delete({ where: { id: transaction.id, userId } });
        } else {
          await prisma.transaction.upsert({
            where: { id: transaction.id },
            create: {
              id: transaction.id,
              userId,
              accountId: transaction.accountId,
              categoryId: transaction.categoryId,
              type: transaction.type,
              amount: transaction.amount,
              date: new Date(transaction.date),
              note: transaction.note,
              tags: transaction.tags || []
            },
            update: {
              accountId: transaction.accountId,
              categoryId: transaction.categoryId,
              type: transaction.type,
              amount: transaction.amount,
              date: new Date(transaction.date),
              note: transaction.note,
              tags: transaction.tags || []
            }
          });
        }
        results.transactions.push(transaction.id);
      }
    }

    io.to(`user:${userId}`).emit('sync-complete', { synced: results });

    res.json({ success: true, synced: results });
  } catch (error) {
    console.error('Sync push error:', error);
    res.status(500).json({ error: 'Sync push failed' });
  }
});

router.get('/pull', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const since = req.query.since as string;

    const sinceDate = since ? new Date(since) : new Date(0);

    const [accounts, categories, transactions] = await Promise.all([
      prisma.account.findMany({
        where: { userId, updatedAt: { gt: sinceDate } }
      }),
      prisma.category.findMany({
        where: { userId, updatedAt: { gt: sinceDate } }
      }),
      prisma.transaction.findMany({
        where: { userId, updatedAt: { gt: sinceDate } },
        include: { account: true, category: true }
      })
    ]);

    res.json({
      accounts,
      categories,
      transactions,
      serverTimestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Sync pull failed' });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { period = 'month' } = req.query;

    let startDate = new Date();
    if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId, date: { gte: startDate } },
      include: { category: true }
    });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const byCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const catName = t.category?.name || 'Без категории';
        acc[catName] = (acc[catName] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory,
      period
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.delete('/reset', async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.category.deleteMany({ where: { userId } });

    const defaultCategories = [
      { id: 'cat-salary', name: 'Зарплата', type: 'income', color: '#4CAF50' },
      { id: 'cat-bonus', name: 'Премия', type: 'income', color: '#8BC34A' },
      { id: 'cat-freelance', name: 'Левак', type: 'income', color: '#CDDC39' },
      { id: 'cat-other-inc', name: 'Прочее', type: 'income', color: '#9E9E9E' },
      { id: 'cat-food', name: 'Продукты', type: 'expense', color: '#FF5722' },
      { id: 'cat-transport', name: 'Транспорт', type: 'expense', color: '#2196F3' },
      { id: 'cat-entertainment', name: 'Развлечения', type: 'expense', color: '#9C27B0' },
      { id: 'cat-utilities', name: 'Коммунальные', type: 'expense', color: '#607D8B' },
      { id: 'cat-shopping', name: 'Покупки', type: 'expense', color: '#E91E63' },
      { id: 'cat-health', name: 'Здоровье', type: 'expense', color: '#F44336' },
      { id: 'cat-education', name: 'Образование', type: 'expense', color: '#3F51B5' },
      { id: 'cat-other-exp', name: 'Прочее', type: 'expense', color: '#9E9E9E' }
    ];

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({ ...cat, userId }))
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

export default router;
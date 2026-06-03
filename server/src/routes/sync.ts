import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { accounts, categories, transactions, budgets, goals, subscriptions } = req.body;

    await prisma.syncData.deleteMany({});

    if (accounts) await prisma.syncData.create({ data: { key: 'accounts', value: JSON.stringify(accounts) } });
    if (categories) await prisma.syncData.create({ data: { key: 'categories', value: JSON.stringify(categories) } });
    if (transactions) await prisma.syncData.create({ data: { key: 'transactions', value: JSON.stringify(transactions) } });
    if (budgets) await prisma.syncData.create({ data: { key: 'budgets', value: JSON.stringify(budgets) } });
    if (goals) await prisma.syncData.create({ data: { key: 'goals', value: JSON.stringify(goals) } });
    if (subscriptions) await prisma.syncData.create({ data: { key: 'subscriptions', value: JSON.stringify(subscriptions) } });

    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('Sync error:', e);
    res.status(500).json({ error: 'Sync failed' });
  }
});

router.get('/sync', async (req: Request, res: Response) => {
  try {
    const records = await prisma.syncData.findMany();
    const data: Record<string, any> = {};
    records.forEach(r => { data[r.key] = JSON.parse(r.value); });
    res.json({ ...data, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('Get sync error:', e);
    res.status(500).json({ error: 'Get sync failed' });
  }
});

export default router;
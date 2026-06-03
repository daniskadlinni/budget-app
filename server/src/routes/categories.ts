import { Router, Response } from 'express';
import prisma from '../db/prisma';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    const { id, name, type, icon, color } = req.body;

    const category = await prisma.category.create({
      data: { id, userId, name, type, icon, color }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, type, icon, color } = req.body;

    const category = await prisma.category.update({
      where: { id, userId },
      data: { name, type, icon, color }
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await prisma.category.delete({ where: { id, userId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
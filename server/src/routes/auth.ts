import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../db/prisma';
import { generateTokens } from '../middleware/auth';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' }
});

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, baseCurrency } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        baseCurrency: baseCurrency || 'USD'
      }
    });

    const { accessToken, refreshToken } = generateTokens(user.id);

    const defaultCategories = [
      { name: 'Зарплата', type: 'income', icon: 'salary', color: '#4CAF50' },
      { name: 'Фриланс', type: 'income', icon: 'freelance', color: '#8BC34A' },
      { name: 'Инвестиции', type: 'income', icon: 'investment', color: '#CDDC39' },
      { name: 'Продукты', type: 'expense', icon: 'food', color: '#FF5722' },
      { name: 'Транспорт', type: 'expense', icon: 'transport', color: '#2196F3' },
      { name: 'Развлечения', type: 'expense', icon: 'entertainment', color: '#9C27B0' },
      { name: 'Коммунальные услуги', type: 'expense', icon: 'utilities', color: '#607D8B' },
      { name: 'Покупки', type: 'expense', icon: 'shopping', color: '#E91E63' }
    ];

    await prisma.category.createMany({
      data: defaultCategories.map(cat => ({
        ...cat,
        userId: user.id
      }))
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, baseCurrency: user.baseCurrency },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      user: { id: user.id, email: user.email, baseCurrency: user.baseCurrency },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh-secret'
    ) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokens = generateTokens(user.id);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
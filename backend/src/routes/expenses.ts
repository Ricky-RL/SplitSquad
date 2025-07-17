import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/expenses?groupId=...
router.get('/', async (req, res) => {
  const groupId = req.query.groupId as string;
  if (!groupId) return res.status(400).json({ error: 'Missing groupId' });
  try {
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  const { groupId, description, amount, payerId, date, splitType, splitWith, imageUrl } = req.body;
  if (!groupId || !description || !amount || !payerId || !date || !splitType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const expense = await prisma.expense.create({
      data: {
        groupId,
        description,
        amount: parseFloat(amount),
        payerId,
        date: new Date(date),
        splitType,
        splitWith: splitWith || [],
        imageUrl,
      },
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get expense ${req.params.id} (not implemented)` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update expense ${req.params.id} (not implemented)` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete expense ${req.params.id} (not implemented)` });
});

export default router; 
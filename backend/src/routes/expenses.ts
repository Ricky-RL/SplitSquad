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

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  const expenseId = req.params.id;
  const { description, amount, payerId, date, splitType, splitWith, imageUrl } = req.body;
  try {
    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        description,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        payerId,
        date: date ? new Date(date) : undefined,
        splitType,
        splitWith,
        imageUrl,
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  const expenseId = req.params.id;
  try {
    await prisma.expense.delete({ where: { id: expenseId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router; 
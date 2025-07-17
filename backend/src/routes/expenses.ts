import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'List all expenses (not implemented)' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create expense (not implemented)' });
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
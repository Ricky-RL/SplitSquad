import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'List all members (not implemented)' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create member (not implemented)' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get member ${req.params.id} (not implemented)` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update member ${req.params.id} (not implemented)` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete member ${req.params.id} (not implemented)` });
});

export default router; 
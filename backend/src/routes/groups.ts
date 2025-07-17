import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'List all groups (not implemented)' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create group (not implemented)' });
});

router.get('/:id', (req, res) => {
  res.json({ message: `Get group ${req.params.id} (not implemented)` });
});

router.put('/:id', (req, res) => {
  res.json({ message: `Update group ${req.params.id} (not implemented)` });
});

router.delete('/:id', (req, res) => {
  res.json({ message: `Delete group ${req.params.id} (not implemented)` });
});

export default router; 
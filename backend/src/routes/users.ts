import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { id, email, name, etransferEmail, etransferPhone } = req.body;
  if (!id || !email) return res.status(400).json({ error: 'Missing id or email' });

  try {
    const user = await prisma.user.upsert({
      where: { id },
      update: { email, name, etransferEmail, etransferPhone },
      create: { id, email, name, password: '', etransferEmail, etransferPhone }, // password blank for OAuth users
    });

    // Convert pending group invites to confirmed memberships
    const pendingInvites = await prisma.groupPendingMember.findMany({
      where: { email },
    });
    for (const invite of pendingInvites) {
      await prisma.group.update({
        where: { id: invite.groupId },
        data: {
          members: { connect: { id: user.id } },
        },
      });
      await prisma.groupPendingMember.delete({ where: { id: invite.id } });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upsert user' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router; 
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { id, email, name } = req.body;
  if (!id || !email) return res.status(400).json({ error: 'Missing id or email' });

  try {
    const user = await prisma.user.upsert({
      where: { id },
      update: { email, name },
      create: { id, email, name, password: '' }, // password blank for OAuth users
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

export default router; 
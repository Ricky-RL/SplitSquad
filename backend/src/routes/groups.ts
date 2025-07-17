import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// For now, use a hardcoded userId (replace with real auth later)
const HARDCODED_USER_ID = 'demo-user-id';

// List all groups for the user
router.get('/', async (req, res) => {
  try {
    const userEmail = req.query.userId as string || HARDCODED_USER_ID;
    const groups = await prisma.group.findMany({
      where: {
        OR: [
          { members: { some: { email: userEmail } } },
          { pendingMembers: { some: { email: userEmail } } },
        ],
      },
      include: {
        members: { select: { id: true, name: true, email: true, etransferEmail: true, etransferPhone: true } },
        pendingMembers: { select: { email: true, name: true } },
      },
    });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get group details (members, expenses) for user
router.get('/:id', async (req, res) => {
  try {
    const userId = req.query.userId as string || HARDCODED_USER_ID;
    const groupId = req.params.id;
    // Only allow if user is a member
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        members: { some: { id: userId } },
      },
      include: {
        members: { select: { id: true, name: true, email: true, etransferEmail: true, etransferPhone: true } },
        pendingMembers: { select: { email: true, name: true } },
        expenses: true,
      },
    });
    if (!group) return res.status(404).json({ error: 'Group not found or access denied' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// Create group for user (with name, members)
router.post('/', async (req, res) => {
  try {
    const userId = req.body.userId || HARDCODED_USER_ID;
    const { name, members } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    // Always include creator as a member
    const uniqueMemberEmails = Array.from(new Set([userId, ...(members ? members.map((m: any) => m.email) : [])]));
    // Find users that exist
    const users = await prisma.user.findMany({
      where: { email: { in: uniqueMemberEmails } },
      select: { id: true, email: true },
    });
    const existingUserIds = users.map(u => u.id);
    const existingUserEmails = users.map(u => u.email);
    // Emails that do not exist as users
    const pendingMembers = (members || []).filter((m: any) => !existingUserEmails.includes(m.email));
    // Create the group
    const group = await prisma.group.create({
      data: {
        name,
        members: {
          connect: existingUserIds.map(id => ({ id })),
        },
        pendingMembers: {
          create: pendingMembers.map((m: any) => ({ email: m.email, name: m.name })),
        },
      },
      include: { members: true, pendingMembers: { select: { email: true, name: true } } },
    });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update group name (if user is a member)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.body.userId || HARDCODED_USER_ID;
    const groupId = req.params.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    // Check membership
    const group = await prisma.group.findFirst({
      where: { id: groupId, members: { some: { id: userId } } },
    });
    if (!group) return res.status(404).json({ error: 'Group not found or access denied' });
    const updated = await prisma.group.update({
      where: { id: groupId },
      data: { name },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete group (if user is a member)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.body.userId || HARDCODED_USER_ID;
    const groupId = req.params.id;
    // Check membership
    const group = await prisma.group.findFirst({
      where: { id: groupId, members: { some: { id: userId } } },
    });
    if (!group) return res.status(404).json({ error: 'Group not found or access denied' });
    await prisma.group.delete({ where: { id: groupId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Add member to group (by email)
router.post('/:id/add-member', async (req, res) => {
  const groupId = req.params.id;
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    let group;
    if (user) {
      // Add as confirmed member if not already
      group = await prisma.group.update({
        where: { id: groupId },
        data: {
          members: { connect: { id: user.id } },
          pendingMembers: { deleteMany: { email } },
        },
        include: { members: true, pendingMembers: { select: { email: true, name: true } } },
      });

      // --- NEW LOGIC: Update all 'split evenly' expenses to include new member ---
      // Find all expenses in this group where splitType is 'all'
      const expenses = await prisma.expense.findMany({
        where: { groupId, splitType: 'all' },
      });
      for (const expense of expenses) {
        // Only update if not already included
        if (!expense.splitWith.includes(user.id)) {
          await prisma.expense.update({
            where: { id: expense.id },
            data: {
              splitWith: [...expense.splitWith, user.id],
            },
          });
        }
      }
      // --- END NEW LOGIC ---
    } else {
      // Add as pending member if not already
      group = await prisma.group.update({
        where: { id: groupId },
        data: {
          pendingMembers: {
            connectOrCreate: {
              where: { groupId_email: { groupId, email } },
              create: { email, name },
            },
          },
        },
        include: { members: true, pendingMembers: { select: { email: true, name: true } } },
      });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from group (by email)
router.post('/:id/remove-member', async (req, res) => {
  const groupId = req.params.id;
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    // Remove from confirmed members if exists
    const user = await prisma.user.findUnique({ where: { email } });
    let group = await prisma.group.findUnique({ where: { id: groupId }, include: { members: true, pendingMembers: true } });
    if (user) {
      group = await prisma.group.update({
        where: { id: groupId },
        data: {
          members: { disconnect: { id: user.id } },
        },
        include: { members: true, pendingMembers: true },
      });
    }
    // Remove from pending members if exists
    group = await prisma.group.update({
      where: { id: groupId },
      data: {
        pendingMembers: { deleteMany: { email } },
      },
      include: { members: true, pendingMembers: true },
    });
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router; 
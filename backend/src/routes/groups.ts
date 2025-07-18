import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// For now, use a hardcoded userId (replace with real auth later)
const HARDCODED_USER_ID = 'demo-user-id';

// List all groups for the user
router.get('/', async (req, res) => {
  try {
    let userId = req.query.userId as string;
    let userEmail = req.query.userEmail as string;
    console.log('Fetching groups for:', { userId, userEmail });
    if (!userId && userEmail) {
      // Try to look up userId by email
      const user = await prisma.user.findUnique({ where: { email: userEmail } });
      if (user) {
        userId = user.id;
        console.log('Looked up userId by email:', userId);
      }
    }
    if (!userId && !userEmail) {
      return res.status(400).json({ error: 'Missing userId and userEmail' });
    }
    let orConditions = [];
    if (userId) {
      orConditions.push({ members: { some: { id: userId } } });
    }
    if (userEmail) {
      orConditions.push({ pendingMembers: { some: { email: userEmail } } });
    }
    const groups = await prisma.group.findMany({
      where: {
        OR: orConditions,
      },
      include: {
        members: true,
        pendingMembers: true,
      },
    });
    res.json(groups);
  } catch (err) {
    console.error('Error fetching groups:', err);
    const errorMsg = typeof err === 'object' && err && 'message' in err ? (err as any).message : String(err);
    res.status(500).json({ error: 'Failed to fetch groups', details: errorMsg });
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
        members: { select: { id: true, name: true, email: true } },
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
    const { name, memberIds, emoji } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    // Always include creator as a member
    const uniqueMemberEmails = Array.from(new Set([userId, ...(memberIds || [])]));
    // Find users that exist
    const users = await prisma.user.findMany({
      where: { email: { in: uniqueMemberEmails } },
      select: { id: true, email: true },
    });
    const existingUserIds = users.map(u => u.id);
    const existingUserEmails = users.map(u => u.email);
    // Emails that do not exist as users
    const pendingEmails = uniqueMemberEmails.filter(email => !existingUserEmails.includes(email));
    // Create the group
    const group = await prisma.group.create({
      data: {
        name,
        emoji: emoji || null,
        members: {
          connect: existingUserIds.map(id => ({ id })),
        },
        pendingMembers: {
          create: pendingEmails.map(email => ({ email })),
        },
      },
      include: { members: true, pendingMembers: true },
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
    // Delete related expenses
    await prisma.expense.deleteMany({ where: { groupId } });
    // Delete related pending members
    await prisma.groupPendingMember.deleteMany({ where: { groupId } });
    // Now delete the group
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
        include: { members: true, pendingMembers: true },
      });
    } else {
      // Add as pending member if not already
      group = await prisma.group.update({
        where: { id: groupId },
        data: {
          pendingMembers: { connectOrCreate: { where: { groupId_email: { groupId, email } }, create: { email } } },
        },
        include: { members: true, pendingMembers: true },
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

// Join group via invite link
router.post('/:id/join', async (req, res) => {
  const groupId = req.params.id;
  const { id, email, name } = req.body;
  if (!id || !email) return res.status(400).json({ error: 'Missing id or email' });
  try {
    // Upsert user with correct id, email, and name
    let user = await prisma.user.upsert({
      where: { id },
      update: { email, name },
      create: { id, email, name, password: null },
    });
    // Add as confirmed member if not already
    let group = await prisma.group.update({
      where: { id: groupId },
      data: {
        members: { connect: { id: user.id } },
        pendingMembers: { deleteMany: { email } },
      },
      include: { members: true, pendingMembers: true },
    });
    // Update all 'split evenly' expenses to include all current members and pending members
    const allMemberIds = group.members.map(m => m.id);
    const allPendingEmails = group.pendingMembers.map(pm => pm.email);
    const newSplitWith = [...allMemberIds, ...allPendingEmails];
    const expenses = await prisma.expense.findMany({
      where: { groupId, splitType: 'all' },
    });
    for (const expense of expenses) {
      await prisma.expense.update({
        where: { id: expense.id },
        data: { splitWith: newSplitWith },
      });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to join group' });
  }
});

export default router; 
import React, { useState, useRef, useEffect } from 'react';
import { getApiUrl } from './utils.js';

interface Member {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  etransferEmail?: string;
  etransferPhone?: string;
}

interface PendingMember {
  email: string;
  name?: string;
}
interface Group {
  name: string;
  members: Member[];
  pendingMembers?: PendingMember[];
}

interface GroupDetailsProps {
  group: Group;
  groupId: string;
  groupIdx: number;
  userId: string;
  onClose: () => void;
  onRenameGroup: (groupIdx: number, newName: string) => void;
  onDeleteGroup: (groupIdx: number) => void;
  onAddMemberToGroup: (groupIdx: number, member: Member) => void;
  onRemoveMemberFromGroup: (groupIdx: number, email: string) => void;
  onGroupUpdated: (updatedGroup: Group) => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ group, groupId, groupIdx, userId, onClose, onRenameGroup, onDeleteGroup, onAddMemberToGroup, onRemoveMemberFromGroup, onGroupUpdated }) => {
  // Always compute members and pending at the very top
  const allMembers: Member[] = (group.members || []);
  const allPending: PendingMember[] = group.pendingMembers || [];
  const allSplitMembers = [
    ...allMembers.map(m => ({ id: m.id, name: m.name, email: m.email })),
    ...allPending.map(pm => ({ id: undefined, name: pm.name || pm.email, email: pm.email })),
  ];
  // Only use the expenses state and computed balances from user input
  const [expenses, setExpenses] = useState<any[]>([]); // State to hold expenses
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState('');
  // Find the current user in the group
  const currentUserObj = allMembers.find(m => m.id === userId);

  // Add Expense form state
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    payer: currentUserObj ? currentUserObj.name : (group.members[0]?.name || ''),
    date: new Date().toISOString().slice(0, 10),
    splitType: 'all', // 'all' or 'subset'
    splitMembers: allSplitMembers.map(m => m.name), // default all (confirmed + pending)
    image: null as File | null,
    imageUrl: '',
  });
  const [expenseError, setExpenseError] = useState('');
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'BALANCES' | 'MY_BALANCES' | 'SETTINGS'>('BALANCES');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(group.members[0]?.name || ''); // Default to first member
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState(group.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberInput, setAddMemberInput] = useState({ name: '', email: '', phone: '' });
  const [addMemberError, setAddMemberError] = useState('');
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [removeMemberError, setRemoveMemberError] = useState('');
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false);
  const [expenseToDeleteIdx, setExpenseToDeleteIdx] = useState<number | null>(null);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [expenseToEditIdx, setExpenseToEditIdx] = useState<number | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState({
    description: '',
    amount: '',
    payer: '',
    date: '',
    splitType: 'all',
    splitMembers: [] as string[],
    image: null as File | null,
    imageUrl: '',
  });
  const [editExpenseError, setEditExpenseError] = useState('');
  const [fetchedGroup, setFetchedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const userEmail = group.members[0]?.email;
  const [showEtransferDropdown, setShowEtransferDropdown] = useState(false);
  const etransferRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (etransferRef.current && !etransferRef.current.contains(event.target as Node)) {
        setShowEtransferDropdown(false);
      }
    }
    if (showEtransferDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEtransferDropdown]);

  // Helper to refresh group details from backend
  async function refreshGroupDetails() {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/groups/${groupId}?userId=${userId}`));
      if (res.ok) {
        const data = await res.json();
        setFetchedGroup(data);
      }
    } finally {
      setLoading(false);
    }
  }

  // --- RENAME GROUP ---
  async function handleRenameGroup(newName: string) {
    try {
      const res = await fetch(getApiUrl(`/api/groups/${groupId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, userId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFetchedGroup(updated);
        setRenameInput(newName);
        onGroupUpdated(updated);
      }
    } catch {}
  }

  // --- ADD MEMBER ---
  async function handleAddMember(member: Member) {
    try {
      const res = await fetch(getApiUrl(`/api/groups/${groupId}/add-member`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: member.email, name: member.name }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFetchedGroup(updated);
        onGroupUpdated(updated);
      }
    } catch {}
  }

  // --- REMOVE MEMBER ---
  async function handleRemoveMember(email: string) {
    try {
      const res = await fetch(getApiUrl(`/api/groups/${groupId}/remove-member`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFetchedGroup(updated);
        onGroupUpdated(updated);
      }
    } catch {}
  }

  // --- DELETE GROUP ---
  async function handleDeleteGroup() {
    try {
      const res = await fetch(getApiUrl(`/api/groups/${groupId}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        onDeleteGroup(groupIdx);
      }
    } catch {}
  }

  // --- DELETE EXPENSE ---
  async function handleDeleteExpense(expenseId: string) {
    try {
      const res = await fetch(getApiUrl(`/api/expenses/${expenseId}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await refreshExpenses();
      }
    } catch {}
  }

  // --- EDIT EXPENSE ---
  async function handleEditExpense(expenseId: string, updated: any) {
    try {
      const res = await fetch(getApiUrl(`/api/expenses/${expenseId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        await refreshExpenses();
      }
    } catch {}
  }

  // Helper to refresh expenses from backend
  async function refreshExpenses() {
    setExpensesLoading(true);
    setExpensesError('');
    try {
      const res = await fetch(getApiUrl(`/api/expenses?groupId=${groupId}`));
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      } else {
        setExpensesError('Failed to fetch expenses');
      }
    } catch (err) {
      setExpensesError('Failed to fetch expenses');
    } finally {
      setExpensesLoading(false);
    }
  }

  // Find the current user (by email) from the group members
  const currentUserId = userId;

  // Fetch expenses from backend when groupId changes
  useEffect(() => {
    async function fetchExpenses() {
      setExpensesLoading(true);
      setExpensesError('');
      try {
        const res = await fetch(getApiUrl(`/api/expenses?groupId=${groupId}`));
        if (res.ok) {
          const data = await res.json();
          setExpenses(data);
        } else {
          setExpensesError('Failed to fetch expenses');
        }
      } catch (err) {
        setExpensesError('Failed to fetch expenses');
      } finally {
        setExpensesLoading(false);
      }
    }
    fetchExpenses();
  }, [groupId]);

  // Handle form changes
  function handleExpenseChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type, files } = e.target as any;
    if (name === 'image' && files && files[0]) {
      setExpenseForm(f => ({ ...f, image: files[0], imageUrl: URL.createObjectURL(files[0]) }));
    } else if (name === 'splitType') {
      setExpenseForm(f => ({ ...f, splitType: value, splitMembers: value === 'all' ? allSplitMembers.map(m => m.name) : [] }));
    } else {
      setExpenseForm(f => ({ ...f, [name]: value }));
    }
  }
  function handleSplitMemberToggle(name: string) {
    setExpenseForm(f => {
      const exists = f.splitMembers.includes(name);
      return {
        ...f,
        splitMembers: exists ? f.splitMembers.filter(n => n !== name) : [...f.splitMembers, name],
      };
    });
  }
  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setExpenseError('');
    if (!expenseForm.description.trim() || !expenseForm.amount || isNaN(Number(expenseForm.amount)) || Number(expenseForm.amount) <= 0) {
      setExpenseError('Please enter a valid description and amount.');
      return;
    }
    if (!expenseForm.payer) {
      setExpenseError('Please select a payer.');
      return;
    }
    if (expenseForm.splitType === 'subset' && expenseForm.splitMembers.length === 0) {
      setExpenseError('Please select at least one member to split with.');
      return;
    }
    // Find payerId by matching name to group members
    const allMembers = (fetchedGroup || group).members;
    const payer = allMembers.find(m => m.name === expenseForm.payer);
    if (!payer) {
      setExpenseError('Payer not found.');
      return;
    }
    try {
      // For splitType 'all', use both confirmed and pending members for the split count and per-person calculation
      const allMembers = (fetchedGroup || group).members;
      const allPending = (fetchedGroup || group).pendingMembers || [];
      const splitWith = expenseForm.splitType === 'all'
        ? [
            ...allMembers.map(m => m.id),
            ...allPending.map(pm => pm.email)
          ]
        : allMembers.filter(m => expenseForm.splitMembers.includes(m.name)).map(m => m.id);
      const res = await fetch(getApiUrl('/api/expenses'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          description: expenseForm.description,
          amount: expenseForm.amount,
          payerId: payer.id,
          date: expenseForm.date,
          splitType: expenseForm.splitType,
          splitWith,
          imageUrl: expenseForm.imageUrl,
        }),
      });
      if (!res.ok) {
        setExpenseError('Failed to add expense.');
        return;
      }
      // Refresh expenses list
      const newExpense = await res.json();
      setExpenses(prev => [newExpense, ...prev]);
      setShowExpenseModal(false);
      setActiveTab('BALANCES');
      setExpenseForm({
        description: '',
        amount: '',
        payer: allMembers[0]?.name || '',
        date: new Date().toISOString().slice(0, 10),
        splitType: 'all',
        splitMembers: allMembers.map(m => m.name),
        image: null,
        imageUrl: '',
      });
    } catch (err) {
      setExpenseError('Failed to add expense.');
    }
  }

  // Compute balances from expenses (robust version)
  function computeBalances() {
    // Build a map of all members (id -> {id, name, email})
    const allMembers = [
      ...((fetchedGroup || group).members || []),
      ...(((fetchedGroup || group).pendingMembers || []).map(pm => ({ id: pm.email, name: pm.name || pm.email, email: pm.email })))
    ];
    const memberMap: Record<string, { id: string; name: string; email: string }> = {};
    allMembers.forEach(m => { memberMap[m.id!] = { id: m.id!, name: m.name, email: m.email }; });

    // Initialize balances
    const balances: Record<string, number> = {};
    Object.keys(memberMap).forEach(id => { balances[id] = 0; });

    for (const exp of expenses) {
      // Use splitWith (array of user IDs or emails) or all members if not set
      const splitWith: string[] = (exp.splitWith && exp.splitWith.length > 0)
        ? exp.splitWith
        : Object.keys(memberMap);
      // Remove duplicates just in case
      const uniqueSplitWith = Array.from(new Set(splitWith));
      const share = exp.amount / uniqueSplitWith.length;
      // Debug: log expense details
      // eslint-disable-next-line no-console
      console.log('Expense:', exp.description, 'Amount:', exp.amount, 'Payer:', exp.payerId, 'SplitWith:', uniqueSplitWith);
      for (const memberId of uniqueSplitWith) {
        if (memberId === exp.payerId) {
          // If payer is in split, they pay their share, get credited the rest
          balances[memberId] += exp.amount - share;
        } else {
          balances[memberId] -= share;
        }
      }
      // If payer is NOT in splitWith, credit them the full amount
      if (!uniqueSplitWith.includes(exp.payerId)) {
        balances[exp.payerId] = (balances[exp.payerId] || 0) + exp.amount;
      }
    }
    // Map balances to display with member names (use email for pending)
    const result = Object.keys(memberMap).map(id => ({
      id,
      name: memberMap[id].name || memberMap[id].email,
      amount: Math.round((balances[id] + Number.EPSILON) * 100) / 100, // round to 2 decimals
    }));
    // Debug: log final balances
    // eslint-disable-next-line no-console
    console.log('Final balances:', result);
    return result;
  }
  const balances = computeBalances();

  // Add a function to compute pairwise debts between all members
  function computePairwiseDebts() {
    // Build a map of all members (id -> {id, name, email})
    const allMembers = [
      ...((fetchedGroup || group).members || []),
      ...(((fetchedGroup || group).pendingMembers || []).map(pm => ({ id: pm.email, name: pm.name || pm.email, email: pm.email })))
    ];
    const memberMap: Record<string, { id: string; name: string; email: string }> = {};
    allMembers.forEach(m => { memberMap[m.id!] = { id: m.id!, name: m.name, email: m.email }; });
    const memberIds = Object.keys(memberMap);

    // Initialize pairwise debts: debts[a][b] = how much a owes b
    const debts: Record<string, Record<string, number>> = {};
    memberIds.forEach(a => {
      debts[a] = {};
      memberIds.forEach(b => { debts[a][b] = 0; });
    });

    for (const exp of expenses) {
      const splitWith: string[] = (exp.splitWith && exp.splitWith.length > 0)
        ? exp.splitWith
        : memberIds;
      const uniqueSplitWith = Array.from(new Set(splitWith));
      const share = exp.amount / uniqueSplitWith.length;
      for (const memberId of uniqueSplitWith) {
        if (memberId !== exp.payerId) {
          // member owes payer their share
          debts[memberId][exp.payerId] += share;
        }
      }
    }
    // For each pair, net the debts (a owes b minus b owes a)
    const pairwise = [];
    for (const a of memberIds) {
      for (const b of memberIds) {
        if (a !== b) {
          const net = debts[a][b] - debts[b][a];
          if (Math.abs(net) > 0.01) {
            pairwise.push({ from: a, to: b, amount: Math.round((net + Number.EPSILON) * 100) / 100 });
          }
        }
      }
    }
    return { pairwise, memberMap };
  }

  const displayGroup = fetchedGroup || group;
  try {
    // Defensive: If displayGroup or displayGroup.members is missing or not an array, show a message
    if (!displayGroup || !Array.isArray(displayGroup.members) || displayGroup.members.length === 0) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadeInUp text-center">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-purple-400">{group?.name || 'Group'}</h2>
            <div className="text-gray-500 text-lg">This group is missing members or is not set up correctly.<br/>Please add members before adding expenses or viewing balances.</div>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadeInUp text-center">
            <div className="text-xl font-bold text-purple-400 mb-4">Loading group details...</div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Modal Overlay and Content */}
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px] pt-16">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg h-[700px] relative animate-fadeInUp flex flex-col">
            {/* Top Bar */}
            <div className="w-full px-6 pt-6 pb-2 flex flex-col gap-1 border-b border-gray-200 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between mb-1">
                <div className="text-2xl font-extrabold text-purple-400 truncate" title={displayGroup.name}>{displayGroup.name}</div>
                <div className="flex items-center gap-2">
                  {/* E-transfer dropdown button */}
                  <div className="relative" ref={etransferRef}>
                    <button
                      className="p-2 rounded-full hover:bg-purple-100 text-purple-600 focus:outline-none"
                      title="Show e-transfer addresses"
                      onClick={() => setShowEtransferDropdown(v => !v)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 17v.01" />
                      </svg>
                    </button>
                    {showEtransferDropdown && (
                      <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-4 border border-purple-100">
                        <div className="font-semibold text-purple-500 mb-2">E-transfer Addresses</div>
                        <ul className="space-y-2">
                          {(displayGroup.members || []).map((m, i) => (
                            <li key={i} className="text-sm text-gray-700 flex flex-col">
                              <span className="font-medium">{m.name}</span>
                              <span className="text-xs text-gray-500">{m.email}</span>
                              {(m.etransferEmail || m.etransferPhone) ? (
                                <span className="text-xs text-gray-600 mt-0.5">
                                  {m.etransferEmail && <span>E-transfer: {m.etransferEmail}</span>}
                                  {m.etransferEmail && m.etransferPhone && <span> | </span>}
                                  {m.etransferPhone && <span>Phone: {m.etransferPhone}</span>}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No e-transfer info</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {/* Settings Gear Icon */}
                  <div className="relative" ref={settingsRef}>
                    <button
                      className="p-2 rounded-full hover:bg-purple-100 text-purple-600 focus:outline-none"
                      title="Settings"
                      onClick={() => setShowSettings(v => !v)}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 01.33 1.82l-.06.1a2 2 0 01-2.18 1.09 8.12 8.12 0 01-2.18-.9 8.12 8.12 0 01-2.18.9 2 2 0 01-2.18-1.09l-.06-.1A1.65 1.65 0 014.6 15a2 2 0 01-.33-1.82l.06-.1a8.12 8.12 0 01.9-2.18 8.12 8.12 0 01-.9-2.18A2 2 0 014.6 9a1.65 1.65 0 01.33-1.82l.06-.1A2 2 0 017.17 6a8.12 8.12 0 012.18.9 8.12 8.12 0 012.18-.9A2 2 0 0114.83 6a1.65 1.65 0 011.82.33l.1.06a2 2 0 011.09 2.18 8.12 8.12 0 01.9 2.18 8.12 8.12 0 01.9 2.18 2 2 0 01-1.09 2.18z" /></svg>
                    </button>
                    {showSettings && (
                      <div className="absolute right-0 mt-2 w-48 bg-gray-200 rounded-lg shadow-lg z-50">
                        <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-100 focus:bg-purple-200 transition" onClick={() => { setShowRenameModal(true); setShowSettings(false); }}>Rename group</button>
                        <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-100 focus:bg-purple-200 transition" onClick={() => { setShowAddMemberModal(true); setShowSettings(false); }}>Add member</button>
                        <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-100 focus:bg-purple-200 transition" onClick={() => { setShowRemoveMemberModal(true); setShowSettings(false); }}>Remove member</button>
                        <button className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-100 focus:bg-red-200 transition" onClick={() => { setShowDeleteModal(true); setShowSettings(false); }}>Delete group</button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-2xl font-bold z-20 ml-1"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
              {/* Members section - improved layout */}
              <div className="flex flex-col items-center my-4">
                <div className="font-semibold text-gray-700 mb-1">Members:</div>
                <ul className="space-y-1">
                  {displayGroup.members.map((m, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-center justify-center">
                      <span className="font-medium">{m.name}</span>
                      <span className="ml-2 text-xs text-gray-500">({m.email})</span>
                    </li>
                  ))}
                  {displayGroup.pendingMembers && displayGroup.pendingMembers.length > 0 && (
                    <li className="text-xs text-gray-500 mt-2">Invited (pending):</li>
                  )}
                  {displayGroup.pendingMembers && displayGroup.pendingMembers.map((pm, i) => (
                    <li key={"pending-" + i} className="text-sm text-gray-400 flex items-center justify-center italic">
                      <span className="font-medium">{pm.name ? `${pm.name} (${pm.email})` : pm.email}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Tabs (no SETTINGS) */}
              <div className="flex w-full gap-2 mt-1 border-b border-gray-200">
                {['EXPENSES', 'BALANCES', 'MY_BALANCES'].map(tab => (
                  <button
                    key={tab}
                    className={`flex-1 py-2 text-base font-semibold transition-colors duration-150 focus:outline-none rounded-lg
                      ${activeTab === tab ? 'text-purple-600 bg-white border-b-4 border-purple-400 shadow-sm' : 'text-gray-700 bg-gray-100 border-b-4 border-transparent'}`}
                    onClick={() => setActiveTab(tab as any)}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            {/* Main Content Area */}
            <div className="flex-1 w-full px-6 pb-6 pt-2 overflow-y-auto transition-all duration-300 min-h-[340px] flex flex-col justify-start">
              {activeTab === 'BALANCES' && (
                <div>
                  <div className="mb-6">
                    {/* Centered horizontal bar graph with visible names */}
                    <div className="flex flex-col gap-3">
                      {(() => {
                        const maxAbs = Math.max(...balances.map(b => Math.abs(b.amount)), 1);
                        return balances.map((b, idx) => {
                          const percent = Math.abs(b.amount) / maxAbs * 100;
                          const isPositive = b.amount > 0;
                          return (
                            <div key={b.name} className="flex items-center w-full h-10 relative">
                              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 z-0" style={{ height: '100%' }} />
                              {/* Negative bar (left of center) */}
                              <div className="flex-1 flex justify-end pr-2 relative z-10 items-center">
                                {b.amount < 0 && (
                                  <>
                                    <span className="mr-2 font-medium text-gray-700 whitespace-nowrap">{b.name}</span>
                                    <div
                                      className="flex items-center bg-red-100 rounded-l-full h-10 px-6 font-semibold text-red-700 text-base shadow-sm transition-all duration-200 whitespace-nowrap min-w-[80px] max-w-[60%]"
                                      style={{ width: `${percent}%`, justifyContent: 'flex-end' }}
                                    >
                                      <span>{b.amount.toFixed(2)} $</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              {/* Positive bar (right of center) */}
                              <div className="flex-1 flex justify-start pl-2 relative z-10 items-center">
                                {b.amount > 0 && (
                                  <>
                                    <div
                                      className="flex items-center bg-green-100 rounded-r-full h-10 px-6 font-semibold text-green-700 text-base shadow-sm transition-all duration-200 whitespace-nowrap min-w-[80px] max-w-[60%]"
                                      style={{ width: `${percent}%`, justifyContent: 'flex-start' }}
                                    >
                                      <span>+{b.amount.toFixed(2)} $</span>
                                    </div>
                                    <span className="ml-2 font-medium text-gray-700 whitespace-nowrap">{b.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-semibold text-gray-700 mb-2">Who owes to whom?</div>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm">
                      {(() => {
                        const { pairwise, memberMap } = computePairwiseDebts();
                        // Only keep positive entries and sort by the name of the person who owes money
                        const filtered = pairwise
                          .filter(p => p.amount > 0)
                          .sort((a, b) => memberMap[a.from].name.localeCompare(memberMap[b.from].name));
                        if (filtered.length === 0) {
                          return <div className="text-gray-400">Everyone is settled up!</div>;
                        }
                        return (
                          <ul className="space-y-2">
                            {filtered.map((p, idx) => (
                              <li key={idx} className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">{memberMap[p.from].name}</span>
                                <span className="mx-2 text-gray-500">owes</span>
                                <span className="font-medium text-purple-400">{memberMap[p.to].name}</span>
                                <span className="ml-2 font-semibold">{p.amount.toFixed(2)} $</span>
                              </li>
                            ))}
                          </ul>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'MY_BALANCES' && (
                <div>
                  <div className="mb-6">
                    {/* Bar graph of what current user owes to each person */}
                    {(() => {
                      // Calculate minimal payments
                      const creditors = balances.filter(b => b.amount > 0).map(b => ({ ...b }));
                      const debtors = balances.filter(b => b.amount < 0).map(b => ({ ...b }));
                      const payments: { from: string; to: string; amount: number }[] = [];
                      let i = 0, j = 0;
                      while (i < debtors.length && j < creditors.length) {
                        const debtor = debtors[i];
                        const creditor = creditors[j];
                        const payAmount = Math.min(-debtor.amount, creditor.amount);
                        if (payAmount > 0.01) {
                          payments.push({ from: debtor.id, to: creditor.id, amount: payAmount });
                        }
                        debtor.amount += payAmount;
                        creditor.amount -= payAmount;
                        if (Math.abs(debtor.amount) < 0.01) i++;
                        if (Math.abs(creditor.amount) < 0.01) j++;
                      }
                      // Only show what current user owes
                      const myPayments = payments.filter(p => p.from === currentUserId);
                      if (myPayments.length === 0) {
                        return <div className="text-gray-400">You do not owe anyone!</div>;
                      }
                      const maxOwe = Math.max(...myPayments.map(p => p.amount), 1);
                      return (
                        <div className="flex flex-col gap-2">
                          {myPayments.map((p, idx) => {
                            const toMember = allMembers.find(m => m.id === p.to);
                            return (
                              <div key={idx} className="flex items-center w-full h-10">
                                <div className="flex items-center justify-end pr-2" style={{ width: `${p.amount / maxOwe * 100}%` }}>
                                  <div className="bg-red-200 text-red-800 rounded-l-lg h-8 flex items-center px-3 min-w-[80px] max-w-full font-semibold text-base justify-between w-full">
                                    <span>{p.amount.toFixed(2)} $</span>
                                    <span className="ml-2">{toMember ? (toMember.id === currentUserId ? 'You' : toMember.name) : p.to}</span>
                                  </div>
                                </div>
                                <div style={{ width: '50%' }} />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="mt-4">
                    <div className="font-semibold text-gray-700 mb-2">Who do I owe?</div>
                    <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm">
                      {(() => {
                        // Calculate minimal payments
                        const creditors = balances.filter(b => b.amount > 0).map(b => ({ ...b }));
                        const debtors = balances.filter(b => b.amount < 0).map(b => ({ ...b }));
                        const payments: { from: string; to: string; amount: number }[] = [];
                        let i = 0, j = 0;
                        while (i < debtors.length && j < creditors.length) {
                          const debtor = debtors[i];
                          const creditor = creditors[j];
                          const payAmount = Math.min(-debtor.amount, creditor.amount);
                          if (payAmount > 0.01) {
                            payments.push({ from: debtor.id, to: creditor.id, amount: payAmount });
                          }
                          debtor.amount += payAmount;
                          creditor.amount -= payAmount;
                          if (Math.abs(debtor.amount) < 0.01) i++;
                          if (Math.abs(creditor.amount) < 0.01) j++;
                        }
                        // Only show what current user owes
                        const myPayments = payments.filter(p => p.from === currentUserId);
                        if (myPayments.length === 0) {
                          return <div className="text-gray-400">You do not owe anyone!</div>;
                        }
                        return (
                          <ul className="space-y-2">
                            {myPayments.map((p, idx) => {
                              const toMember = allMembers.find(m => m.id === p.to);
                              return (
                                <li key={idx} className="flex items-center justify-between">
                                  <span className="font-medium text-gray-700">You</span>
                                  <span className="mx-2 text-gray-500">owe</span>
                                  <span className="font-medium text-purple-400">{toMember ? (toMember.id === currentUserId ? 'You' : toMember.name) : p.to}</span>
                                  <span className="ml-2 font-semibold">{p.amount.toFixed(2)} $</span>
                                </li>
                              );
                            })}
                          </ul>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'EXPENSES' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xl font-semibold text-purple-400">Expenses</div>
                    <button
                      className="bg-purple-400 text-white rounded px-4 py-2 hover:bg-purple-500 transition font-semibold shadow"
                      onClick={() => setShowExpenseModal(true)}
                    >
                      + Add Expense
                    </button>
                  </div>
                  {expensesLoading ? (
                    <div className="text-gray-400 bg-white rounded-xl shadow p-6">Loading expenses...</div>
                  ) : expensesError ? (
                    <div className="text-red-500 bg-white rounded-xl shadow p-6">{expensesError}</div>
                  ) : expenses.length === 0 ? (
                    <div className="text-gray-400 bg-white rounded-xl shadow p-6">No expenses yet.</div>
                  ) : (
                    <ul className="space-y-4">
                      {expenses.map((exp, idx) => (
                        <li key={idx} className="bg-gray-50 rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          {expenseToDeleteIdx === idx ? (
                            <div className="flex flex-col w-full items-center">
                              <div className="text-red-500 font-bold mb-2">Delete Expense</div>
                              <div className="text-gray-700 mb-4 text-center">Are you sure you want to delete this expense?<br/><span className='font-semibold'>{exp.description}</span></div>
                              <div className="flex gap-2 w-full justify-center">
                                <button
                                  className="bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600 transition font-semibold shadow"
                                  onClick={async () => {
                                    const expenseId = expenses[idx].id;
                                    await handleDeleteExpense(expenseId);
                                    setExpenseToDeleteIdx(null);
                                  }}
                                >
                                  Delete
                                </button>
                                <button
                                  className="bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow"
                                  onClick={() => setExpenseToDeleteIdx(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <div className="font-semibold text-gray-800">{exp.description}</div>
                                <div className="text-gray-500 text-sm">
                                  Paid by{' '}
                                  <span className="font-medium">
                                    {(() => {
                                      const allMembers = (fetchedGroup || group).members;
                                      const payer = allMembers.find(m => m.id === exp.payerId);
                                      return payer ? `${payer.name} (${payer.email})` : 'Unknown';
                                    })()}
                                  </span>{' '}
                                  on {exp.date}
                                </div>
                                {exp.imageUrl && (
                                  <img src={exp.imageUrl} alt="Proof" className="mt-2 rounded-lg max-h-24 max-w-xs border border-gray-200" />
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-lg font-bold text-purple-400">{exp.amount.toFixed(2)} $</div>
                                <div className="text-xs text-gray-400">{exp.split}</div>
                                <div className="flex flex-col gap-2 items-end justify-center min-w-[40px]">
                                  <button
                                    className="text-purple-400 hover:text-purple-600 p-2 rounded-full transition"
                                    title="Edit expense"
                                    onClick={() => {
                                      setExpenseToEditIdx(idx);
                                      const allMembers = (fetchedGroup || group).members;
                                      setEditExpenseForm({
                                        description: exp.description,
                                        amount: exp.amount.toString(),
                                        payer: allMembers.find(m => m.id === exp.payerId)?.name || '',
                                        date: exp.date,
                                        splitType: exp.splitType || 'all',
                                        splitMembers: exp.splitWith && exp.splitWith.length > 0
                                          ? allMembers.filter(m => exp.splitWith.includes(m.id)).map(m => m.name)
                                          : allMembers.map(m => m.name),
                                        image: null,
                                        imageUrl: exp.imageUrl || '',
                                      });
                                      setEditExpenseError('');
                                      setShowEditExpenseModal(true);
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3h3z" /></svg>
                                  </button>
                                  <button
                                    className="text-red-400 hover:text-red-600 p-2 rounded-full transition"
                                    title="Delete expense"
                                    onClick={() => { setExpenseToDeleteIdx(idx); }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Expense Modal */}
                  {showExpenseModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]">
                      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeInUp">
                        <button
                          onClick={() => setShowExpenseModal(false)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                          aria-label="Close"
                        >
                          ×
                        </button>
                        <div className="text-xl font-bold text-purple-400 mb-4">Add Expense</div>
                        <form onSubmit={handleExpenseSubmit} className="flex flex-col gap-4">
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Description</label>
                            <input type="text" name="description" value={expenseForm.description} onChange={handleExpenseChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900" required />
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-gray-700 font-medium mb-1">Amount ($)</label>
                              <input type="number" name="amount" min="0.01" step="0.01" value={expenseForm.amount} onChange={handleExpenseChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900" required />
                            </div>
                            <div className="flex-1">
                              <label className="block text-gray-700 font-medium mb-1">Payer</label>
                              <select name="payer" value={expenseForm.payer} onChange={handleExpenseChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900">
                                {group.members.map((m, i) => (
                                  <option key={i} value={m.name}>{m.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Date</label>
                            <input type="date" name="date" value={expenseForm.date} onChange={handleExpenseChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900" />
                          </div>
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Split Method</label>
                            <div className="flex gap-4 mb-2">
                              <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-900">
                                <input type="radio" name="splitType" value="all" checked={expenseForm.splitType === 'all'} onChange={handleExpenseChange} className="accent-purple-400" />
                                Evenly between all
                              </label>
                              <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-900">
                                <input type="radio" name="splitType" value="subset" checked={expenseForm.splitType === 'subset'} onChange={handleExpenseChange} className="accent-purple-400" />
                                Evenly between selected
                              </label>
                            </div>
                            {expenseForm.splitType === 'all' && (
                              <div className="text-xs text-gray-600 mb-2">
                                Splitting between <span className="font-semibold">{allSplitMembers.length}</span> people
                                {Number(expenseForm.amount) > 0 && (
                                  <>
                                    {': '}
                                    <span className="font-semibold">{(Number(expenseForm.amount) / allSplitMembers.length).toFixed(2)} $</span> per person
                                  </>
                                )}
                              </div>
                            )}
                            {expenseForm.splitType === 'subset' && (
                              <div className="flex flex-wrap gap-3">
                                {allSplitMembers.map((m, i) => (
                                  <label key={i} className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 text-gray-900">
                                    <input
                                      type="checkbox"
                                      checked={expenseForm.splitMembers.includes(m.name)}
                                      onChange={() => handleSplitMemberToggle(m.name)}
                                      className="accent-purple-400"
                                    />
                                    {m.name}
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="block text-gray-700 font-medium mb-1">Proof of Payment (optional)</label>
                            <input type="file" name="image" accept="image/*" onChange={handleExpenseChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900" />
                            {expenseForm.imageUrl && (
                              <img src={expenseForm.imageUrl} alt="Preview" className="mt-2 rounded-lg max-h-24 max-w-xs border border-gray-200" />
                            )}
                          </div>
                          {expenseError && <div className="text-red-500 text-sm font-medium">{expenseError}</div>}
                          <button type="submit" className="bg-purple-400 text-white rounded px-4 py-2 mt-2 hover:bg-purple-500 transition font-semibold shadow">Add Expense</button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Rename Group Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs relative animate-fadeInUp flex flex-col items-center">
              <div className="text-lg font-bold text-purple-500 mb-4">Rename Group</div>
              <input
                type="text"
                value={renameInput}
                onChange={e => setRenameInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900"
                autoFocus
              />
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 bg-purple-400 text-white rounded px-4 py-2 hover:bg-purple-500 transition font-semibold shadow"
                  onClick={() => {
                    if (renameInput.trim()) {
                      handleRenameGroup(renameInput.trim());
                      setShowRenameModal(false);
                    }
                  }}
                >
                  Save
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow"
                  onClick={() => setShowRenameModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Group Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs relative animate-fadeInUp flex flex-col items-center">
              <div className="text-lg font-bold text-red-500 mb-4">Delete Group</div>
              <div className="text-gray-700 mb-6 text-center">Are you sure you want to delete this group?<br/><span className='font-semibold'>{group.name}</span></div>
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600 transition font-semibold shadow"
                  onClick={() => {
                    handleDeleteGroup();
                    setShowDeleteModal(false);
                  }}
                >
                  Delete
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs relative animate-fadeInUp flex flex-col items-center">
              <div className="text-lg font-bold text-purple-500 mb-4">Add Member</div>
              <input
                type="text"
                value={addMemberInput.name}
                onChange={e => setAddMemberInput({ ...addMemberInput, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900"
                placeholder="Name (required)"
                autoFocus
              />
              <input
                type="email"
                value={addMemberInput.email}
                onChange={e => setAddMemberInput({ ...addMemberInput, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900"
                placeholder="Email (required)"
              />
              <input
                type="tel"
                value={addMemberInput.phone}
                onChange={e => setAddMemberInput({ ...addMemberInput, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900"
                placeholder="Phone (optional)"
              />
              {addMemberError && <div className="text-red-500 text-sm mb-2">{addMemberError}</div>}
              <div className="flex gap-2 w-full">
                <button
                  className="flex-1 bg-purple-400 text-white rounded px-4 py-2 hover:bg-purple-500 transition font-semibold shadow"
                  onClick={async () => {
                    const name = addMemberInput.name.trim();
                    const email = addMemberInput.email.trim();
                    const phone = addMemberInput.phone.trim();
                    if (!name || !email) {
                      setAddMemberError('Name and email are required.');
                      return;
                    }
                    if (group.members.some(m => m.email === email) || group.pendingMembers?.some(pm => pm.email === email)) {
                      setAddMemberError('A member with this email already exists.');
                      return;
                    }
                    await handleAddMember({ name, email, phone: phone || undefined });
                    setAddMemberInput({ name: '', email: '', phone: '' });
                    setAddMemberError('');
                    setShowAddMemberModal(false);
                  }}
                >
                  Add
                </button>
                <button
                  className="flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setAddMemberError('');
                    setAddMemberInput({ name: '', email: '', phone: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Remove Member Modal */}
        {showRemoveMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs relative animate-fadeInUp flex flex-col items-center">
              <div className="text-lg font-bold text-purple-500 mb-4">Remove Member</div>
              {removeMemberError && <div className="text-red-500 text-sm mb-2">{removeMemberError}</div>}
              <ul className="w-full mb-4">
                {group.members.map((m, i) => (
                  <li key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-900">{m.name} <span className="text-xs text-gray-500">({m.email})</span></span>
                    <button
                      className="bg-red-400 text-white rounded px-3 py-1 text-sm hover:bg-red-500 transition font-semibold disabled:opacity-50"
                      disabled={group.members.length === 1}
                      onClick={() => {
                        if (group.members.length === 1) {
                          setRemoveMemberError('A group must have at least one member.');
                          return;
                        }
                        handleRemoveMember(m.email);
                        setRemoveMemberError('');
                        if (group.members.length - 1 <= 1) setShowRemoveMemberModal(false);
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {group.pendingMembers && group.pendingMembers.map((pm, i) => (
                  <li key={"pending-" + i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-400 italic">{pm.name ? `${pm.name} (${pm.email})` : pm.email} <span className="text-xs">(invited)</span></span>
                    <button
                      className="bg-red-400 text-white rounded px-3 py-1 text-sm hover:bg-red-500 transition font-semibold"
                      onClick={() => {
                        handleRemoveMember(pm.email);
                        setRemoveMemberError('');
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <button
                className="w-full bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow"
                onClick={() => {
                  setShowRemoveMemberModal(false);
                  setRemoveMemberError('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {showEditExpenseModal && expenseToEditIdx !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeInUp">
              <button
                onClick={() => setShowEditExpenseModal(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
              <div className="text-xl font-bold text-purple-400 mb-4">Edit Expense</div>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setEditExpenseError('');
                  if (!editExpenseForm.description.trim() || !editExpenseForm.amount || isNaN(Number(editExpenseForm.amount)) || Number(editExpenseForm.amount) <= 0) {
                    setEditExpenseError('Please enter a valid description and amount.');
                    return;
                  }
                  if (!editExpenseForm.payer) {
                    setEditExpenseError('Please select a payer.');
                    return;
                  }
                  if (editExpenseForm.splitType === 'subset' && editExpenseForm.splitMembers.length === 0) {
                    setEditExpenseError('Please select at least one member to split with.');
                    return;
                  }
                  const allMembers = (fetchedGroup || group).members;
                  const allPending = (fetchedGroup || group).pendingMembers || [];
                  const splitWith = editExpenseForm.splitType === 'all'
                    ? [
                        ...allMembers.map(m => m.id),
                        ...allPending.map(pm => pm.email)
                      ]
                    : allMembers.filter(m => editExpenseForm.splitMembers.includes(m.name)).map(m => m.id);
                  const payer = allMembers.find(m => m.name === editExpenseForm.payer);
                  if (!payer) {
                    setEditExpenseError('Payer not found.');
                    return;
                  }
                  const updated = {
                    description: editExpenseForm.description,
                    amount: editExpenseForm.amount,
                    payerId: payer.id,
                    date: editExpenseForm.date,
                    splitType: editExpenseForm.splitType,
                    splitWith,
                    imageUrl: editExpenseForm.image ? URL.createObjectURL(editExpenseForm.image) : editExpenseForm.imageUrl,
                  };
                  const expenseId = expenses[expenseToEditIdx!].id;
                  await handleEditExpense(expenseId, updated);
                  setShowEditExpenseModal(false);
                }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Description</label>
                  <input type="text" name="description" value={editExpenseForm.description} onChange={e => setEditExpenseForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900" required />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-gray-700 font-medium mb-1">Amount ($)</label>
                    <input type="number" name="amount" min="0.01" step="0.01" value={editExpenseForm.amount} onChange={e => setEditExpenseForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900" required />
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-700 font-medium mb-1">Payer</label>
                    <select name="payer" value={editExpenseForm.payer} onChange={e => setEditExpenseForm(f => ({ ...f, payer: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900">
                      {group.members.map((m, i) => (
                        <option key={i} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Date</label>
                  <input type="date" name="date" value={editExpenseForm.date} onChange={e => setEditExpenseForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900" />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Split Method</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-900">
                      <input type="radio" name="splitType" value="all" checked={editExpenseForm.splitType === 'all'} onChange={e => setEditExpenseForm(f => ({ ...f, splitType: 'all', splitMembers: group.members.map(m => m.name) }))} className="accent-purple-400" />
                      Evenly between all
                    </label>
                    <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-900">
                      <input type="radio" name="splitType" value="subset" checked={editExpenseForm.splitType === 'subset'} onChange={e => setEditExpenseForm(f => ({ ...f, splitType: 'subset', splitMembers: [] }))} className="accent-purple-400" />
                      Evenly between selected
                    </label>
                  </div>
                  {editExpenseForm.splitType === 'subset' && (
                    <div className="flex flex-wrap gap-3">
                      {group.members.map((m, i) => (
                        <label key={i} className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 text-gray-900">
                          <input
                            type="checkbox"
                            checked={editExpenseForm.splitMembers.includes(m.name)}
                            onChange={() => setEditExpenseForm(f => {
                              const exists = f.splitMembers.includes(m.name);
                              return {
                                ...f,
                                splitMembers: exists ? f.splitMembers.filter(n => n !== m.name) : [...f.splitMembers, m.name],
                              };
                            })}
                            className="accent-purple-400"
                          />
                          {m.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Proof of Payment (optional)</label>
                  <input type="file" name="image" accept="image/*" onChange={e => {
                    const file = (e.target.files && e.target.files[0]) || null;
                    setEditExpenseForm(f => ({ ...f, image: file, imageUrl: file ? URL.createObjectURL(file) : f.imageUrl }));
                  }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900" />
                  {editExpenseForm.imageUrl && (
                    <img src={editExpenseForm.imageUrl} alt="Preview" className="mt-2 rounded-lg max-h-24 max-w-xs border border-gray-200" />
                  )}
                </div>
                {editExpenseError && <div className="text-red-500 text-sm font-medium">{editExpenseError}</div>}
                <button type="submit" className="bg-purple-400 text-white rounded px-4 py-2 mt-2 hover:bg-purple-500 transition font-semibold shadow">Save</button>
              </form>
            </div>
          </div>
        )}
      </>
    );
  } catch (err) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadeInUp text-center">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
          <h2 className="text-2xl font-bold mb-4 text-purple-400">Error</h2>
          <div className="text-gray-500 text-lg">Something went wrong loading this group.<br/>Please check your group data or try again.</div>
        </div>
      </div>
    );
  }
};

export default GroupDetails; 
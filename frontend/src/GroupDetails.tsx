import React, { useState, useRef } from 'react';

interface Member {
  name: string;
  email: string;
  phone?: string;
}

interface Group {
  name: string;
  members: Member[];
}

interface GroupDetailsProps {
  group: Group;
  groupIdx: number;
  onClose: () => void;
  onRenameGroup: (groupIdx: number, newName: string) => void;
  onDeleteGroup: (groupIdx: number) => void;
  onAddMemberToGroup: (groupIdx: number, member: Member) => void;
  onRemoveMemberFromGroup: (groupIdx: number, email: string) => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ group, groupIdx, onClose, onRenameGroup, onDeleteGroup, onAddMemberToGroup, onRemoveMemberFromGroup }) => {
  // Only use the expenses state and computed balances from user input
  const [expenses, setExpenses] = useState<any[]>([]); // State to hold expenses
  // Add Expense form state
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    payer: group.members[0]?.name || '',
    date: new Date().toISOString().slice(0, 10),
    splitType: 'all', // 'all' or 'subset'
    splitMembers: group.members.map(m => m.name), // default all
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

  // Handle form changes
  function handleExpenseChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type, files } = e.target as any;
    if (name === 'image' && files && files[0]) {
      setExpenseForm(f => ({ ...f, image: files[0], imageUrl: URL.createObjectURL(files[0]) }));
    } else if (name === 'splitType') {
      setExpenseForm(f => ({ ...f, splitType: value, splitMembers: value === 'all' ? group.members.map(m => m.name) : [] }));
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
  function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setExpenseError('');
    // This validation needs to be updated to reflect the new expenseForm structure
    // For now, it will just check if description and amount are present
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
    // Add expense
    setExpenses(prev => [
      {
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        payer: expenseForm.payer,
        date: expenseForm.date,
        split: expenseForm.splitType === 'all' ? 'Evenly' : `Evenly among: ${expenseForm.splitMembers.join(', ')}`,
        imageUrl: expenseForm.imageUrl,
      },
      ...prev,
    ]);
    setShowExpenseModal(false);
    setActiveTab('BALANCES'); // Automatically return to BALANCES tab
    setExpenseForm({
      description: '',
      amount: '',
      payer: group.members[0]?.name || '',
      date: new Date().toISOString().slice(0, 10),
      splitType: 'all',
      splitMembers: group.members.map(m => m.name),
      image: null,
      imageUrl: '',
    });
  }

  // Compute balances from expenses
  function computeBalances() {
    const balances: Record<string, number> = {};
    group.members.forEach(m => { balances[m.name] = 0; });
    for (const exp of expenses) {
      // Determine who is included in the split
      let splitMembers: string[];
      if (exp.split && exp.split.startsWith('Evenly among:')) {
        splitMembers = exp.split.replace('Evenly among: ', '').split(',').map((s: string) => s.trim()).filter(Boolean);
      } else {
        splitMembers = group.members.map(m => m.name);
      }
      // Normalize names for matching
      splitMembers = splitMembers.map(n => n.trim().toLowerCase());
      const payerName = (exp.payer || '').trim().toLowerCase();
      const groupNames = group.members.map(m => m.name);
      const share = exp.amount / splitMembers.length;
      // Payer pays for everyone, so gets reimbursed by others
      for (const name of splitMembers) {
        const memberName = groupNames.find(n => n.trim().toLowerCase() === name);
        if (!memberName) continue;
        if (name === payerName) {
          balances[memberName] += exp.amount - share;
        } else {
          balances[memberName] -= share;
        }
      }
    }
    const result = group.members.map(m => ({ name: m.name, amount: balances[m.name] }));
    console.log('DEBUG balances:', result, 'expenses:', expenses);
    return result;
  }
  const balances = computeBalances();

  try {
    // Defensive: If group or group.members is missing or not an array, show a message
    if (!group || !Array.isArray(group.members) || group.members.length === 0) {
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

    return (
      <>
        {/* Modal Overlay and Content */}
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px] pt-16">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg h-[700px] relative animate-fadeInUp flex flex-col">
            {/* Top Bar */}
            <div className="w-full px-6 pt-6 pb-2 flex flex-col gap-1 border-b border-gray-200 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between mb-1">
                <div className="text-2xl font-extrabold text-purple-400 truncate" title={group.name}>{group.name}</div>
                <div className="flex items-center gap-2">
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
                      <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg z-50">
                        <button className="w-full text-left px-4 py-2 text-gray-200 hover:bg-purple-700 focus:bg-purple-800 transition" onClick={() => { setShowRenameModal(true); setShowSettings(false); }}>Rename group</button>
                        <button className="w-full text-left px-4 py-2 text-gray-200 hover:bg-purple-700 focus:bg-purple-800 transition" onClick={() => { setShowAddMemberModal(true); setShowSettings(false); }}>Add member</button>
                        <button className="w-full text-left px-4 py-2 text-gray-200 hover:bg-purple-700 focus:bg-purple-800 transition" onClick={() => { setShowRemoveMemberModal(true); setShowSettings(false); }}>Remove member</button>
                        <button className="w-full text-left px-4 py-2 text-red-300 hover:bg-red-700 focus:bg-red-800 transition" onClick={() => { setShowDeleteModal(true); setShowSettings(false); }}>Delete group</button>
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
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap mb-2">
                {group.members.map((m, i) => (
                  <span key={i} className="bg-gray-100 rounded px-2 py-0.5 font-medium">{m.name}</span>
                ))}
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
                    {/* Tricount-style horizontal bar graph */}
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const maxAbs = Math.max(...balances.map(b => Math.abs(b.amount)), 1);
                        return balances.map((b, idx) => {
                          const barWidth = `${Math.abs(b.amount) / maxAbs * 100}%`;
                          const isPositive = b.amount > 0;
                          if (b.amount === 0) {
                            // Render only empty space for alignment
                            return (
                              <div key={b.name} className="flex items-center w-full h-10">
                                <div style={{ width: '50%' }} />
                                <div style={{ width: '50%' }} />
                              </div>
                            );
                          }
                          return (
                            <div key={b.name} className="flex items-center w-full h-10">
                              {/* Negative bar (left) */}
                              {!isPositive && (
                                <div className="flex items-center justify-end pr-2" style={{ width: barWidth }}>
                                  <div className="bg-red-200 text-red-800 rounded-l-lg h-8 flex items-center px-3 min-w-[80px] max-w-full font-semibold text-base justify-between w-full">
                                    <span>{b.amount.toFixed(2)} $</span>
                                    <span className="ml-2">{b.name}</span>
                                  </div>
                                </div>
                              )}
                              {/* Empty space for negative bar */}
                              {isPositive && <div style={{ width: '50%' }} />}
                              {/* Positive bar (right) */}
                              {isPositive && (
                                <div className="flex items-center justify-start pl-2 ml-auto" style={{ width: barWidth }}>
                                  <div className="bg-green-200 text-green-800 rounded-r-lg h-8 flex items-center px-3 min-w-[80px] max-w-full font-semibold text-base justify-between w-full">
                                    <span>{b.name}</span>
                                    <span className="ml-2">+{b.amount.toFixed(2)} $</span>
                                  </div>
                                </div>
                              )}
                              {/* Empty space for positive bar */}
                              {!isPositive && <div style={{ width: '50%' }} />}
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
                            payments.push({ from: debtor.name, to: creditor.name, amount: payAmount });
                          }
                          debtor.amount += payAmount;
                          creditor.amount -= payAmount;
                          if (Math.abs(debtor.amount) < 0.01) i++;
                          if (Math.abs(creditor.amount) < 0.01) j++;
                        }
                        if (payments.length === 0) {
                          return <div className="text-gray-400">Everyone is settled up!</div>;
                        }
                        return (
                          <ul className="space-y-2">
                            {payments.map((p, idx) => (
                              <li key={idx} className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">{p.from}</span>
                                <span className="mx-2 text-gray-500">owes</span>
                                <span className="font-medium text-purple-400">{p.to}</span>
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
                          payments.push({ from: debtor.name, to: creditor.name, amount: payAmount });
                        }
                        debtor.amount += payAmount;
                        creditor.amount -= payAmount;
                        if (Math.abs(debtor.amount) < 0.01) i++;
                        if (Math.abs(creditor.amount) < 0.01) j++;
                      }
                      // Only show what current user owes
                      const myPayments = payments.filter(p => p.from === currentUser);
                      if (myPayments.length === 0) {
                        return <div className="text-gray-400">You do not owe anyone!</div>;
                      }
                      const maxOwe = Math.max(...myPayments.map(p => p.amount), 1);
                      return (
                        <div className="flex flex-col gap-2">
                          {myPayments.map((p, idx) => (
                            <div key={idx} className="flex items-center w-full h-10">
                              <div className="flex items-center justify-end pr-2" style={{ width: `${p.amount / maxOwe * 100}%` }}>
                                <div className="bg-red-200 text-red-800 rounded-l-lg h-8 flex items-center px-3 min-w-[80px] max-w-full font-semibold text-base justify-between w-full">
                                  <span>{p.amount.toFixed(2)} $</span>
                                  <span className="ml-2">{p.to}</span>
                                </div>
                              </div>
                              <div style={{ width: '50%' }} />
                            </div>
                          ))}
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
                            payments.push({ from: debtor.name, to: creditor.name, amount: payAmount });
                          }
                          debtor.amount += payAmount;
                          creditor.amount -= payAmount;
                          if (Math.abs(debtor.amount) < 0.01) i++;
                          if (Math.abs(creditor.amount) < 0.01) j++;
                        }
                        // Only show what current user owes
                        const myPayments = payments.filter(p => p.from === currentUser);
                        if (myPayments.length === 0) {
                          return <div className="text-gray-400">You do not owe anyone!</div>;
                        }
                        return (
                          <ul className="space-y-2">
                            {myPayments.map((p, idx) => (
                              <li key={idx} className="flex items-center justify-between">
                                <span className="font-medium text-gray-700">You</span>
                                <span className="mx-2 text-gray-500">owe</span>
                                <span className="font-medium text-purple-400">{p.to}</span>
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
                  {expenses.length === 0 ? (
                    <div className="text-gray-400 bg-white rounded-xl shadow p-6">No expenses yet.</div>
                  ) : (
                    <ul className="space-y-4">
                      {expenses.map((exp, idx) => (
                        <li key={idx} className="bg-gray-50 rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold text-gray-800">{exp.description}</div>
                            <div className="text-gray-500 text-sm">Paid by <span className="font-medium">{exp.payer}</span> on {exp.date}</div>
                            {exp.imageUrl && (
                              <img src={exp.imageUrl} alt="Proof" className="mt-2 rounded-lg max-h-24 max-w-xs border border-gray-200" />
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-lg font-bold text-purple-400">{exp.amount.toFixed(2)} $</div>
                            <div className="text-xs text-gray-400">{exp.split}</div>
                          </div>
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
                            {expenseForm.splitType === 'subset' && (
                              <div className="flex flex-wrap gap-3">
                                {group.members.map((m, i) => (
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
                      onRenameGroup(groupIdx, renameInput.trim());
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
                    onDeleteGroup(groupIdx);
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
                  onClick={() => {
                    const name = addMemberInput.name.trim();
                    const email = addMemberInput.email.trim();
                    const phone = addMemberInput.phone.trim();
                    if (!name || !email) {
                      setAddMemberError('Name and email are required.');
                      return;
                    }
                    if (group.members.some(m => m.email === email)) {
                      setAddMemberError('A member with this email already exists.');
                      return;
                    }
                    onAddMemberToGroup(groupIdx, { name, email, phone: phone || undefined });
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
                        onRemoveMemberFromGroup(groupIdx, m.email);
                        setRemoveMemberError('');
                        // If only one member left after removal, close modal
                        if (group.members.length - 1 <= 1) setShowRemoveMemberModal(false);
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
import React, { useState } from 'react';

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
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ group, groupIdx, onClose }) => {
  // Dummy balances for demonstration
  const dummyBalances = [
    { name: group.members[0]?.name || 'Alex', amount: 45.75 },
    { name: group.members[1]?.name || 'Brian (me)', amount: -31.25 },
    { name: group.members[2]?.name || 'Julia', amount: 24.75 },
    { name: group.members[3]?.name || 'Thomas', amount: -39.25 },
  ];

  // Dummy expenses for demonstration
  const dummyExpenses = [
    { description: 'Dinner', amount: 80, payer: group.members[0]?.name || 'Alex', date: '2024-06-01', split: 'Evenly' },
    { description: 'Museum tickets', amount: 40, payer: group.members[1]?.name || 'Brian (me)', date: '2024-06-02', split: 'Evenly' },
    { description: 'Groceries', amount: 60, payer: group.members[2]?.name || 'Julia', date: '2024-06-03', split: 'Evenly' },
  ];
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'BALANCES' | 'MY_BALANCES'>('BALANCES');
  const currentUser = 'Brian (me)'; // For demo, hardcoded. Later, make dynamic.

  // Replace dummyExpenses with state
  const [expenses, setExpenses] = useState(dummyExpenses);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-purple-400">{group.name}</h2>
        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            className={`px-4 py-2 font-semibold focus:outline-none transition-colors duration-150 ${activeTab === 'EXPENSES' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('EXPENSES')}
          >
            EXPENSES
          </button>
          <button
            className={`ml-4 px-4 py-2 font-semibold focus:outline-none transition-colors duration-150 ${activeTab === 'BALANCES' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('BALANCES')}
          >
            BALANCES
          </button>
          <button
            className={`ml-4 px-4 py-2 font-semibold focus:outline-none transition-colors duration-150 ${activeTab === 'MY_BALANCES' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
            onClick={() => setActiveTab('MY_BALANCES')}
          >
            MY BALANCES
          </button>
        </div>
        {/* Tab Content */}
        <div className="transition-all duration-300 min-h-[340px] flex flex-col justify-start">
          {activeTab === 'BALANCES' && (
            <div>
              <div className="mb-6">
                {/* Tricount-style horizontal bar graph */}
                <div className="flex flex-col gap-2">
                  {(() => {
                    const maxAbs = Math.max(...dummyBalances.map(b => Math.abs(b.amount)), 1);
                    return dummyBalances.map((b, idx) => {
                      const barWidth = `${Math.abs(b.amount) / maxAbs * 100}%`;
                      const isPositive = b.amount > 0;
                      return (
                        <div key={b.name} className="flex items-center w-full h-10">
                          {/* Negative bar (left) */}
                          {!isPositive && (
                            <div className="flex items-center justify-end pr-2" style={{ width: barWidth }}>
                              <div className="bg-red-200 text-red-800 rounded-l-lg h-8 flex items-center px-3 min-w-[80px] max-w-full font-semibold text-base justify-between w-full">
                                <span>{b.amount.toFixed(2)} €</span>
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
                                <span className="ml-2">+{b.amount.toFixed(2)} €</span>
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
                    const creditors = dummyBalances.filter(b => b.amount > 0).map(b => ({ ...b }));
                    const debtors = dummyBalances.filter(b => b.amount < 0).map(b => ({ ...b }));
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
                            <span className="ml-2 font-semibold">{p.amount.toFixed(2)} €</span>
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
                  const creditors = dummyBalances.filter(b => b.amount > 0).map(b => ({ ...b }));
                  const debtors = dummyBalances.filter(b => b.amount < 0).map(b => ({ ...b }));
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
                              <span>{p.amount.toFixed(2)} €</span>
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
                    const creditors = dummyBalances.filter(b => b.amount > 0).map(b => ({ ...b }));
                    const debtors = dummyBalances.filter(b => b.amount < 0).map(b => ({ ...b }));
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
                            <span className="ml-2 font-semibold">{p.amount.toFixed(2)} €</span>
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
                        <div className="text-lg font-bold text-purple-400">{exp.amount.toFixed(2)} €</div>
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
  );
};

export default GroupDetails; 
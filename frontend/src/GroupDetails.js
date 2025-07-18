import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
const GroupDetails = ({ group, groupId, groupIdx, userId, onClose, onRenameGroup, onDeleteGroup, onAddMemberToGroup, onRemoveMemberFromGroup, onGroupUpdated }) => {
    // Always compute members and pending at the very top
    const allMembers = (group.members || []);
    const allPending = group.pendingMembers || [];
    const allSplitMembers = [
        ...allMembers.map(m => ({ id: m.id, name: m.name, email: m.email })),
        ...allPending.map(pm => ({ id: undefined, name: pm.name || pm.email, email: pm.email })),
    ];
    // Only use the expenses state and computed balances from user input
    const [expenses, setExpenses] = useState([]); // State to hold expenses
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
        image: null,
        imageUrl: '',
    });
    const [expenseError, setExpenseError] = useState('');
    const [activeTab, setActiveTab] = useState('BALANCES');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(group.members[0]?.name || ''); // Default to first member
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameInput, setRenameInput] = useState(group.name);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [addMemberInput, setAddMemberInput] = useState({ name: '', email: '', phone: '' });
    const [addMemberError, setAddMemberError] = useState('');
    const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
    const [removeMemberError, setRemoveMemberError] = useState('');
    const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false);
    const [expenseToDeleteIdx, setExpenseToDeleteIdx] = useState(null);
    const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
    const [expenseToEditIdx, setExpenseToEditIdx] = useState(null);
    const [editExpenseForm, setEditExpenseForm] = useState({
        description: '',
        amount: '',
        payer: '',
        date: '',
        splitType: 'all',
        splitMembers: [],
        image: null,
        imageUrl: '',
    });
    const [editExpenseError, setEditExpenseError] = useState('');
    const [fetchedGroup, setFetchedGroup] = useState(null);
    const [loading, setLoading] = useState(false);
    const userEmail = group.members[0]?.email;
    const [showEtransferDropdown, setShowEtransferDropdown] = useState(false);
    const etransferRef = useRef(null);
    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (etransferRef.current && !etransferRef.current.contains(event.target)) {
                setShowEtransferDropdown(false);
            }
        }
        if (showEtransferDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        else {
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
            // userId should be the UUID, not email
            const res = await fetch(`/api/groups/${groupId}?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setFetchedGroup(data);
            }
        }
        finally {
            setLoading(false);
        }
    }
    // --- RENAME GROUP ---
    async function handleRenameGroup(newName) {
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
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
        }
        catch { }
    }
    // --- ADD MEMBER ---
    async function handleAddMember(member) {
        try {
            const res = await fetch(`/api/groups/${groupId}/add-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: member.email, name: member.name }),
            });
            if (res.ok) {
                const updated = await res.json();
                setFetchedGroup(updated);
                onGroupUpdated(updated);
            }
        }
        catch { }
    }
    // --- REMOVE MEMBER ---
    async function handleRemoveMember(email) {
        try {
            const res = await fetch(`/api/groups/${groupId}/remove-member`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                const updated = await res.json();
                setFetchedGroup(updated);
                onGroupUpdated(updated);
            }
        }
        catch { }
    }
    // --- DELETE GROUP ---
    async function handleDeleteGroup() {
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (res.ok) {
                onDeleteGroup(groupIdx);
            }
        }
        catch { }
    }
    // --- DELETE EXPENSE ---
    async function handleDeleteExpense(expenseId) {
        try {
            const res = await fetch(`/api/expenses/${expenseId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                await refreshExpenses();
            }
        }
        catch { }
    }
    // --- EDIT EXPENSE ---
    async function handleEditExpense(expenseId, updated) {
        try {
            const res = await fetch(`/api/expenses/${expenseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated),
            });
            if (res.ok) {
                await refreshExpenses();
            }
        }
        catch { }
    }
    // Helper to refresh expenses from backend
    async function refreshExpenses() {
        setExpensesLoading(true);
        setExpensesError('');
        try {
            const res = await fetch(`/api/expenses?groupId=${groupId}`);
            if (res.ok) {
                const data = await res.json();
                setExpenses(data);
            }
            else {
                setExpensesError('Failed to fetch expenses');
            }
        }
        catch (err) {
            setExpensesError('Failed to fetch expenses');
        }
        finally {
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
                const res = await fetch(`/api/expenses?groupId=${groupId}`);
                if (res.ok) {
                    const data = await res.json();
                    setExpenses(data);
                }
                else {
                    setExpensesError('Failed to fetch expenses');
                }
            }
            catch (err) {
                setExpensesError('Failed to fetch expenses');
            }
            finally {
                setExpensesLoading(false);
            }
        }
        fetchExpenses();
    }, [groupId]);
    // Handle form changes
    function handleExpenseChange(e) {
        const { name, value, type, files } = e.target;
        if (name === 'image' && files && files[0]) {
            setExpenseForm(f => ({ ...f, image: files[0], imageUrl: URL.createObjectURL(files[0]) }));
        }
        else if (name === 'splitType') {
            setExpenseForm(f => ({ ...f, splitType: value, splitMembers: value === 'all' ? allSplitMembers.map(m => m.name) : [] }));
        }
        else {
            setExpenseForm(f => ({ ...f, [name]: value }));
        }
    }
    function handleSplitMemberToggle(name) {
        setExpenseForm(f => {
            const exists = f.splitMembers.includes(name);
            return {
                ...f,
                splitMembers: exists ? f.splitMembers.filter(n => n !== name) : [...f.splitMembers, name],
            };
        });
    }
    async function handleExpenseSubmit(e) {
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
            const res = await fetch('/api/expenses', {
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
        }
        catch (err) {
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
        const memberMap = {};
        allMembers.forEach(m => { memberMap[m.id] = { id: m.id, name: m.name, email: m.email }; });
        // Initialize balances
        const balances = {};
        Object.keys(memberMap).forEach(id => { balances[id] = 0; });
        for (const exp of expenses) {
            // Use splitWith (array of user IDs or emails) or all members if not set
            const splitWith = (exp.splitWith && exp.splitWith.length > 0)
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
                }
                else {
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
        const memberMap = {};
        allMembers.forEach(m => { memberMap[m.id] = { id: m.id, name: m.name, email: m.email }; });
        const memberIds = Object.keys(memberMap);
        // Initialize pairwise debts: debts[a][b] = how much a owes b
        const debts = {};
        memberIds.forEach(a => {
            debts[a] = {};
            memberIds.forEach(b => { debts[a][b] = 0; });
        });
        for (const exp of expenses) {
            const splitWith = (exp.splitWith && exp.splitWith.length > 0)
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
            return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadeInUp text-center", children: [_jsx("button", { onClick: onClose, className: "absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold", "aria-label": "Close", children: "\u00D7" }), _jsx("h2", { className: "text-2xl font-bold mb-4 text-purple-400", children: group?.name || 'Group' }), _jsxs("div", { className: "text-gray-500 text-lg", children: ["This group is missing members or is not set up correctly.", _jsx("br", {}), "Please add members before adding expenses or viewing balances."] })] }) }));
        }
        if (loading) {
            return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]", children: _jsx("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadeInUp text-center", children: _jsx("div", { className: "text-xl font-bold text-purple-400 mb-4", children: "Loading group details..." }) }) }));
        }
        return (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px] pt-16", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl w-full max-w-lg h-[700px] relative animate-fadeInUp flex flex-col", children: [_jsxs("div", { className: "w-full px-6 pt-6 pb-2 flex flex-col gap-1 border-b border-gray-200 bg-white rounded-t-2xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("div", { className: "text-2xl font-extrabold text-purple-400 truncate", title: displayGroup.name, children: displayGroup.name }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative", ref: etransferRef, children: [_jsx("button", { className: "p-2 rounded-full hover:bg-purple-100 text-purple-600 focus:outline-none", title: "Show e-transfer addresses", onClick: () => setShowEtransferDropdown(v => !v), children: _jsxs("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", strokeWidth: "2", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 17v.01" })] }) }), showEtransferDropdown && (_jsxs("div", { className: "absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-4 border border-purple-100", children: [_jsx("div", { className: "font-semibold text-purple-500 mb-2", children: "E-transfer Addresses" }), _jsx("ul", { className: "space-y-2", children: (displayGroup.members || []).map((m, i) => (_jsxs("li", { className: "text-sm text-gray-700 flex flex-col", children: [_jsx("span", { className: "font-medium", children: m.name }), _jsx("span", { className: "text-xs text-gray-500", children: m.email }), (m.etransferEmail || m.etransferPhone) ? (_jsxs("span", { className: "text-xs text-gray-600 mt-0.5", children: [m.etransferEmail && _jsxs("span", { children: ["E-transfer: ", m.etransferEmail] }), m.etransferEmail && m.etransferPhone && _jsx("span", { children: " | " }), m.etransferPhone && _jsxs("span", { children: ["Phone: ", m.etransferPhone] })] })) : (_jsx("span", { className: "text-xs text-gray-400 italic", children: "No e-transfer info" }))] }, i))) })] }))] }), _jsxs("div", { className: "relative", ref: settingsRef, children: [_jsx("button", { className: "p-2 rounded-full hover:bg-purple-100 text-purple-600 focus:outline-none", title: "Settings", onClick: () => setShowSettings(v => !v), children: _jsxs("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", strokeWidth: "2", viewBox: "0 0 24 24", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.4 15a1.65 1.65 0 01.33 1.82l-.06.1a2 2 0 01-2.18 1.09 8.12 8.12 0 01-2.18-.9 8.12 8.12 0 01-2.18.9 2 2 0 01-2.18-1.09l-.06-.1A1.65 1.65 0 014.6 15a2 2 0 01-.33-1.82l.06-.1a8.12 8.12 0 01.9-2.18 8.12 8.12 0 01-.9-2.18A2 2 0 014.6 9a1.65 1.65 0 01.33-1.82l.06-.1A2 2 0 017.17 6a8.12 8.12 0 012.18.9 8.12 8.12 0 012.18-.9A2 2 0 0114.83 6a1.65 1.65 0 011.82.33l.1.06a2 2 0 011.09 2.18 8.12 8.12 0 01.9 2.18 8.12 8.12 0 01.9 2.18 2 2 0 01-1.09 2.18z" })] }) }), showSettings && (_jsxs("div", { className: "absolute right-0 mt-2 w-48 bg-gray-200 rounded-lg shadow-lg z-50", children: [_jsx("button", { className: "w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-100 focus:bg-purple-200 transition", onClick: () => { setShowRenameModal(true); setShowSettings(false); }, children: "Rename group" }), _jsx("button", { className: "w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-100 focus:bg-purple-200 transition", onClick: () => { setShowAddMemberModal(true); setShowSettings(false); }, children: "Add member" }), _jsx("button", { className: "w-full text-left px-4 py-2 text-gray-700 hover:bg-purple-100 focus:bg-purple-200 transition", onClick: () => { setShowRemoveMemberModal(true); setShowSettings(false); }, children: "Remove member" }), _jsx("button", { className: "w-full text-left px-4 py-2 text-red-500 hover:bg-red-100 focus:bg-red-200 transition", onClick: () => { setShowDeleteModal(true); setShowSettings(false); }, children: "Delete group" })] }))] }), _jsx("button", { onClick: onClose, className: "p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-2xl font-bold z-20 ml-1", "aria-label": "Close", children: "\u00D7" })] })] }), _jsxs("div", { className: "flex flex-col items-center my-4", children: [_jsx("div", { className: "font-semibold text-gray-700 mb-1", children: "Members:" }), _jsxs("ul", { className: "space-y-1", children: [displayGroup.members.map((m, i) => (_jsxs("li", { className: "text-sm text-gray-700 flex items-center justify-center", children: [_jsx("span", { className: "font-medium", children: m.name }), _jsxs("span", { className: "ml-2 text-xs text-gray-500", children: ["(", m.email, ")"] })] }, i))), displayGroup.pendingMembers && displayGroup.pendingMembers.length > 0 && (_jsx("li", { className: "text-xs text-gray-500 mt-2", children: "Invited (pending):" })), displayGroup.pendingMembers && displayGroup.pendingMembers.map((pm, i) => (_jsx("li", { className: "text-sm text-gray-400 flex items-center justify-center italic", children: _jsx("span", { className: "font-medium", children: pm.name ? `${pm.name} (${pm.email})` : pm.email }) }, "pending-" + i)))] })] }), _jsx("div", { className: "flex w-full gap-2 mt-1 border-b border-gray-200", children: ['EXPENSES', 'BALANCES', 'MY_BALANCES'].map(tab => (_jsx("button", { className: `flex-1 py-2 text-base font-semibold transition-colors duration-150 focus:outline-none rounded-lg
                      ${activeTab === tab ? 'text-purple-600 bg-white border-b-4 border-purple-400 shadow-sm' : 'text-gray-700 bg-gray-100 border-b-4 border-transparent'}`, onClick: () => setActiveTab(tab), children: tab.replace('_', ' ') }, tab))) })] }), _jsxs("div", { className: "flex-1 w-full px-6 pb-6 pt-2 overflow-y-auto transition-all duration-300 min-h-[340px] flex flex-col justify-start", children: [activeTab === 'BALANCES' && (_jsxs("div", { children: [_jsx("div", { className: "mb-6", children: _jsx("div", { className: "flex flex-col gap-3", children: (() => {
                                                        const maxAbs = Math.max(...balances.map(b => Math.abs(b.amount)), 1);
                                                        return balances.map((b, idx) => {
                                                            const percent = Math.abs(b.amount) / maxAbs * 100;
                                                            const isPositive = b.amount > 0;
                                                            return (_jsxs("div", { className: "flex items-center w-full h-10 relative", children: [_jsx("div", { className: "absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 z-0", style: { height: '100%' } }), _jsx("div", { className: "flex-1 flex justify-end pr-2 relative z-10 items-center", children: b.amount < 0 && (_jsxs(_Fragment, { children: [_jsx("span", { className: "mr-2 font-medium text-gray-700 whitespace-nowrap", children: b.name }), _jsx("div", { className: "flex items-center bg-red-100 rounded-l-full h-10 px-6 font-semibold text-red-700 text-base shadow-sm transition-all duration-200 whitespace-nowrap min-w-[80px] max-w-[60%]", style: { width: `${percent}%`, justifyContent: 'flex-end' }, children: _jsxs("span", { children: [b.amount.toFixed(2), " $"] }) })] })) }), _jsx("div", { className: "flex-1 flex justify-start pl-2 relative z-10 items-center", children: b.amount > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center bg-green-100 rounded-r-full h-10 px-6 font-semibold text-green-700 text-base shadow-sm transition-all duration-200 whitespace-nowrap min-w-[80px] max-w-[60%]", style: { width: `${percent}%`, justifyContent: 'flex-start' }, children: _jsxs("span", { children: ["+", b.amount.toFixed(2), " $"] }) }), _jsx("span", { className: "ml-2 font-medium text-gray-700 whitespace-nowrap", children: b.name })] })) })] }, b.name));
                                                        });
                                                    })() }) }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "font-semibold text-gray-700 mb-2", children: "Who owes to whom?" }), _jsx("div", { className: "bg-gray-50 rounded-lg p-4 text-gray-700 text-sm", children: (() => {
                                                            const { pairwise, memberMap } = computePairwiseDebts();
                                                            // Only keep positive entries and sort by the name of the person who owes money
                                                            const filtered = pairwise
                                                                .filter(p => p.amount > 0)
                                                                .sort((a, b) => memberMap[a.from].name.localeCompare(memberMap[b.from].name));
                                                            if (filtered.length === 0) {
                                                                return _jsx("div", { className: "text-gray-400", children: "Everyone is settled up!" });
                                                            }
                                                            return (_jsx("ul", { className: "space-y-2", children: filtered.map((p, idx) => (_jsxs("li", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-medium text-gray-700", children: memberMap[p.from].name }), _jsx("span", { className: "mx-2 text-gray-500", children: "owes" }), _jsx("span", { className: "font-medium text-purple-400", children: memberMap[p.to].name }), _jsxs("span", { className: "ml-2 font-semibold", children: [p.amount.toFixed(2), " $"] })] }, idx))) }));
                                                        })() })] })] })), activeTab === 'MY_BALANCES' && (_jsxs("div", { children: [_jsx("div", { className: "mb-6", children: (() => {
                                                    // Calculate minimal payments
                                                    const creditors = balances.filter(b => b.amount > 0).map(b => ({ ...b }));
                                                    const debtors = balances.filter(b => b.amount < 0).map(b => ({ ...b }));
                                                    const payments = [];
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
                                                        if (Math.abs(debtor.amount) < 0.01)
                                                            i++;
                                                        if (Math.abs(creditor.amount) < 0.01)
                                                            j++;
                                                    }
                                                    // Only show what current user owes
                                                    const myPayments = payments.filter(p => p.from === currentUserId);
                                                    if (myPayments.length === 0) {
                                                        return _jsx("div", { className: "text-gray-400", children: "You do not owe anyone!" });
                                                    }
                                                    const maxOwe = Math.max(...myPayments.map(p => p.amount), 1);
                                                    return (_jsx("div", { className: "flex flex-col gap-2", children: myPayments.map((p, idx) => {
                                                            const toMember = allMembers.find(m => m.id === p.to);
                                                            return (_jsxs("div", { className: "flex items-center w-full h-10", children: [_jsx("div", { className: "flex items-center justify-end pr-2", style: { width: `${p.amount / maxOwe * 100}%` }, children: _jsxs("div", { className: "bg-red-200 text-red-800 rounded-l-lg h-8 flex items-center px-3 min-w-[80px] max-w-full font-semibold text-base justify-between w-full", children: [_jsxs("span", { children: [p.amount.toFixed(2), " $"] }), _jsx("span", { className: "ml-2", children: toMember ? (toMember.id === currentUserId ? 'You' : toMember.name) : p.to })] }) }), _jsx("div", { style: { width: '50%' } })] }, idx));
                                                        }) }));
                                                })() }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "font-semibold text-gray-700 mb-2", children: "Who do I owe?" }), _jsx("div", { className: "bg-gray-50 rounded-lg p-4 text-gray-700 text-sm", children: (() => {
                                                            // Calculate minimal payments
                                                            const creditors = balances.filter(b => b.amount > 0).map(b => ({ ...b }));
                                                            const debtors = balances.filter(b => b.amount < 0).map(b => ({ ...b }));
                                                            const payments = [];
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
                                                                if (Math.abs(debtor.amount) < 0.01)
                                                                    i++;
                                                                if (Math.abs(creditor.amount) < 0.01)
                                                                    j++;
                                                            }
                                                            // Only show what current user owes
                                                            const myPayments = payments.filter(p => p.from === currentUserId);
                                                            if (myPayments.length === 0) {
                                                                return _jsx("div", { className: "text-gray-400", children: "You do not owe anyone!" });
                                                            }
                                                            return (_jsx("ul", { className: "space-y-2", children: myPayments.map((p, idx) => {
                                                                    const toMember = allMembers.find(m => m.id === p.to);
                                                                    return (_jsxs("li", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-medium text-gray-700", children: "You" }), _jsx("span", { className: "mx-2 text-gray-500", children: "owe" }), _jsx("span", { className: "font-medium text-purple-400", children: toMember ? (toMember.id === currentUserId ? 'You' : toMember.name) : p.to }), _jsxs("span", { className: "ml-2 font-semibold", children: [p.amount.toFixed(2), " $"] })] }, idx));
                                                                }) }));
                                                        })() })] })] })), activeTab === 'EXPENSES' && (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("div", { className: "text-xl font-semibold text-purple-400", children: "Expenses" }), _jsx("button", { className: "bg-purple-400 text-white rounded px-4 py-2 hover:bg-purple-500 transition font-semibold shadow", onClick: () => setShowExpenseModal(true), children: "+ Add Expense" })] }), expensesLoading ? (_jsx("div", { className: "text-gray-400 bg-white rounded-xl shadow p-6", children: "Loading expenses..." })) : expensesError ? (_jsx("div", { className: "text-red-500 bg-white rounded-xl shadow p-6", children: expensesError })) : expenses.length === 0 ? (_jsx("div", { className: "text-gray-400 bg-white rounded-xl shadow p-6", children: "No expenses yet." })) : (_jsx("ul", { className: "space-y-4", children: expenses.map((exp, idx) => (_jsx("li", { className: "bg-gray-50 rounded-xl shadow p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2", children: expenseToDeleteIdx === idx ? (_jsxs("div", { className: "flex flex-col w-full items-center", children: [_jsx("div", { className: "text-red-500 font-bold mb-2", children: "Delete Expense" }), _jsxs("div", { className: "text-gray-700 mb-4 text-center", children: ["Are you sure you want to delete this expense?", _jsx("br", {}), _jsx("span", { className: 'font-semibold', children: exp.description })] }), _jsxs("div", { className: "flex gap-2 w-full justify-center", children: [_jsx("button", { className: "bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600 transition font-semibold shadow", onClick: async () => {
                                                                            const expenseId = expenses[idx].id;
                                                                            await handleDeleteExpense(expenseId);
                                                                            setExpenseToDeleteIdx(null);
                                                                        }, children: "Delete" }), _jsx("button", { className: "bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow", onClick: () => setExpenseToDeleteIdx(null), children: "Cancel" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold text-gray-800", children: exp.description }), _jsxs("div", { className: "text-gray-500 text-sm", children: ["Paid by", ' ', _jsx("span", { className: "font-medium", children: (() => {
                                                                                    const allMembers = (fetchedGroup || group).members;
                                                                                    const payer = allMembers.find(m => m.id === exp.payerId);
                                                                                    return payer ? `${payer.name} (${payer.email})` : 'Unknown';
                                                                                })() }), ' ', "on ", exp.date] }), exp.imageUrl && (_jsx("img", { src: exp.imageUrl, alt: "Proof", className: "mt-2 rounded-lg max-h-24 max-w-xs border border-gray-200" }))] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "text-lg font-bold text-purple-400", children: [exp.amount.toFixed(2), " $"] }), _jsx("div", { className: "text-xs text-gray-400", children: exp.split }), _jsxs("div", { className: "flex flex-col gap-2 items-end justify-center min-w-[40px]", children: [_jsx("button", { className: "text-purple-400 hover:text-purple-600 p-2 rounded-full transition", title: "Edit expense", onClick: () => {
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
                                                                                }, children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3h3z" }) }) }), _jsx("button", { className: "text-red-400 hover:text-red-600 p-2 rounded-full transition", title: "Delete expense", onClick: () => { setExpenseToDeleteIdx(idx); }, children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })] })] })] })) }, idx))) })), showExpenseModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeInUp", children: [_jsx("button", { onClick: () => setShowExpenseModal(false), className: "absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold", "aria-label": "Close", children: "\u00D7" }), _jsx("div", { className: "text-xl font-bold text-purple-400 mb-4", children: "Add Expense" }), _jsxs("form", { onSubmit: handleExpenseSubmit, className: "flex flex-col gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Description" }), _jsx("input", { type: "text", name: "description", value: expenseForm.description, onChange: handleExpenseChange, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", required: true })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Amount ($)" }), _jsx("input", { type: "number", name: "amount", min: "0.01", step: "0.01", value: expenseForm.amount, onChange: handleExpenseChange, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", required: true })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Payer" }), _jsx("select", { name: "payer", value: expenseForm.payer, onChange: handleExpenseChange, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", children: group.members.map((m, i) => (_jsx("option", { value: m.name, children: m.name }, i))) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Date" }), _jsx("input", { type: "date", name: "date", value: expenseForm.date, onChange: handleExpenseChange, className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Split Method" }), _jsxs("div", { className: "flex gap-4 mb-2", children: [_jsxs("label", { className: "flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-900", children: [_jsx("input", { type: "radio", name: "splitType", value: "all", checked: expenseForm.splitType === 'all', onChange: handleExpenseChange, className: "accent-purple-400" }), "Evenly between all"] }), _jsxs("label", { className: "flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-900", children: [_jsx("input", { type: "radio", name: "splitType", value: "subset", checked: expenseForm.splitType === 'subset', onChange: handleExpenseChange, className: "accent-purple-400" }), "Evenly between selected"] })] }), expenseForm.splitType === 'all' && (_jsxs("div", { className: "text-xs text-gray-600 mb-2", children: ["Splitting between ", _jsx("span", { className: "font-semibold", children: allSplitMembers.length }), " people", Number(expenseForm.amount) > 0 && (_jsxs(_Fragment, { children: [': ', _jsxs("span", { className: "font-semibold", children: [(Number(expenseForm.amount) / allSplitMembers.length).toFixed(2), " $"] }), " per person"] }))] })), expenseForm.splitType === 'subset' && (_jsx("div", { className: "flex flex-wrap gap-3", children: allSplitMembers.map((m, i) => (_jsxs("label", { className: "flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 text-gray-900", children: [_jsx("input", { type: "checkbox", checked: expenseForm.splitMembers.includes(m.name), onChange: () => handleSplitMemberToggle(m.name), className: "accent-purple-400" }), m.name] }, i))) }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Proof of Payment (optional)" }), _jsx("input", { type: "file", name: "image", accept: "image/*", onChange: handleExpenseChange, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900" }), expenseForm.imageUrl && (_jsx("img", { src: expenseForm.imageUrl, alt: "Preview", className: "mt-2 rounded-lg max-h-24 max-w-xs border border-gray-200" }))] }), expenseError && _jsx("div", { className: "text-red-500 text-sm font-medium", children: expenseError }), _jsx("button", { type: "submit", className: "bg-purple-400 text-white rounded px-4 py-2 mt-2 hover:bg-purple-500 transition font-semibold shadow", children: "Add Expense" })] })] }) }))] }))] })] }) }), showRenameModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs relative animate-fadeInUp flex flex-col items-center", children: [_jsx("div", { className: "text-lg font-bold text-purple-500 mb-4", children: "Rename Group" }), _jsx("input", { type: "text", value: renameInput, onChange: e => setRenameInput(e.target.value), className: "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", autoFocus: true }), _jsxs("div", { className: "flex gap-2 w-full", children: [_jsx("button", { className: "flex-1 bg-purple-400 text-white rounded px-4 py-2 hover:bg-purple-500 transition font-semibold shadow", onClick: () => {
                                            if (renameInput.trim()) {
                                                handleRenameGroup(renameInput.trim());
                                                setShowRenameModal(false);
                                            }
                                        }, children: "Save" }), _jsx("button", { className: "flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow", onClick: () => setShowRenameModal(false), children: "Cancel" })] })] }) })), showDeleteModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs relative animate-fadeInUp flex flex-col items-center", children: [_jsx("div", { className: "text-lg font-bold text-red-500 mb-4", children: "Delete Group" }), _jsxs("div", { className: "text-gray-700 mb-6 text-center", children: ["Are you sure you want to delete this group?", _jsx("br", {}), _jsx("span", { className: 'font-semibold', children: group.name })] }), _jsxs("div", { className: "flex gap-2 w-full", children: [_jsx("button", { className: "flex-1 bg-red-500 text-white rounded px-4 py-2 hover:bg-red-600 transition font-semibold shadow", onClick: () => {
                                            handleDeleteGroup();
                                            setShowDeleteModal(false);
                                        }, children: "Delete" }), _jsx("button", { className: "flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow", onClick: () => setShowDeleteModal(false), children: "Cancel" })] })] }) })), showAddMemberModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs relative animate-fadeInUp flex flex-col items-center", children: [_jsx("div", { className: "text-lg font-bold text-purple-500 mb-4", children: "Add Member" }), _jsx("input", { type: "text", value: addMemberInput.name, onChange: e => setAddMemberInput({ ...addMemberInput, name: e.target.value }), className: "w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", placeholder: "Name (required)", autoFocus: true }), _jsx("input", { type: "email", value: addMemberInput.email, onChange: e => setAddMemberInput({ ...addMemberInput, email: e.target.value }), className: "w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", placeholder: "Email (required)" }), _jsx("input", { type: "tel", value: addMemberInput.phone, onChange: e => setAddMemberInput({ ...addMemberInput, phone: e.target.value }), className: "w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", placeholder: "Phone (optional)" }), addMemberError && _jsx("div", { className: "text-red-500 text-sm mb-2", children: addMemberError }), _jsxs("div", { className: "flex gap-2 w-full", children: [_jsx("button", { className: "flex-1 bg-purple-400 text-white rounded px-4 py-2 hover:bg-purple-500 transition font-semibold shadow", onClick: async () => {
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
                                        }, children: "Add" }), _jsx("button", { className: "flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow", onClick: () => {
                                            setShowAddMemberModal(false);
                                            setAddMemberError('');
                                            setAddMemberInput({ name: '', email: '', phone: '' });
                                        }, children: "Cancel" })] })] }) })), showRemoveMemberModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-xs relative animate-fadeInUp flex flex-col items-center", children: [_jsx("div", { className: "text-lg font-bold text-purple-500 mb-4", children: "Remove Member" }), removeMemberError && _jsx("div", { className: "text-red-500 text-sm mb-2", children: removeMemberError }), _jsxs("ul", { className: "w-full mb-4", children: [group.members.map((m, i) => (_jsxs("li", { className: "flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0", children: [_jsxs("span", { className: "text-gray-900", children: [m.name, " ", _jsxs("span", { className: "text-xs text-gray-500", children: ["(", m.email, ")"] })] }), _jsx("button", { className: "bg-red-400 text-white rounded px-3 py-1 text-sm hover:bg-red-500 transition font-semibold disabled:opacity-50", disabled: group.members.length === 1, onClick: () => {
                                                    if (group.members.length === 1) {
                                                        setRemoveMemberError('A group must have at least one member.');
                                                        return;
                                                    }
                                                    handleRemoveMember(m.email);
                                                    setRemoveMemberError('');
                                                    if (group.members.length - 1 <= 1)
                                                        setShowRemoveMemberModal(false);
                                                }, children: "Remove" })] }, i))), group.pendingMembers && group.pendingMembers.map((pm, i) => (_jsxs("li", { className: "flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0", children: [_jsxs("span", { className: "text-gray-400 italic", children: [pm.name ? `${pm.name} (${pm.email})` : pm.email, " ", _jsx("span", { className: "text-xs", children: "(invited)" })] }), _jsx("button", { className: "bg-red-400 text-white rounded px-3 py-1 text-sm hover:bg-red-500 transition font-semibold", onClick: () => {
                                                    handleRemoveMember(pm.email);
                                                    setRemoveMemberError('');
                                                }, children: "Remove" })] }, "pending-" + i)))] }), _jsx("button", { className: "w-full bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow", onClick: () => {
                                    setShowRemoveMemberModal(false);
                                    setRemoveMemberError('');
                                }, children: "Cancel" })] }) })), showEditExpenseModal && expenseToEditIdx !== null && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeInUp", children: [_jsx("button", { onClick: () => setShowEditExpenseModal(false), className: "absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold", "aria-label": "Close", children: "\u00D7" }), _jsx("div", { className: "text-xl font-bold text-purple-400 mb-4", children: "Edit Expense" }), _jsxs("form", { onSubmit: async (e) => {
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
                                    const expenseId = expenses[expenseToEditIdx].id;
                                    await handleEditExpense(expenseId, updated);
                                    setShowEditExpenseModal(false);
                                }, className: "flex flex-col gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Description" }), _jsx("input", { type: "text", name: "description", value: editExpenseForm.description, onChange: e => setEditExpenseForm(f => ({ ...f, description: e.target.value })), className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", required: true })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Amount ($)" }), _jsx("input", { type: "number", name: "amount", min: "0.01", step: "0.01", value: editExpenseForm.amount, onChange: e => setEditExpenseForm(f => ({ ...f, amount: e.target.value })), className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", required: true })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Payer" }), _jsx("select", { name: "payer", value: editExpenseForm.payer, onChange: e => setEditExpenseForm(f => ({ ...f, payer: e.target.value })), className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900", children: group.members.map((m, i) => (_jsx("option", { value: m.name, children: m.name }, i))) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Date" }), _jsx("input", { type: "date", name: "date", value: editExpenseForm.date, onChange: e => setEditExpenseForm(f => ({ ...f, date: e.target.value })), className: "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-gray-900" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Split Method" }), _jsxs("div", { className: "flex gap-4 mb-2", children: [_jsxs("label", { className: "flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-900", children: [_jsx("input", { type: "radio", name: "splitType", value: "all", checked: editExpenseForm.splitType === 'all', onChange: e => setEditExpenseForm(f => ({ ...f, splitType: 'all', splitMembers: group.members.map(m => m.name) })), className: "accent-purple-400" }), "Evenly between all"] }), _jsxs("label", { className: "flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1 text-gray-900", children: [_jsx("input", { type: "radio", name: "splitType", value: "subset", checked: editExpenseForm.splitType === 'subset', onChange: e => setEditExpenseForm(f => ({ ...f, splitType: 'subset', splitMembers: [] })), className: "accent-purple-400" }), "Evenly between selected"] })] }), editExpenseForm.splitType === 'subset' && (_jsx("div", { className: "flex flex-wrap gap-3", children: group.members.map((m, i) => (_jsxs("label", { className: "flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 text-gray-900", children: [_jsx("input", { type: "checkbox", checked: editExpenseForm.splitMembers.includes(m.name), onChange: () => setEditExpenseForm(f => {
                                                                const exists = f.splitMembers.includes(m.name);
                                                                return {
                                                                    ...f,
                                                                    splitMembers: exists ? f.splitMembers.filter(n => n !== m.name) : [...f.splitMembers, m.name],
                                                                };
                                                            }), className: "accent-purple-400" }), m.name] }, i))) }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-gray-700 font-medium mb-1", children: "Proof of Payment (optional)" }), _jsx("input", { type: "file", name: "image", accept: "image/*", onChange: e => {
                                                    const file = (e.target.files && e.target.files[0]) || null;
                                                    setEditExpenseForm(f => ({ ...f, image: file, imageUrl: file ? URL.createObjectURL(file) : f.imageUrl }));
                                                }, className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900" }), editExpenseForm.imageUrl && (_jsx("img", { src: editExpenseForm.imageUrl, alt: "Preview", className: "mt-2 rounded-lg max-h-24 max-w-xs border border-gray-200" }))] }), editExpenseError && _jsx("div", { className: "text-red-500 text-sm font-medium", children: editExpenseError }), _jsx("button", { type: "submit", className: "bg-purple-400 text-white rounded px-4 py-2 mt-2 hover:bg-purple-500 transition font-semibold shadow", children: "Save" })] })] }) }))] }));
    }
    catch (err) {
        return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-100/80 via-purple-100/80 to-purple-200/80 backdrop-blur-[3px]", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadeInUp text-center", children: [_jsx("button", { onClick: onClose, className: "absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold", "aria-label": "Close", children: "\u00D7" }), _jsx("h2", { className: "text-2xl font-bold mb-4 text-purple-400", children: "Error" }), _jsxs("div", { className: "text-gray-500 text-lg", children: ["Something went wrong loading this group.", _jsx("br", {}), "Please check your group data or try again."] })] }) }));
    }
};
export default GroupDetails;

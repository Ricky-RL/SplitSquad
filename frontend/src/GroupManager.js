import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import GroupDetails from './GroupDetails.js';
const GroupManager = ({ currentUser }) => {
    const [groups, setGroups] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [members, setMembers] = useState([]);
    const [memberInput, setMemberInput] = useState({ name: '', email: '', phone: '' });
    const [error, setError] = useState('');
    const [memberError, setMemberError] = useState('');
    const [selectedGroupIdx, setSelectedGroupIdx] = useState(null);
    useEffect(() => {
        async function fetchGroups() {
            try {
                const res = await fetch(`/api/groups?userId=${currentUser.email}`);
                if (res.ok) {
                    const data = await res.json();
                    setGroups(data);
                }
            }
            catch (err) {
                // Optionally handle error
            }
        }
        fetchGroups();
    }, [currentUser.email]);
    const openModal = () => {
        setShowModal(true);
        setGroupName('');
        setMembers([]);
        setMemberInput({ name: '', email: '', phone: '' });
        setError('');
        setMemberError('');
    };
    const closeModal = () => {
        setShowModal(false);
    };
    const handleAddMember = (e) => {
        e.preventDefault();
        const name = memberInput.name.trim();
        const email = memberInput.email.trim();
        const phone = memberInput.phone.trim();
        if (!name || !email) {
            setMemberError('Name and email are required.');
            return;
        }
        if (members.some(m => m.email === email) || email === currentUser.email) {
            setMemberError('A member with this email already exists.');
            return;
        }
        setMembers([...members, { name, email, phone: phone || undefined }]);
        setMemberInput({ name: '', email: '', phone: '' });
        setMemberError('');
    };
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) {
            setError('Group name cannot be empty.');
            return;
        }
        if (groups.some(g => g.name === groupName.trim())) {
            setError('Group name already exists.');
            return;
        }
        // Always include the current user as a member
        const allMembers = [currentUser, ...members.filter(m => m.email !== currentUser.email)];
        if (allMembers.length === 0) {
            setError('Please add at least one member.');
            return;
        }
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.email, // use email as userId for now
                    name: groupName.trim(),
                    memberIds: allMembers.map(m => m.email),
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error || 'Failed to create group.');
                return;
            }
            const group = await res.json();
            setGroups([...groups, group]);
            setShowModal(false);
        }
        catch (err) {
            setError('Failed to create group.');
        }
    };
    // Remove old handleAddMemberToGroup and handleRemoveMemberFromGroup
    // Replace with new versions that use Member objects
    const handleAddMemberToGroup = (groupIdx, member) => {
        if (!member.name.trim() || !member.email.trim())
            return;
        setGroups(groups => groups.map((g, idx) => idx === groupIdx && !g.members.some(m => m.email === member.email)
            ? { ...g, members: [...g.members, member] }
            : g));
    };
    const handleRemoveMemberFromGroup = (groupIdx, email) => {
        setGroups(groups => groups.map((g, idx) => idx === groupIdx
            ? { ...g, members: g.members.filter(m => m.email !== email) }
            : g));
    };
    const [renamingIdx, setRenamingIdx] = useState(null);
    const [renameInput, setRenameInput] = useState('');
    const handleStartRename = (idx, currentName) => {
        setRenamingIdx(idx);
        setRenameInput(currentName);
    };
    const handleRenameGroup = (groupIdx, newName) => {
        setGroups(groups => groups.map((g, i) => i === groupIdx ? { ...g, name: newName } : g));
    };
    const handleDeleteGroup = (groupIdx) => {
        setGroups(groups => groups.filter((_, i) => i !== groupIdx));
        setSelectedGroupIdx(null);
    };
    // Update a group in the groups array
    const handleGroupUpdated = (updatedGroup) => {
        setGroups(groups => groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
    };
    return (_jsxs("div", { className: "w-full max-w-xl mx-auto mt-8", children: [_jsx("button", { onClick: openModal, className: "bg-blue-600 text-white rounded px-4 py-2 mb-6 hover:bg-blue-700 transition font-semibold shadow", children: "Create Group" }), _jsx("div", { className: "space-y-6 mt-6", children: _jsx("div", { children: groups.length === 0 ? (_jsx("div", { className: "text-gray-400 bg-white rounded-xl shadow p-6", children: "No groups created yet." })) : (groups.map((g, idx) => (_jsxs("div", { className: "bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-gray-100 cursor-pointer hover:shadow-lg transition items-center text-center", onClick: () => setSelectedGroupIdx(idx), children: [_jsx("div", { className: "text-xl font-bold text-blue-700 mb-2", children: g.name }), _jsx("div", { className: "text-gray-700 font-medium mb-1", children: "Members:" }), _jsxs("ul", { className: "flex flex-col gap-1 items-center w-full", children: [g.members.map((m, i) => (_jsxs("li", { className: "text-gray-700 text-sm", children: [_jsxs("span", { className: m.email === currentUser.email ? 'font-bold text-purple-700' : '', children: [m.email === currentUser.email ? 'You' : m.name, " (", m.email, m.phone ? `, ${m.phone}` : '', ")"] }), (m.etransferEmail || m.etransferPhone) && (_jsxs("div", { className: "text-xs text-gray-500 mt-0.5", children: [m.etransferEmail && _jsxs("span", { children: ["E-transfer: ", m.etransferEmail] }), m.etransferEmail && m.etransferPhone && _jsx("span", { children: " | " }), m.etransferPhone && _jsxs("span", { children: ["Phone: ", m.etransferPhone] })] }))] }, i))), g.pendingMembers && g.pendingMembers.length > 0 && (_jsx("li", { className: "text-xs text-gray-500 mt-2", children: "Invited (pending):" })), g.pendingMembers && g.pendingMembers.map((pm, i) => (_jsx("li", { className: "text-sm text-gray-400 italic", children: _jsx("span", { className: "font-medium", children: pm.name ? `${pm.name} (${pm.email})` : pm.email }) }, "pending-" + i)))] })] }, idx)))) }) }), selectedGroupIdx !== null && groups[selectedGroupIdx] && (_jsx(GroupDetails, { group: groups[selectedGroupIdx], groupId: groups[selectedGroupIdx].id, groupIdx: selectedGroupIdx, userId: currentUser.id, onClose: () => setSelectedGroupIdx(null), onRenameGroup: handleRenameGroup, onDeleteGroup: handleDeleteGroup, onAddMemberToGroup: handleAddMemberToGroup, onRemoveMemberFromGroup: handleRemoveMemberFromGroup, onGroupUpdated: handleGroupUpdated })), showModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm", children: _jsxs("div", { className: "rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeInUp bg-white", children: [_jsx("button", { onClick: closeModal, className: "absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold", "aria-label": "Close", children: "\u00D7" }), _jsxs("form", { onSubmit: handleCreateGroup, className: "flex flex-col gap-4", children: [_jsx("h3", { className: "text-2xl font-bold mb-2 text-blue-700", children: "Create Group" }), _jsx("input", { type: "text", value: groupName, onChange: e => setGroupName(e.target.value), className: "border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900", placeholder: "Enter group name", autoFocus: true }), error && _jsx("div", { className: "text-red-500 text-sm", children: error }), _jsx("form", { onSubmit: handleAddMember, className: "flex flex-col gap-2 mb-2 w-full", children: _jsxs("div", { className: "flex flex-wrap gap-2 w-full", children: [_jsx("input", { type: "text", value: memberInput.name, onChange: e => setMemberInput({ ...memberInput, name: e.target.value }), className: "border border-gray-300 rounded px-2 py-1 min-w-0 flex-1 bg-white text-gray-900", placeholder: "Name (required)" }), _jsx("input", { type: "email", value: memberInput.email, onChange: e => setMemberInput({ ...memberInput, email: e.target.value }), className: "border border-gray-300 rounded px-2 py-1 min-w-0 flex-1 bg-white text-gray-900", placeholder: "Email (required)" }), _jsx("input", { type: "tel", value: memberInput.phone, onChange: e => setMemberInput({ ...memberInput, phone: e.target.value }), className: "border border-gray-300 rounded px-2 py-1 min-w-0 flex-1 bg-white text-gray-900", placeholder: "Phone (optional)" }), _jsx("button", { onClick: handleAddMember, className: "bg-green-600 text-white rounded px-4 py-1 h-10 hover:bg-green-700 transition font-semibold", type: "button", children: "Add" })] }) }), memberError && _jsx("div", { className: "text-red-500 text-sm mb-1", children: memberError }), _jsx("span", { className: "font-medium text-gray-900", children: "Members:" }), _jsxs("ul", { className: "flex flex-col gap-2 ml-0 mt-1", children: [_jsxs("li", { className: "flex items-center gap-3 bg-gray-100 rounded px-3 py-2 min-h-[40px]", children: [_jsx("span", { className: "font-semibold text-gray-900", children: currentUser.name }), _jsxs("span", { className: "text-gray-500 text-xs ml-1", children: ["(", currentUser.email, ")"] }), _jsx("span", { className: "ml-auto flex items-center justify-center px-2 py-0.5 min-w-[64px] h-7 bg-purple-200 text-purple-700 rounded text-xs font-bold text-center", children: "You" })] }), members.filter(m => m.email !== currentUser.email).length === 0 ? (_jsx("li", { className: "text-gray-400 px-3 py-2", children: "No other members yet." })) : (members.filter(m => m.email !== currentUser.email).map((m, i) => (_jsxs("li", { className: "flex items-center gap-3 bg-gray-100 rounded px-3 py-2 min-h-[40px]", children: [_jsx("span", { className: "font-semibold text-gray-900", children: m.name }), _jsxs("span", { className: "text-gray-500 text-xs ml-1", children: ["(", m.email, m.phone ? `, ${m.phone}` : '', ")"] }), _jsx("button", { type: "button", className: "ml-auto flex items-center justify-center px-2 py-0.5 min-w-[64px] h-7 bg-red-500 text-white rounded text-xs font-semibold text-center hover:bg-red-600", onClick: () => setMembers(members => members.filter(mem => mem.email !== m.email)), "aria-label": `Remove ${m.name}`, children: "Remove" })] }, i + 1))))] }), _jsx("button", { type: "submit", className: "bg-blue-600 text-white rounded px-4 py-2 mt-2 hover:bg-blue-700 transition font-semibold shadow", children: "Save Group" })] })] }) }))] }));
};
export default GroupManager;

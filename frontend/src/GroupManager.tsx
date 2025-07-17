import React, { useState } from 'react';
import GroupDetails from './GroupDetails';

interface Member {
  name: string;
  email: string;
  phone?: string;
}
interface Group {
  name: string;
  members: Member[];
}

interface GroupManagerProps {
  currentUser: { name: string; email: string };
}

const GroupManager: React.FC<GroupManagerProps> = ({ currentUser }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [memberInput, setMemberInput] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [memberError, setMemberError] = useState('');
  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number | null>(null);

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

  const handleAddMember = (e: React.FormEvent) => {
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

  const handleCreateGroup = (e: React.FormEvent) => {
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
    setGroups([...groups, { name: groupName.trim(), members: allMembers }]);
    setShowModal(false);
  };

  // Remove old handleAddMemberToGroup and handleRemoveMemberFromGroup
  // Replace with new versions that use Member objects
  const handleAddMemberToGroup = (groupIdx: number, member: Member) => {
    if (!member.name.trim() || !member.email.trim()) return;
    setGroups(groups => groups.map((g, idx) =>
      idx === groupIdx && !g.members.some(m => m.email === member.email)
        ? { ...g, members: [...g.members, member] }
        : g
    ));
  };

  const handleRemoveMemberFromGroup = (groupIdx: number, email: string) => {
    setGroups(groups => groups.map((g, idx) =>
      idx === groupIdx
        ? { ...g, members: g.members.filter(m => m.email !== email) }
        : g
    ));
  };

  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const handleStartRename = (idx: number, currentName: string) => {
    setRenamingIdx(idx);
    setRenameInput(currentName);
  };
  const handleRenameGroup = (groupIdx: number, newName: string) => {
    setGroups(groups => groups.map((g, i) =>
      i === groupIdx ? { ...g, name: newName } : g
    ));
  };

  const handleDeleteGroup = (groupIdx: number) => {
    setGroups(groups => groups.filter((_, i) => i !== groupIdx));
    setSelectedGroupIdx(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      <button
        onClick={openModal}
        className="bg-blue-600 text-white rounded px-4 py-2 mb-6 hover:bg-blue-700 transition font-semibold shadow"
      >
        Create Group
      </button>
      <div className="space-y-6 mt-6">
        {groups.length === 0 ? (
          <div className="text-gray-400 bg-white rounded-xl shadow p-6">No groups created yet.</div>
        ) : (
          groups.map((g, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-gray-100 cursor-pointer hover:shadow-lg transition"
              onClick={() => setSelectedGroupIdx(idx)}
            >
              <div className="text-xl font-bold text-blue-700 mb-2">{g.name}</div>
              <div className="text-gray-700 font-medium mb-1">Members:</div>
              <ul className="ml-0 flex flex-col gap-1 items-start">
                {g.members.map((m, i) => (
                  <li key={i} className="text-gray-700 text-sm pl-1">
                    <span className={m.email === currentUser.email ? 'font-bold text-purple-700' : ''}>
                      {m.email === currentUser.email ? 'You' : m.name} ({m.email}{m.phone ? `, ${m.phone}` : ''})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      {/* Group Details Overlay */}
      {selectedGroupIdx !== null && groups[selectedGroupIdx] && (
        <GroupDetails
          group={groups[selectedGroupIdx]}
          groupIdx={selectedGroupIdx}
          onClose={() => setSelectedGroupIdx(null)}
          onRenameGroup={handleRenameGroup}
          onDeleteGroup={handleDeleteGroup}
          onAddMemberToGroup={handleAddMemberToGroup}
          onRemoveMemberFromGroup={handleRemoveMemberFromGroup}
        />
      )}
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeInUp bg-white">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>
            <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
              <h3 className="text-2xl font-bold mb-2 text-blue-700">Create Group</h3>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                placeholder="Enter group name"
                autoFocus
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <form onSubmit={handleAddMember} className="flex flex-col gap-2 mb-2 w-full">
                <div className="flex flex-wrap gap-2 w-full">
                  <input
                    type="text"
                    value={memberInput.name}
                    onChange={e => setMemberInput({ ...memberInput, name: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1 min-w-0 flex-1 bg-white text-gray-900"
                    placeholder="Name (required)"
                  />
                  <input
                    type="email"
                    value={memberInput.email}
                    onChange={e => setMemberInput({ ...memberInput, email: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1 min-w-0 flex-1 bg-white text-gray-900"
                    placeholder="Email (required)"
                  />
                  <input
                    type="tel"
                    value={memberInput.phone}
                    onChange={e => setMemberInput({ ...memberInput, phone: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1 min-w-0 flex-1 bg-white text-gray-900"
                    placeholder="Phone (optional)"
                  />
                  <button
                    onClick={handleAddMember}
                    className="bg-green-600 text-white rounded px-4 py-1 h-10 hover:bg-green-700 transition font-semibold"
                    type="button"
                  >
                    Add
                  </button>
                </div>
              </form>
              {memberError && <div className="text-red-500 text-sm mb-1">{memberError}</div>}
              <span className="font-medium text-gray-900">Members:</span>
              <ul className="flex flex-col gap-2 ml-0 mt-1">
                <li className="flex items-center gap-3 bg-gray-100 rounded px-3 py-2 min-h-[40px]">
                  <span className="font-semibold text-gray-900">{currentUser.name}</span>
                  <span className="text-gray-500 text-xs ml-1">({currentUser.email})</span>
                  <span className="ml-auto flex items-center justify-center px-2 py-0.5 min-w-[64px] h-7 bg-purple-200 text-purple-700 rounded text-xs font-bold text-center">You</span>
                </li>
                {members.filter(m => m.email !== currentUser.email).length === 0 ? (
                  <li className="text-gray-400 px-3 py-2">No other members yet.</li>
                ) : (
                  members.filter(m => m.email !== currentUser.email).map((m, i) => (
                    <li key={i + 1} className="flex items-center gap-3 bg-gray-100 rounded px-3 py-2 min-h-[40px]">
                      <span className="font-semibold text-gray-900">{m.name}</span>
                      <span className="text-gray-500 text-xs ml-1">({m.email}{m.phone ? `, ${m.phone}` : ''})</span>
                      <button
                        type="button"
                        className="ml-auto flex items-center justify-center px-2 py-0.5 min-w-[64px] h-7 bg-red-500 text-white rounded text-xs font-semibold text-center hover:bg-red-600"
                        onClick={() => setMembers(members => members.filter(mem => mem.email !== m.email))}
                        aria-label={`Remove ${m.name}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <button
                type="submit"
                className="bg-blue-600 text-white rounded px-4 py-2 mt-2 hover:bg-blue-700 transition font-semibold shadow"
              >
                Save Group
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManager; 
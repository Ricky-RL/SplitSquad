import React, { useState } from 'react';

const GroupManager: React.FC = () => {
  const [groups, setGroups] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  const openModal = () => {
    setShowModal(true);
    setGroupName('');
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Group name cannot be empty.');
      return;
    }
    if (groups.includes(groupName.trim())) {
      setError('Group name already exists.');
      return;
    }
    setGroups([...groups, groupName.trim()]);
    setShowModal(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      <button
        onClick={openModal}
        className="bg-blue-600 text-white rounded px-4 py-2 mb-6 hover:bg-blue-700 transition font-semibold shadow"
      >
        Create Group
      </button>
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-700">Your Groups</h2>
        {groups.length === 0 ? (
          <div className="text-gray-400">No groups created yet.</div>
        ) : (
          <ul className="space-y-2">
            {groups.map((g, idx) => (
              <li key={idx} className="text-gray-700 font-medium border-b pb-2 last:border-b-0 last:pb-0">{g}</li>
            ))}
          </ul>
        )}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeInUp">
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
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter group name"
                autoFocus
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
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
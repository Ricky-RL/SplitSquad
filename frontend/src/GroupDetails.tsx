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

  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'BALANCES'>('BALANCES');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg relative animate-fadeInUp">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">{group.name}</h2>
        {/* Tabs */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            className={`px-4 py-2 font-semibold focus:outline-none transition-colors duration-150 ${activeTab === 'EXPENSES' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-400'}`}
            onClick={() => setActiveTab('EXPENSES')}
          >
            EXPENSES
          </button>
          <button
            className={`ml-4 px-4 py-2 font-semibold focus:outline-none transition-colors duration-150 ${activeTab === 'BALANCES' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-400'}`}
            onClick={() => setActiveTab('BALANCES')}
          >
            BALANCES
          </button>
        </div>
        {/* Tab Content */}
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
              <div className="bg-gray-50 rounded-lg p-4 text-gray-500 text-sm">
                (Breakdown coming soon)
              </div>
            </div>
          </div>
        )}
        {activeTab === 'EXPENSES' && (
          <div className="text-gray-500 text-center py-8">Expenses tab coming soon...</div>
        )}
      </div>
    </div>
  );
};

export default GroupDetails; 
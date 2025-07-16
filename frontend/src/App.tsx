import React from 'react';
import GroupManager from './GroupManager';

function App() {
  return (
    <div className="fixed inset-0 min-h-screen min-w-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
      <div className="w-full max-w-2xl px-2 py-8 flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-purple-400 mb-4 underline text-center">SplitSquad</h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-8 text-center max-w-2xl">
          Easily split expenses with friends and groups.
        </p>
        <div className="w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-6 mb-6">
          <div className="text-center text-gray-500 text-base sm:text-lg">
            Welcome! Start by creating a group or adding an expense.
          </div>
        </div>
        <GroupManager />
      </div>
    </div>
  );
}

export default App;

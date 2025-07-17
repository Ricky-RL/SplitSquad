import './App.css';
import SignIn from './SignIn';
import { useSupabaseUser } from './useSupabaseUser';
import { supabase } from './supabaseClient';
import GroupManager from './GroupManager';
import { useEffect } from 'react';

function App() {
  const user = useSupabaseUser();

  useEffect(() => {
    if (user) {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
        }),
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) {
    return <SignIn />;
  }

  return (
    <div className="fixed inset-0 min-h-screen min-w-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
      <button
        onClick={handleSignOut}
        style={{ position: 'absolute', top: 24, right: 32, padding: '10px 20px', fontSize: 16, borderRadius: 6, background: '#e0e7ff', color: '#7c3aed', border: 'none' }}
      >
        Sign out
      </button>
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
        <GroupManager currentUser={{ name: user.user_metadata?.full_name || user.email, email: user.email }} />
      </div>
    </div>
  );
}

export default App;

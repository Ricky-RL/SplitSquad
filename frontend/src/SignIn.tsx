import React, { useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function SignIn() {
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/',
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }}>
      <h2>Sign in to SplitSquad</h2>
      <button style={{ padding: '12px 24px', fontSize: 18, borderRadius: 6, background: '#7c3aed', color: 'white', border: 'none', marginTop: 24 }} onClick={handleSignIn}>
        Sign in with Google
      </button>
      {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { useSupabaseUser } from './useSupabaseUser.js';
import { getApiUrl } from './utils.js';

const InvitePage: React.FC = () => {
  const user = useSupabaseUser();
  const [status, setStatus] = useState<'idle' | 'joining' | 'joined' | 'error' | 'notfound'>('idle');
  const [error, setError] = useState('');
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('groupId');
  const token = params.get('token');

  // If not signed in, redirect to sign in and preserve invite URL
  useEffect(() => {
    if (!groupId || !token) {
      setStatus('notfound');
      return;
    }
    if (!user) {
      // Redirect to sign in, then back to this invite URL
      const redirectUrl = window.location.pathname + window.location.search;
      window.location.href = `/signin?redirectTo=${encodeURIComponent(redirectUrl)}`;
      return;
    }
    setStatus('joining');
    fetch(getApiUrl(`/api/groups/${groupId}/join`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, name: user.user_metadata?.full_name || user.email, token }),
    })
      .then(res => {
        if (res.ok) {
          setStatus('joined');
          // Force a reload to ensure all group data is fresh
          setTimeout(() => {
            window.location.href = `/`;
          }, 1500);
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [user, groupId, token]);

  if (!groupId || !token || status === 'notfound') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">Invalid or missing invite link.</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-purple-500">Redirecting to sign in...</div>;
  }
  if (status === 'joining') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Joining group...</div>;
  }
  if (status === 'joined') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-green-600">You have joined the group! Redirecting...</div>;
  }
  if (status === 'error') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">Failed to join the group. Please try again later.</div>;
  }
  return null;
};

export default InvitePage; 
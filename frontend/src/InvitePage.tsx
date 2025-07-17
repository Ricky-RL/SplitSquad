import React, { useEffect, useState } from 'react';
import { useSupabaseUser } from './useSupabaseUser.js';
import { getApiUrl } from './utils.js';

const InvitePage: React.FC = () => {
  const user = useSupabaseUser();
  const [status, setStatus] = useState<'idle' | 'joining' | 'joined' | 'error' | 'notfound'>('idle');
  const [error, setError] = useState('');
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('groupId');

  useEffect(() => {
    if (!groupId) {
      setStatus('notfound');
      return;
    }
    if (!user) return;
    setStatus('joining');
    // TODO: Call backend to join group
    // For now, just simulate success
    setTimeout(() => {
      setStatus('joined');
    }, 1000);
    // Example for real backend call:
    // fetch(getApiUrl(`/api/groups/${groupId}/join`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email }) })
    //   .then(res => res.ok ? setStatus('joined') : setStatus('error'))
    //   .catch(() => setStatus('error'));
  }, [user, groupId]);

  if (!groupId || status === 'notfound') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">Invalid or missing invite link.</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-purple-500">Please sign in to accept your invite.</div>;
  }
  if (status === 'joining') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Joining group...</div>;
  }
  if (status === 'joined') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-green-600">You have joined the group!</div>;
  }
  if (status === 'error') {
    return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">Failed to join the group. Please try again later.</div>;
  }
  return null;
};

export default InvitePage; 
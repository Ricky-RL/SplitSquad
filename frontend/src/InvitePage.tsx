import React, { useEffect, useState } from 'react';
import { useSupabaseUser } from './useSupabaseUser.js';
import { getApiUrl } from './utils.js';
import { useNavigate } from 'react-router-dom';

const InvitePage: React.FC = () => {
  const { user, loading } = useSupabaseUser();
  const [status, setStatus] = useState<'idle' | 'joining' | 'joined' | 'error' | 'notfound'>('idle');
  const [error, setError] = useState('');
  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('groupId');
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId) {
      setStatus('notfound');
      return;
    }
    if (loading) return;
    if (!user) return;
    setStatus('joining');
    // Upsert user to ensure pending invites are converted
    fetch(getApiUrl('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email
      }),
    })
      .then(res => {
        if (res.ok) setStatus('joined');
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [user, loading, groupId]);

  useEffect(() => {
    if (status === 'joined') {
      const timeout = setTimeout(() => {
        navigate('/');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [status, navigate]);

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
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
export function useSupabaseUser() {
    const [user, setUser] = useState(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => listener?.subscription.unsubscribe();
    }, []);
    return user;
}

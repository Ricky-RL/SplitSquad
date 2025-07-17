import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { supabase } from './supabaseClient.js';
export default function SignIn() {
    const [error, setError] = useState(null);
    const handleSignIn = async () => {
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/',
            },
        });
        if (error)
            setError(error.message);
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 80 }, children: [_jsx("h2", { children: "Sign in to SplitSquad" }), _jsx("button", { style: { padding: '12px 24px', fontSize: 18, borderRadius: 6, background: '#7c3aed', color: 'white', border: 'none', marginTop: 24 }, onClick: handleSignIn, children: "Sign in with Google" }), error && _jsx("div", { style: { color: 'red', marginTop: 16 }, children: error })] }));
}

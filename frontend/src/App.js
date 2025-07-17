import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import './App.css';
import SignIn from './SignIn.js';
import { useSupabaseUser } from './useSupabaseUser.js';
import { supabase } from './supabaseClient.js';
import GroupManager from './GroupManager.js';
import { useEffect, useState } from 'react';
function App() {
    const user = useSupabaseUser();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [etransferEmail, setEtransferEmail] = useState('');
    const [etransferPhone, setEtransferPhone] = useState('');
    const [onboardingLoading, setOnboardingLoading] = useState(false);
    const [onboardingError, setOnboardingError] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [settingsEmail, setSettingsEmail] = useState('');
    const [settingsPhone, setSettingsPhone] = useState('');
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsError, setSettingsError] = useState('');
    useEffect(() => {
        if (user) {
            // Fetch user from backend to check for etransfer info
            fetch(`/api/users/${user.id}`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                if (!data || (!data.etransferEmail && !data.etransferPhone)) {
                    setShowOnboarding(true);
                }
                else {
                    setShowOnboarding(false);
                    setSettingsEmail(data.etransferEmail || '');
                    setSettingsPhone(data.etransferPhone || '');
                }
            });
            // Upsert user as before
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
    const handleOnboardingSubmit = async (e) => {
        e.preventDefault();
        setOnboardingLoading(true);
        setOnboardingError('');
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email,
                    etransferEmail: etransferEmail || undefined,
                    etransferPhone: etransferPhone || undefined,
                }),
            });
            if (!res.ok)
                throw new Error('Failed to save info');
            setShowOnboarding(false);
            setSettingsEmail(etransferEmail);
            setSettingsPhone(etransferPhone);
        }
        catch (err) {
            setOnboardingError('Failed to save info.');
        }
        finally {
            setOnboardingLoading(false);
        }
    };
    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setSettingsLoading(true);
        setSettingsError('');
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email,
                    etransferEmail: settingsEmail || undefined,
                    etransferPhone: settingsPhone || undefined,
                }),
            });
            if (!res.ok)
                throw new Error('Failed to save info');
            setShowSettings(false);
        }
        catch (err) {
            setSettingsError('Failed to save info.');
        }
        finally {
            setSettingsLoading(false);
        }
    };
    if (!user) {
        return _jsx(SignIn, {});
    }
    if (showOnboarding) {
        return (_jsx("div", { className: "min-h-screen w-full bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col items-center justify-center", children: _jsxs("form", { onSubmit: handleOnboardingSubmit, className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4 items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-purple-500 mb-2", children: "Welcome to SplitSquad!" }), _jsx("p", { className: "text-gray-700 mb-4 text-center", children: "Optionally provide your e-transfer email or phone number for group payments. You can skip this for now." }), _jsx("input", { type: "email", value: etransferEmail, onChange: e => setEtransferEmail(e.target.value), className: "border border-gray-300 rounded px-3 py-2 w-full", placeholder: "E-transfer email (optional)" }), _jsx("input", { type: "tel", value: etransferPhone, onChange: e => setEtransferPhone(e.target.value), className: "border border-gray-300 rounded px-3 py-2 w-full", placeholder: "E-transfer phone (optional)" }), onboardingError && _jsx("div", { className: "text-red-500 text-sm", children: onboardingError }), _jsxs("div", { className: "flex gap-2 w-full mt-2", children: [_jsx("button", { type: "submit", className: "flex-1 bg-purple-500 text-white rounded px-4 py-2 hover:bg-purple-600 transition font-semibold shadow", disabled: onboardingLoading, children: "Save & Continue" }), _jsx("button", { type: "button", className: "flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow", onClick: () => setShowOnboarding(false), disabled: onboardingLoading, children: "Skip" })] })] }) }));
    }
    // Settings modal
    if (showSettings) {
        return (_jsx("div", { className: "min-h-screen w-full bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col items-center justify-center", children: _jsxs("form", { onSubmit: handleSettingsSubmit, className: "bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-4 items-center", children: [_jsx("h2", { className: "text-2xl font-bold text-purple-500 mb-2", children: "User Settings" }), _jsx("p", { className: "text-gray-700 mb-4 text-center", children: "Update your e-transfer email or phone number for group payments." }), _jsx("input", { type: "email", value: settingsEmail, onChange: e => setSettingsEmail(e.target.value), className: "border border-gray-300 rounded px-3 py-2 w-full", placeholder: "E-transfer email (optional)" }), _jsx("input", { type: "tel", value: settingsPhone, onChange: e => setSettingsPhone(e.target.value), className: "border border-gray-300 rounded px-3 py-2 w-full", placeholder: "E-transfer phone (optional)" }), settingsError && _jsx("div", { className: "text-red-500 text-sm", children: settingsError }), _jsxs("div", { className: "flex gap-2 w-full mt-2", children: [_jsx("button", { type: "submit", className: "flex-1 bg-purple-500 text-white rounded px-4 py-2 hover:bg-purple-600 transition font-semibold shadow", disabled: settingsLoading, children: "Save" }), _jsx("button", { type: "button", className: "flex-1 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300 transition font-semibold shadow", onClick: () => setShowSettings(false), disabled: settingsLoading, children: "Cancel" })] })] }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("style", { children: `html, body { overflow-x: hidden !important; }` }), _jsxs("div", { className: "min-h-screen w-full bg-gradient-to-br from-purple-50 to-purple-100 flex flex-col items-center", children: [_jsxs("div", { style: { position: 'absolute', top: 24, right: 32, display: 'flex', gap: 12 }, children: [_jsx("button", { onClick: () => setShowSettings(true), className: "p-2 rounded-full hover:bg-purple-100 text-purple-600 focus:outline-none", title: "User Settings", style: { background: 'white', border: 'none', marginRight: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.4 15a1.65 1.65 0 01.33 1.82l-.06.1a2 2 0 01-2.18 1.09 8.12 8.12 0 01-2.18-.9 8.12 8.12 0 01-2.18.9 2 2 0 01-2.18-1.09l-.06-.1A1.65 1.65 0 014.6 15a2 2 0 01-.33-1.82l.06-.1a8.12 8.12 0 01.9-2.18 8.12 8.12 0 01-.9-2.18A2 2 0 014.6 9a1.65 1.65 0 01.33-1.82l.06-.1A2 2 0 017.17 6a8.12 8.12 0 012.18.9 8.12 8.12 0 012.18-.9A2 2 0 0114.83 6a1.65 1.65 0 011.82.33l.1.06a2 2 0 011.09 2.18 8.12 8.12 0 01.9 2.18 8.12 8.12 0 01.9 2.18 2 2 0 01-1.09 2.18z" })] }) }), _jsx("button", { onClick: handleSignOut, style: { padding: '10px 20px', fontSize: 16, borderRadius: 6, background: '#e0e7ff', color: '#7c3aed', border: 'none' }, children: "Sign out" })] }), _jsxs("div", { className: "w-full px-0 py-0 flex flex-col", children: [_jsx("h1", { className: "text-4xl sm:text-5xl font-bold text-purple-400 mb-4 underline text-center", children: "SplitSquad" }), _jsx("p", { className: "text-lg sm:text-xl text-gray-700 mb-8 text-center max-w-2xl", children: "Easily split expenses with friends and groups." }), _jsx("div", { className: "w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-6 mb-6", children: _jsx("div", { className: "text-center text-gray-500 text-base sm:text-lg", children: "Welcome! Start by creating a group or adding an expense." }) }), _jsx(GroupManager, { currentUser: { id: user.id, name: user.user_metadata?.full_name || user.email, email: user.email } })] })] })] }));
}
export default App;

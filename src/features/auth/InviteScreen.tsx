import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { redeemInvite } from '../../services/authService';

export const InviteScreen = ({ onLogin }) => {
    const [step, setStep] = useState('code'); // 'code' | 'register'
    const [inviteCode, setInviteCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCodeSubmit = (e) => {
        e.preventDefault();
        if (inviteCode.trim().length > 0) {
            setStep('register');
            setError('');
        } else {
            setError('INVITE CODE REQUIRED');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!username || !password) throw new Error('CREDENTIALS_MISSING');

            const user = await redeemInvite(inviteCode, username, password);
            if (onLogin) onLogin(user);

        } catch (err) {
            setError(err.message || 'REGISTRATION_FAILED');
            // If invite code was invalid, maybe go back?
            if (err.message === 'Invalid or used invite code.') {
                setStep('code');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-parchment text-ink font-mono p-4 selection:bg-klein selection:text-white">
            <div className="w-full max-w-md border border-ink p-8">
                <h1 className="text-xl font-bold mb-8 uppercase tracking-widest text-center border-b border-ink pb-4">
                    RE:lay Protocol
                </h1>

                <AnimatePresence mode="wait">
                    {step === 'code' ? (
                        <motion.form
                            key="code-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleCodeSubmit}
                            className="space-y-6"
                        >
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-bold uppercase">Initialize Protocol &gt; Invite Code:</label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="bg-transparent border-b border-ink focus:outline-none focus:border-klein py-2 text-lg w-full rounded-none"
                                    placeholder="ENTER_CODE"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full border border-ink py-3 hover:bg-ink hover:text-parchment transition-colors uppercase font-bold text-sm tracking-wider"
                            >
                                Start Handshake
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="register-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleRegister}
                            className="space-y-6"
                        >
                            <div className="text-xs mb-4 text-ink/60">
                                [ CODE: {inviteCode} VERIFIED ]
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-bold uppercase">Identity &gt; Username:</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-transparent border-b border-ink focus:outline-none focus:border-klein py-2 w-full rounded-none"
                                    placeholder="ALIAS"
                                    autoFocus
                                />
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-bold uppercase">Secure Key &gt; Password:</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-transparent border-b border-ink focus:outline-none focus:border-klein py-2 w-full rounded-none"
                                    placeholder="PASSPHRASE"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep('code')}
                                    className="flex-1 text-xs border border-transparent hover:underline opacity-60"
                                >
                                    &lt; Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-2 w-full border border-ink py-3 hover:bg-ink hover:text-parchment transition-colors uppercase font-bold text-sm tracking-wider disabled:opacity-50"
                                >
                                    {loading ? 'INITIALIZING...' : 'Establish Connection'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 text-klein text-xs uppercase font-bold border-t border-klein pt-2"
                    >
                        ERROR: {error}
                    </motion.div>
                )}
            </div>

            <div className="fixed bottom-4 text-[10px] opacity-40">
                TERMINAL SCRIPTORIUM v0.1.0
            </div>
        </div>
    );
};



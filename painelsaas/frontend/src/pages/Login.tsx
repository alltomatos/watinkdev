import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, LayoutDashboard } from 'lucide-react';
import { API_URL } from '../lib/api';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log(`Attempting login to ${API_URL}/auth/login`);
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            } else {
                alert(`Login failed: ${data.error || response.statusText}`);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">


            <div className="w-full max-w-md z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                    <div className="flex justify-center mb-8">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <LayoutDashboard className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Welcome Back
                    </h2>
                    <p className="text-slate-400 text-center mb-8 text-sm">
                        Sign in to your orchestration panel
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                    placeholder="admin@watink.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-secondary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        Protected by Cloudflare &bull; End-to-end Encrypted
                    </div>
                </div>
            </div>
        </div>
    );
}

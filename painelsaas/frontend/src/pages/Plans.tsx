import React, { useEffect, useState } from 'react';
import { Plus, CreditCard, Check, Users, Network, Zap, X } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Plan {
    id: string;
    name: string;
    price: number;
    max_users: number;
    max_connections: number;
}

export default function Plans() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', price: 0, max_users: 10, max_connections: 5 });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await apiFetch('/plans');
            if (res.ok) {
                setPlans(await res.json() || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await apiFetch('/plans', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ name: '', price: 0, max_users: 10, max_connections: 5 });
                fetchPlans();
            } else {
                alert('Error creating plan');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">SaaS Plans</h1>
                    <p className="text-slate-400 text-sm">Define pricing tiers and limits for your customers.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Create Tier
                </button>
            </div>

            {/* Grid of Plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-900/50 rounded-2xl animate-pulse"></div>
                    ))
                ) : plans.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No plans defined yet.</p>
                    </div>
                ) : (
                    plans.map(plan => (
                        <div key={plan.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden hover:border-slate-700 transition-colors group">
                            {/* Decor */}
                            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                                <Zap className="w-24 h-24 text-white" />
                            </div>

                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                <div className="flex items-baseline mt-2">
                                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                                    <span className="text-slate-500 text-sm ml-1">/mo</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Users className="w-4 h-4 text-emerald-400" />
                                    <span>Up to <b>{plan.max_users}</b> Users</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Network className="w-4 h-4 text-blue-400" />
                                    <span><b>{plan.max_connections}</b> WhatsApp Conns</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <Check className="w-4 h-4 text-slate-500" />
                                    <span>Basic Support</span>
                                </div>
                            </div>

                            <button className="w-full py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">
                                Edit Configuration
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 rounded-t-2xl">
                            <h2 className="text-lg font-bold text-white">New Pricing Tier</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 block mb-1">Plan Name</label>
                                <input autoFocus type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-premium w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500" placeholder="e.g. Gold" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 block mb-1">Monthly Price ($)</label>
                                <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="input-premium w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500" placeholder="0.00" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 block mb-1">Max Users</label>
                                    <input type="number" required value={formData.max_users} onChange={e => setFormData({ ...formData, max_users: parseInt(e.target.value) })} className="input-premium w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-300 block mb-1">Max Conn</label>
                                    <input type="number" required value={formData.max_connections} onChange={e => setFormData({ ...formData, max_connections: parseInt(e.target.value) })} className="input-premium w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full mt-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/20 disabled:opacity-50"
                            >
                                {submitting ? 'Creating...' : 'Create Plan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

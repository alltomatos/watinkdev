import React, { useEffect, useState } from 'react';
import { Plus, Server, X, Activity, Users, Network, Building, Trash2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Instance {
    id: string;
    name: string;
    endpoint_url: string;
    status: string;
    created_at: string;
}

interface InstanceStats {
    users: number;
    tenants: {
        total: number;
        active: number;
        inactive: number;
    };
    connections: {
        connected: number;
        total: number;
    }
}

export default function Instances() {
    const [instances, setInstances] = useState<Instance[]>([]);
    // const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', endpoint_url: '', api_key: '', jwt_secret: '' });
    const [submitting, setSubmitting] = useState(false);
    const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);
    const [stats, setStats] = useState<InstanceStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        fetchInstances();
    }, []);

    const fetchInstances = async () => {
        try {
            const res = await apiFetch('/instances');
            if (res.ok) {
                setInstances(await res.json() || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            // setLoading(false); 
        }
    };

    const loadStats = async (instance: Instance) => {
        setSelectedInstance(instance);
        setLoadingStats(true);
        setStats(null);
        try {
            const res = await apiFetch(`/instances/${instance.id}/stats`);
            if (res.ok) {
                setStats(await res.json());
            } else {
                // alert("Failed to fetch stats from instance");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStats(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await apiFetch('/instances', { method: 'POST', body: JSON.stringify(formData) });
            if (res.ok) {
                setShowModal(false);
                setFormData({ name: '', endpoint_url: '', api_key: '', jwt_secret: '' });
                fetchInstances();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`Failed to connect instance: ${errData.error || res.statusText}`);
            }
        } catch (error) {
            console.error(error);
            alert("Network error: Failed to reach backend.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this instance?")) return;

        try {
            const res = await apiFetch(`/instances/${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (selectedInstance?.id === id) setSelectedInstance(null);
                fetchInstances();
            } else {
                alert("Failed to delete instance");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Instances</h1>
                <button onClick={() => setShowModal(true)} className="flex gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-blue-500 transition-all">
                    <Plus className="w-5 h-5" /> Connect
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="font-semibold text-slate-300">Connected Nodes</h3>
                    </div>
                    <div className="divide-y divide-slate-800">
                        {instances.map(inst => (
                            <div
                                key={inst.id}
                                onClick={() => loadStats(inst)}
                                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors ${selectedInstance?.id === inst.id ? 'bg-slate-800/80 border-l-4 border-blue-500' : ''}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${inst.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                        <Server className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{inst.name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{inst.endpoint_url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${inst.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                    <button 
                                        onClick={(e) => handleDelete(e, inst.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                        title="Delete Instance"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
                    {!selectedInstance ? (
                        <div className="text-slate-500">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Select an instance to view live telemetry.</p>
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                                <div className="text-left">
                                    <h2 className="text-xl font-bold text-white">{selectedInstance.name}</h2>
                                    <div className="flex items-center gap-2 text-emerald-400 text-sm mt-1">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        Live Connection
                                    </div>
                                </div>
                                <button onClick={() => setSelectedInstance(null)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>

                            {loadingStats ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                    <p className="text-slate-400 animate-pulse text-sm">Fetching telemetry...</p>
                                </div>
                            ) : stats ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Users Card */}
                                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <span className="text-slate-300 font-medium">Total Users</span>
                                        </div>
                                        <span className="text-2xl font-bold text-white">{stats.users}</span>
                                    </div>

                                    {/* Connections Card */}
                                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                                                <Network className="w-5 h-5" />
                                            </div>
                                            <span className="text-slate-300 font-medium">Active Connections</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-white block">{stats.connections.connected}</span>
                                            <span className="text-xs text-slate-500">of {stats.connections.total} registered</span>
                                        </div>
                                    </div>

                                    {/* Tenants Card */}
                                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
                                                <Building className="w-5 h-5" />
                                            </div>
                                            <span className="text-slate-300 font-medium">Tenants</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-white block">{stats.tenants.active}</span>
                                            <span className="text-xs text-slate-500">{stats.tenants.inactive} inactive</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-red-400">
                                    <p>Failed to load stats.</p>
                                    <p className="text-xs text-slate-500 mt-2">Check instance API Key & Version.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal - Create Instance */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">Connect New Instance</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white outline-none" placeholder="Display Name" />
                            <input type="url" required value={formData.endpoint_url} onChange={e => setFormData({ ...formData, endpoint_url: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white outline-none font-mono text-sm" placeholder="https://api.watink-instance.com" />
                            <input type="password" required value={formData.api_key} onChange={e => setFormData({ ...formData, api_key: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white outline-none font-mono text-sm" placeholder="Master API Key (Vault Encrypted)" />
                            <input type="password" required value={formData.jwt_secret} onChange={e => setFormData({ ...formData, jwt_secret: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white outline-none font-mono text-sm" placeholder="JWT Secret" />
                            <button type="submit" disabled={submitting} className="w-full py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50">{submitting ? 'Connecting...' : 'Connect Securely'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

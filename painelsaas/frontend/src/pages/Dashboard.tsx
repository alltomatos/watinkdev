import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

export default function Dashboard() {
    const [stats, setStats] = useState({ instances: 0, users: 0, mrr: 0 });
    const [versions, setVersions] = useState({ backend: '...', frontend: '0.1.6' }); // Frontend hardcoded for now or injected

    useEffect(() => {
        // Fetch Versions and Stats
        apiFetch('/health').then(res => res.json()).then(data => {
            setVersions(v => ({ ...v, backend: data.version }));
        }).catch(err => console.error("Failed to check health", err));

        // Mock stats or fetch real ones if endpoint exists
        setStats({ instances: 12, users: 1240, mrr: 4200 });
    }, []);

    return (
        <div>
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">System Telemetry & Health</p>
                </div>
                <div className="text-right text-xs text-slate-600 font-mono">
                    <p>Panel UI: v{versions.frontend}</p>
                    <p>Panel Core: v{versions.backend}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <div className="w-16 h-16 bg-blue-500 rounded-full blur-xl"></div>
                    </div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Instances</h3>
                    <p className="text-4xl font-bold text-white mt-2">{stats.instances}</p>
                    <div className="mt-4 flex items-center text-xs text-emerald-400">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                        All systems operational
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <div className="w-16 h-16 bg-purple-500 rounded-full blur-xl"></div>
                    </div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Users</h3>
                    <p className="text-4xl font-bold text-white mt-2">{stats.users.toLocaleString()}</p>
                    <p className="mt-4 text-xs text-slate-500">+12% from last month</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full blur-xl"></div>
                    </div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">MRR Estimate</h3>
                    <p className="text-4xl font-bold text-emerald-400 mt-2">${stats.mrr.toLocaleString()}</p>
                    <p className="mt-4 text-xs text-slate-500">Recurring revenue</p>
                </div>
            </div>
        </div>
    );
}

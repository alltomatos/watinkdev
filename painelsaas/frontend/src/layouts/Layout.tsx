import { ReactNode } from 'react';
import { LayoutDashboard, Settings, LogOut, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

export function Layout({ children }: { children: ReactNode }) {
    const { logout } = useAuth();

    return (
        <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
            {/* Sidebar Glass */}
            <aside className="w-64 glass border-r border-white/5 flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-premium">
                        Watink Cloud
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <NavItem to="/instances" icon={<Server size={20} />} label="Instâncias" />
                    <NavItem to="/settings" icon={<Settings size={20} />} label="Configurações" />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <LogOut size={18} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 relative">
                {/* Glow de fundo */}
                <div className="absolute top-0 left-0 w-full h-96 bg-indigo-500/10 blur-[120px] pointer-events-none" />
                {children}
            </main>
        </div>
    );
}

import { Link, useLocation } from 'react-router-dom';

function NavItem({ icon, label, to }: { icon: ReactNode, label: string, to: string }) {
    const location = useLocation();
    const active = location.pathname === to;

    return (
        <Link to={to} className={clsx(
            "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all",
            active
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
        )}>
            {icon}
            {label}
        </Link>
    );
}

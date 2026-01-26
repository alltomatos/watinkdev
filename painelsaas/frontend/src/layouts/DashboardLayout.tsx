import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Server, CreditCard, LogOut, Settings, Bell } from 'lucide-react';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/instances', label: 'Instances', icon: Server },
        { to: '/plans', label: 'Plans', icon: CreditCard },
    ];

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                {/* Brand */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Panel One
                    </span>
                    <span className="ml-2 text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">Pro</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/dashboard'} // Exact match for root dashboard
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-600/10 text-blue-400 font-medium'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                            {user.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name || 'Admin User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
                {/* Topbar */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-8">
                    <h2 className="text-sm font-medium text-slate-400">
                        Organization / <span className="text-white">Main Workspace</span>
                    </h2>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:text-white transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-white transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

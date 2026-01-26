import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './layouts/Layout';
import { QueueHealth } from './pages/QueueHealth';
import { InstancesPage } from './pages/InstancesPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    // Mock login: true por enquanto para visualização imediata, remover '|| true' depois
    return (isAuthenticated || true) ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function Login() {
    const { login } = useAuth();
    return (
        <div className="h-screen w-screen flex items-center justify-center auth-gradient">
            <div className="glass p-8 rounded-2xl w-full max-w-md text-center">
                <h2 className="text-2xl font-bold mb-6">Acesso Restrito</h2>
                <button
                    onClick={() => login('mock-token')}
                    className="w-full py-3 bg-gradient-premium rounded-lg font-medium shadow-lg hover:opacity-90 transition-opacity"
                >
                    Entrar no Painel
                </button>
            </div>
        </div>
    )
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <PrivateRoute>
                            <QueueHealth />
                        </PrivateRoute>
                    } />
                    <Route path="/instances" element={
                        <PrivateRoute>
                            <InstancesPage />
                        </PrivateRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;

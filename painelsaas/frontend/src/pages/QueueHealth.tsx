import { useState, useEffect } from 'react';
// import { useQuery } from '@tanstack/react-query'; // DevSaas recomendou, mas vamos usar useEffect simples por hora para evitar config extra se não tivermos wrapper
import { Card } from '../components/ui/Card';
import { Activity, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

export function QueueHealth() {
    // Mock Data (Enquanto o endpoint não está pronto ou para visualização imediata)
    const [stats, setStats] = useState({
        queued: 124,
        sent: 8502,
        failed: 3
    });

    // Efeito de Polling (Simulação)
    useEffect(() => {
        const interval = setInterval(() => {
            // Aqui entraria a chamada real: axios.get('/api/v1/metrics')
            setStats(prev => ({
                queued: Math.max(0, prev.queued + Math.floor(Math.random() * 10) - 5),
                sent: prev.sent + Math.floor(Math.random() * 5),
                failed: prev.failed
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-premium mb-8">
                RabbitMQ Health Monitor
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-amber-500/20 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-lg">
                            <Layers className="text-amber-500 w-6 h-6 animate-pulse-slow" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Na Fila</p>
                            <p className="text-2xl font-mono font-bold text-amber-500">{stats.queued}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-lg">
                            <CheckCircle className="text-emerald-500 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Enviados</p>
                            <p className="text-2xl font-mono font-bold text-emerald-500">{stats.sent}</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-rose-500/20 hover:border-rose-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 rounded-lg">
                            <AlertTriangle className="text-rose-500 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Falhas</p>
                            <p className="text-2xl font-mono font-bold text-rose-500">{stats.failed}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Gráfico Mock/Placeholder */}
            <Card className="mt-8 h-64 flex items-center justify-center border-dashed border-zinc-800">
                <div className="text-center text-zinc-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Gráfico de Throughput em Tempo Real</p>
                </div>
            </Card>
        </div>
    );
}

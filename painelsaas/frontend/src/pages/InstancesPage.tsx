import { useState, useEffect } from 'react';
import { Plus, ServerCrash } from 'lucide-react';
import { instanceService, Instance } from '../services/instanceService';
import { InstanceCard } from '../components/instances/InstanceCard';
import { CreateInstanceModal } from '../components/instances/CreateInstanceModal';

export function InstancesPage() {
    const [instances, setInstances] = useState<Instance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInstances = async () => {
        try {
            setIsLoading(true);
            const data = await instanceService.getInstances();
            setInstances(data || []);
        } catch (err) {
            setError("Falha ao carregar instâncias.");
            // Fallback para dev visual se a API não estiver rodando
            // setInstances([]); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInstances();
    }, []);

    const handleTogglePush = async (id: string) => {
        // Otimistic Update
        setInstances(prev => prev.map(inst =>
            inst.id === id ? { ...inst, push_enabled: !inst.push_enabled } : inst
        ));

        try {
            await instanceService.togglePush(id);
        } catch (err) {
            // Reverter em caso de erro
            setInstances(prev => prev.map(inst =>
                inst.id === id ? { ...inst, push_enabled: !inst.push_enabled } : inst
            ));
            alert("Falha ao alterar status do Push");
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-premium">
                        Gerenciar Instâncias
                    </h1>
                    <p className="text-zinc-400 mt-1">Controle suas conexões Watink e status de Push.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-premium rounded-lg text-white font-medium shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={20} />
                    Nova Instância
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-zinc-800/50 rounded-xl"></div>
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-20 opacity-50">
                    <ServerCrash size={48} className="mx-auto mb-4 text-rose-500" />
                    <h3 className="text-xl font-bold text-rose-500">{error}</h3>
                </div>
            ) : instances.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <h3 className="text-xl font-medium text-zinc-300">Nenhuma instância encontrada</h3>
                    <p className="text-zinc-500 mt-2 mb-6">Comece criando sua primeira conexão Watink.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
                    >
                        Criar Agora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {instances.map(inst => (
                        <InstanceCard
                            key={inst.id}
                            instance={inst}
                            onTogglePush={handleTogglePush}
                        />
                    ))}
                </div>
            )}

            <CreateInstanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchInstances();
                    // Não fecha modal imediatamente para user ver a API Key
                }}
            />
        </div>
    );
}

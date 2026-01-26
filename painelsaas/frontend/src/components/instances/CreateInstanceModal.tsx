import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { instanceService, CreateInstanceResponse } from '../../services/instanceService';

interface CreateInstanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateInstanceModal({ isOpen, onClose, onSuccess }: CreateInstanceModalProps) {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createdData, setCreatedData] = useState<CreateInstanceResponse | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const data = await instanceService.createInstance({ name, url });
            setCreatedData(data);
            onSuccess(); // Recarrega lista no parente
        } catch (err) {
            setError("Falha ao criar instância. Verifique a URL e tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (createdData?.api_key) {
            navigator.clipboard.writeText(createdData.api_key);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setCreatedData(null);
        setName('');
        setUrl('');
        setError(null);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-white/10"
                >
                    <button onClick={handleClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white">
                        <X size={20} />
                    </button>

                    {!createdData ? (
                        <>
                            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-premium">
                                Nova Instância
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-400 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-400">Nome da Instância</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-zinc-600"
                                        placeholder="Ex: Produção Cliente A"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-zinc-400">URL do Endpoint</label>
                                    <input
                                        type="url"
                                        required
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-zinc-600"
                                        placeholder="https://watink.cliente.com"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3 bg-gradient-premium rounded-lg font-medium shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading && <Loader2 className="animate-spin" size={18} />}
                                        Criar Instância
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Instância Criada!</h3>
                            <p className="text-zinc-400 text-sm mb-6">
                                Copie sua chave de API abaixo. Você não poderá vê-la novamente.
                            </p>

                            <div className="bg-zinc-950/80 p-4 rounded-xl border border-dashed border-zinc-700 mb-6 relative group">
                                <code className="text-indigo-400 font-mono text-sm break-all">
                                    {createdData.api_key}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute right-2 top-2 p-2 bg-zinc-800 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                </button>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 bg-zinc-800 text-zinc-300 rounded-lg font-medium hover:bg-zinc-700 transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

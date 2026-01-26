import { Instance } from '../../services/instanceService';
import { Server, Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface InstanceCardProps {
    instance: Instance;
    onTogglePush: (id: string) => void;
}

export function InstanceCard({ instance, onTogglePush }: InstanceCardProps) {
    const [copied, setCopied] = useState(false);

    // Função auxiliar para copiar ID (ou URL) caso user queira
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6 border border-white/5 hover:border-indigo-500/30 transition-all group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={clsx("p-2 rounded-lg", instance.status === 'active' ? 'bg-emerald-500/10' : 'bg-zinc-500/10')}>
                        <Server size={20} className={instance.status === 'active' ? 'text-emerald-500' : 'text-zinc-500'} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">{instance.name}</h3>
                        <p className="text-xs text-zinc-500 flex items-center gap-1 cursor-pointer hover:text-indigo-400 transition-colors"
                            onClick={() => copyToClipboard(instance.url)}>
                            {instance.url.replace(/^https?:\/\//, '')}
                            {copied ? <Check size={10} /> : <Copy size={10} />}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={clsx("w-2 h-2 rounded-full", instance.push_enabled ? "bg-emerald-500 animate-pulse" : "bg-zinc-600")}></span>
                    <span className="text-xs text-zinc-500">{instance.status}</span>
                </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                <span className="text-sm text-zinc-400">Push Notifications</span>
                <button
                    onClick={() => onTogglePush(instance.id)}
                    className={clsx(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900",
                        instance.push_enabled ? 'bg-indigo-600' : 'bg-zinc-700'
                    )}
                >
                    <span
                        className={clsx(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            instance.push_enabled ? 'translate-x-6' : 'translate-x-1'
                        )}
                    />
                </button>
            </div>
        </motion.div>
    );
}

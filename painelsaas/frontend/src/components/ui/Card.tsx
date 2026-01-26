import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={twMerge(clsx("glass rounded-xl p-6 shadow-xl", className))}
        >
            {children}
        </motion.div>
    );
}

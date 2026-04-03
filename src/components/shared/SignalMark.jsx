import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function SignalMark({ className }) {
  return (
    <div
      className={cn(
        'relative isolate flex items-center justify-center overflow-hidden rounded-[1rem] border border-white/10 bg-[linear-gradient(160deg,rgba(8,15,28,0.96),rgba(8,47,73,0.88))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_30px_-18px_rgba(14,165,233,0.85)]',
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-[14%] rounded-[0.9rem] border border-white/[0.06]" />
      <motion.span
        className="absolute inset-[22%] rounded-full border border-cyan-300/25"
        animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.28, 0.72, 0.28] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute inset-[34%] rounded-full border border-blue-100/18"
        animate={{ scale: [1.08, 0.95, 1.08], opacity: [0.2, 0.56, 0.2] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute h-[2px] w-[72%] rounded-full bg-gradient-to-r from-transparent via-cyan-200/95 to-transparent"
        animate={{ rotate: [-34, 24, -34], opacity: [0.35, 0.95, 0.35] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute h-2.5 w-2.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(125,211,252,0.95)]"
        animate={{ scale: [1, 1.14, 1], opacity: [0.82, 1, 0.82] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

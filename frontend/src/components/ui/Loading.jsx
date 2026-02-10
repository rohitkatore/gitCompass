import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4 border-[1.5px]',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-10 h-10 border-[2.5px]',
  };

  return (
    <div
      className={cn(
        'rounded-full border-zinc-700 border-t-indigo-500 animate-spin',
        sizes[size],
        className
      )}
    />
  );
};

export const DotsLoader = ({ className }) => (
  <div className={cn('flex items-center gap-1', className)}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-zinc-500 rounded-full"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

export const PulseLoader = ({ className }) => (
  <div className={cn('flex items-center gap-1', className)}>
    <Spinner size="md" />
  </div>
);

export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  </div>
);

export const Skeleton = ({ className, variant = 'text' }) => {
  const variants = {
    text: 'h-4 rounded-md',
    title: 'h-6 rounded-md',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-40 rounded-xl',
    button: 'h-9 w-20 rounded-lg',
  };

  return (
    <div className={cn('skeleton', variants[variant], className)} />
  );
};

export const CardSkeleton = () => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton variant="avatar" />
      <div className="space-y-2 flex-1">
        <Skeleton className="w-3/4" />
        <Skeleton className="w-1/2" />
      </div>
    </div>
    <Skeleton className="h-16 rounded-lg" />
    <div className="flex gap-2">
      <Skeleton variant="button" />
      <Skeleton variant="button" />
    </div>
  </div>
);

export default Spinner;

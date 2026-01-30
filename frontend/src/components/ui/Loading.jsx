import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

// Spinner loader
export const Spinner = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={cn(
        'rounded-full border-slate-700 border-t-indigo-500 animate-spin',
        sizes[size],
        className
      )}
    />
  );
};

// Dots loader
export const DotsLoader = ({ className }) => {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-indigo-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
};

// Pulse loader
export const PulseLoader = ({ className }) => {
  return (
    <div className={cn('relative w-12 h-12', className)}>
      <motion.div
        className="absolute inset-0 rounded-full bg-indigo-500/30"
        animate={{
          scale: [1, 2],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      <div className="absolute inset-2 rounded-full bg-indigo-500" />
    </div>
  );
};

// Full page loader
export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <motion.div
            className="w-16 h-16 rounded-full border-4 border-indigo-500/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-indigo-500"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <motion.p
          className="text-slate-300 font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
};

// Skeleton loader
export const Skeleton = ({ className, variant = 'text' }) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    avatar: 'w-12 h-12 rounded-full',
    card: 'h-48 rounded-xl',
    button: 'h-10 w-24 rounded-lg',
  };

  return (
    <motion.div
      className={cn(
        'bg-slate-700/50',
        variants[variant],
        className
      )}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
};

// Card skeleton
export const CardSkeleton = () => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-3/4" />
          <Skeleton className="w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 rounded-lg" />
      <div className="flex gap-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" />
      </div>
    </div>
  );
};

export default Spinner;

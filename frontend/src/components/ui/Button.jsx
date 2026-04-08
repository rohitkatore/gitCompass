import { forwardRef, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400 active:bg-indigo-600',
  secondary: 'bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:border-zinc-600',
  ghost: 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
};

const sizes = {
  sm: 'h-9 px-4 text-sm gap-2',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
  xl: 'h-14 px-7 text-base gap-2.5',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-5 h-5',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  as: Tag = 'button',
  ...props
}, ref) => {
  // Cache the motion-enhanced component so motion() is not called on every render.
  // Tag virtually never changes for a given Button instance, so this is safe.
  const motionRef = useRef(null);
  const tagRef = useRef(undefined);
  if (tagRef.current !== Tag) {
    tagRef.current = Tag;
    if (!Tag || Tag === 'button') {
      motionRef.current = motion.button;
    } else if (typeof Tag === 'string') {
      motionRef.current = motion[Tag] || motion.button;
    } else {
      motionRef.current = motion(Tag);
    }
  }
  const MotionComponent = motionRef.current;
  const isNativeButton = !Tag || Tag === 'button';

  return (
    <MotionComponent
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.1 }}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...(isNativeButton ? { disabled: disabled || loading } : {})}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className={cn('animate-spin', iconSizes[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{children || 'Loading...'}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className={iconSizes[size]} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={iconSizes[size]} />}
        </>
      )}
    </MotionComponent>
  );
});

Button.displayName = 'Button';

export default Button;

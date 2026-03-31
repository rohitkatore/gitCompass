import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  success,
  helperText,
  icon: Icon,
  variant = 'default',
  className,
  containerClassName,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  // 'default' — for use on page background (zinc-950)
  // 'elevated' — for use inside cards (zinc-900 background)
  const bgBorder = variant === 'elevated'
    ? 'bg-zinc-800 border-zinc-700 focus:border-indigo-500'
    : 'bg-zinc-900 border-zinc-800 focus:border-zinc-600';

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'w-full h-9 border rounded-lg px-3 text-sm text-zinc-100 placeholder-zinc-600 transition-colors duration-150 focus:outline-none',
            bgBorder,
            Icon && 'pl-10',
            type === 'password' && 'pr-10',
            error
              ? 'border-red-500/40 focus:border-red-500'
              : success
                ? 'border-emerald-500/40 focus:border-emerald-500'
                : '',
            className
          )}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className={cn(
          'flex items-center gap-1 mt-1.5 text-xs',
          error ? 'text-red-400' : success ? 'text-emerald-400' : 'text-zinc-500'
        )}>
          {error && <AlertCircle className="w-3 h-3" />}
          {success && <CheckCircle className="w-3 h-3" />}
          <span>{error || success || helperText}</span>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  success,
  helperText,
  icon: Icon,
  className,
  containerClassName,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={cn('w-full', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={inputType}
          className={cn(
            'w-full bg-slate-800/50 border rounded-lg px-4 py-3 text-white placeholder-slate-500 transition-all duration-300 focus:outline-none',
            Icon && 'pl-11',
            type === 'password' && 'pr-11',
            error 
              ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : success 
                ? 'border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
                : 'border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
        
        {/* Animated border glow */}
        <AnimatePresence>
          {isFocused && !error && !success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
              }}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Helper text / Error / Success messages */}
      <AnimatePresence mode="wait">
        {(error || success || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'flex items-center gap-1 mt-2 text-sm',
              error ? 'text-red-400' : success ? 'text-green-400' : 'text-slate-400'
            )}
          >
            {error && <AlertCircle className="w-4 h-4" />}
            {success && <CheckCircle className="w-4 h-4" />}
            <span>{error || success || helperText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

import { cn } from '../../lib/utils';

const Card = ({
  children,
  className,
  hover = false,
  padding = 'md',
  ...props
}) => {
  const paddingSizes = {
    none: '',
    sm: 'p-6',
    md: 'p-7 sm:p-8',
    lg: 'p-8 sm:p-10',
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900 transition-colors duration-150',
        hover && 'hover:border-zinc-700 hover:bg-zinc-800/60',
        paddingSizes[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className, ...props }) => (
  <div className={cn('mb-7', className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-zinc-100', className)} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className, ...props }) => (
  <p className={cn('text-sm text-zinc-500 mt-1', className)} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className, ...props }) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className, ...props }) => (
  <div className={cn('mt-4 pt-4 border-t border-zinc-800', className)} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;

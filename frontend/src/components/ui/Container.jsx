import { cn } from '../../lib/utils';

/**
 * Container — canonical max-width + centering + horizontal padding.
 *
 * size:
 *   sm  → max-w-3xl  (768px)  — login, narrow forms
 *   md  → max-w-4xl  (896px)  — AI bot, focused content
 *   lg  → max-w-6xl  (1152px) — search, skills, repository
 *   xl  → max-w-7xl  (1280px) — dashboard, data-dense layouts
 *
 * Usage:
 *   <Container size="lg">...</Container>
 */
const Container = ({ children, size = 'lg', as: Tag = 'div', className, ...props }) => {
  const sizes = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
  };

  return (
    <Tag
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizes[size], className)}
      {...props}
    >
      {children}
    </Tag>
  );
};

export default Container;

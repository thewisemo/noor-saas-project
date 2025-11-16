import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const baseStyles =
  'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rtl:tracking-tight';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/35 hover:shadow-xl hover:translate-y-[-1px]',
  secondary: 'bg-white text-gray-900 shadow hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
  ghost:
    'border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
  danger:
    'bg-red-500/90 text-white shadow-sm hover:bg-red-500 focus-visible:ring-red-500 dark:bg-red-500/80 dark:hover:bg-red-500',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', children, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
});

export default Button;


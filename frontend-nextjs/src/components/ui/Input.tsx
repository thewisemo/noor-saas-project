import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input({ label, hint, className, ...props }, ref) {
  return (
    <label className="space-y-2 text-sm">
      {label && <span className="block text-xs font-medium text-[var(--color-muted)]">{label}</span>}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-2xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:outline-none dark:bg-white/5 dark:text-white',
          className,
        )}
        {...props}
      />
      {hint && <span className="block text-xs text-[var(--color-muted)]">{hint}</span>}
    </label>
  );
});

export default Input;


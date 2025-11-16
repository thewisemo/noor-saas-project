import { cn } from '@/lib/cn';

type AlertProps = {
  title?: string;
  message: string;
  variant?: 'info' | 'success' | 'danger' | 'warning';
  className?: string;
};

const variantStyles: Record<NonNullable<AlertProps['variant']>, string> = {
  info: 'bg-blue-50 text-blue-900 border-blue-100 dark:bg-blue-500/10 dark:text-blue-100 dark:border-blue-500/20',
  success:
    'bg-emerald-50 text-emerald-900 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-100 dark:border-emerald-500/20',
  danger:
    'bg-red-50 text-red-900 border-red-100 dark:bg-red-500/15 dark:text-red-100 dark:border-red-500/30 dark:ring-red-500/20',
  warning:
    'bg-amber-50 text-amber-900 border-amber-100 dark:bg-amber-500/10 dark:text-amber-50 dark:border-amber-500/30',
};

export default function Alert({ title, message, variant = 'info', className }: AlertProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm shadow-sm',
        'flex items-start gap-3',
        variantStyles[variant],
        className,
      )}
      role="alert"
    >
      <span aria-hidden className="text-lg">
        {variant === 'info' && 'ℹ️'}
        {variant === 'success' && '✅'}
        {variant === 'danger' && '⚠️'}
        {variant === 'warning' && '⚡️'}
      </span>
      <div className="space-y-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <p className="text-xs leading-relaxed">{message}</p>
      </div>
    </div>
  );
}


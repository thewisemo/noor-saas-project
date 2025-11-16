import { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  badge?: string;
  className?: string;
};

export default function PageHeader({ title, subtitle, actions, badge, className }: PageHeaderProps) {
  return (
    <div className={cn('glass-card relative overflow-hidden rounded-3xl', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3 text-right">
          {badge && (
            <span className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs text-white/90 dark:text-white">
              {badge}
            </span>
          )}
          <h1 className="text-3xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="max-w-2xl text-sm text-white/80 dark:text-white/70">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}


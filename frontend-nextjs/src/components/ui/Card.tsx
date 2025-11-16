import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
};

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, title, description, actions, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'card relative overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)]',
        className,
      )}
      {...props}
    >
      {(title || description || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {description && <p className="text-sm text-[var(--color-muted)]">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
});

export default Card;


import type { ReactNode, HTMLAttributes } from 'react';

import { cn } from '../lib/utils';
import './Card.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
    title?: string;
    action?: ReactNode;
}

export function Card({ children, className, title, action, ...props }: CardProps) {
    return (
        <div className={cn('card glass-panel', className)} {...props}>
            {(title || action) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {action && <div className="card-action">{action}</div>}
                </div>
            )}
            <div className="card-content">{children}</div>
        </div>
    );
}

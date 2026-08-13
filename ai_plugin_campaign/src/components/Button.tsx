import { Link } from 'react-router-dom';
import { Icon } from './Icon';

export function PrimaryLink({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <Link className={`button button--primary ${className}`} to={to}>
      <span>{children}</span>
      <span className="button__icon"><Icon name="arrow-up-right" size={18} /></span>
    </Link>
  );
}

export function TextLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <Icon name="arrow-right" size={18} />
    </Link>
  );
}

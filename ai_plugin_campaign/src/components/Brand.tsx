import { Link } from 'react-router-dom';

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand ${inverse ? 'brand--inverse' : ''}`} to="/" aria-label="智启青年活动首页">
      <span className="brand__mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="brand__copy">
        <strong>智启青年</strong>
        <small>YOUTH × AI</small>
      </span>
    </Link>
  );
}

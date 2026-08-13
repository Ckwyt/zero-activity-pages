import { Brand } from './Brand';
import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell site-footer__inner">
        <Brand inverse />
        <p>让青年创意与 AI 一起，抵达更远的地方。</p>
        <div className="site-footer__meta">
          <span>© 2026 智启青年 AI 创意计划</span>
          <a href="mailto:ai-youth@example.com">联系我们</a>
          <Link to="/rules">参赛须知</Link>
        </div>
      </div>
    </footer>
  );
}

export function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="rules-title">
      <article className="rules-modal">
        <button className="modal-close" type="button" aria-label="关闭" onClick={onClose}>×</button>
        <h2 id="rules-title">活动规则</h2>
        <section>
          <h3>作品要求</h3>
          <p>使用 ZERO 浏览器 AI 生成插件功能完成原创作品，围绕真实场景和真实痛点，作品内容健康、合法合规。</p>
        </section>
        <section>
          <h3>提交说明</h3>
          <p>提交生成的插件作品，可附加 300 字以内作品说明，介绍目标人群、痛点、使用场景和产品价值。</p>
        </section>
        <section>
          <h3>评审说明</h3>
          <p>活动将从场景真实性、创意可行性、表达清晰度和正向价值导向四个维度进行遴选。</p>
        </section>
        <button className="pill-button pill-button--purple" type="button" onClick={onClose}>我知道了</button>
      </article>
    </div>
  );
}

const schedule = [
  ['作品征集期', '活动启动后持续 21 天，学生在 ZERO 浏览器专题【作品征集专区】线上提交方案'],
  ['素材初审', '征集截止后 3 个工作日，主办方筛选合规、具备实践价值的优质创意，纳入线上展示库'],
  ['专题线上展播', '入选创意在活动专题页面公开展示，面向全体参与同学开放浏览学习'],
  ['专家遴选', '线上展播结束 10 个工作日内，主办单位邀约 AI 行业、产品领域资深专家，对展出作品开展评审，遴选优质创意方案'],
  ['成果公示表彰', '公示优秀创意名单，为创作者颁发荣誉证书；优秀方案择优在中国青年网、中国文艺网新媒体平台进行宣传'],
];

const criteria = [
  ['场景真实性', '40%', '是否抓住真实人群切实存在的痛点'],
  ['创意可行性', '30%', '依托浏览器 AI 能力具备落地想象空间'],
  ['表达清晰度', '20%', '一句话方案表述精准、逻辑完整'],
  ['正向价值导向', '10%', '符合青年发展、数字文明、合规伦理要求'],
];

export function CompetitionTrack({
  onRules,
  showRules = true,
}: {
  onRules: () => void;
  showRules?: boolean;
}) {
  return (
    <main className="competition-track">
      <div className="competition-track__aura" aria-hidden="true">
        <img src="/assets/figma/theme-aura.png" alt="" />
      </div>
      {showRules ? (
        <button className="rules-dock" type="button" onClick={onRules}><span>活动<br />规则</span></button>
      ) : null}
      <section className="theme-section section-shell competition-section">
        <img
          className="theme-heading"
          src="/assets/figma/theme-heading.svg"
          alt="征集主题 THEME"
        />
        <article className="theme-card">
          <p>依托 <strong>ZERO浏览器</strong> AI 生成解决方案功能，用一句话定义一款能够解决真实生活、校园场景痛点的创艺插件。</p>
          <h3>一句话标准格式：</h3>
          <p>面向【目标人群】，解决【什么真实痛点】，通过【AI 能力 / 功能形式】，实现【最终价值】</p>
          <span>作品提交要求</span>
          <ol>
            <li><strong>1. 创作工具：</strong>全程使用ZERO浏览器的AI生成插件功能，完成创意构思、方案打磨、作品落地；</li>
            <li><strong>2. 提交内容：</strong>提交生成的插件作品，可自愿附加简短作品说明（300字以内，阐述痛点、使用场景、落地可行性、产品价值等）；</li>
            <li><strong>3. 选题方向（任选）：</strong>校园学习生活、大众日常上网、文旅传播、就业求职、中小企业数字化、青年普惠工具等真实场景；</li>
            <li><strong>4. 原创要求：</strong>创意独立原创，杜绝抄袭，聚焦真实痛点，拒绝空泛、脱离实际的概念。</li>
          </ol>
        </article>
      </section>

      <section className="schedule-section section-shell competition-section">
        <img
          className="schedule-heading"
          src="/assets/figma/schedule-heading.svg"
          alt="征集周期与遴选安排 CYCLE AND SCHEDULE"
        />
        <div className="schedule-board">
          <div className="timeline-panel">
            <h3>征集周期</h3>
            <div className="timeline-list">
              {schedule.map(([title, description]) => (
                <article key={title}>
                  <i aria-hidden="true" />
                  <div><h4>{title}</h4><p>{description}</p></div>
                </article>
              ))}
            </div>
          </div>
          <div className="criteria-panel">
            <h3>遴选参考维度</h3>
            <div>
              {criteria.map(([title, value, description]) => (
                <article key={title}><h4>{title}<span>{value}</span></h4><p>{description}</p></article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="award-section section-shell competition-section">
        <img
          className="award-heading"
          src="/assets/figma/award-heading.svg"
          alt="奖励设置 AWARD"
        />
        <div className="awards-grid">
          {[
            ['金奖', 'award--gold'],
            ['银奖', 'award--silver'],
            ['铜奖', 'award--bronze'],
          ].map(([title, className]) => (
            <article className={className} key={title}><h3>{title}<span>若干</span></h3><p>官方荣誉证书 + 现金/实物奖励</p></article>
          ))}
          <article className="award--creative"><h3>优秀创意奖</h3><p>电子获奖证书* 获奖名单、优秀创意方案将在中国青年网、中国文艺网官方渠道择优展示；优质创意方案有机会进行进一步落地研讨。</p></article>
        </div>
      </section>
    </main>
  );
}

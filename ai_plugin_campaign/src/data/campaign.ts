import type { CampaignPhase, CampaignTrack, FaqItem, ShowcaseWork } from '../types';

export const campaignMeta = {
  title: '智启青年・洞见 AI 未来',
  shortTitle: '洞见 AI 未来',
  year: '2026',
  deadline: '2026.09.20',
  slogan: '让每一个年轻的灵感，都拥有改变未来的可能。',
};

export const campaignStats = [
  { value: '03', label: '创意赛道' },
  { value: '30+', label: '行业导师' },
  { value: '100W+', label: '创意扶持资源' },
  { value: '09.20', label: '作品截止日期' },
];

export const campaignTracks: CampaignTrack[] = [
  {
    id: 'plugin',
    index: '01',
    title: 'AI 插件创想赛',
    eyebrow: 'PLUGIN INNOVATION',
    description: '围绕浏览、创作、效率与学习场景，提出真正解决问题的 AI 浏览器插件创意。',
    tags: ['产品创意', '交互原型', '浏览器生态'],
    icon: 'sparkles',
  },
  {
    id: 'experience',
    index: '02',
    title: 'AI 体验洞察官',
    eyebrow: 'EXPERIENCE INSIGHT',
    description: '深度体验前沿 AI 工具，用年轻人的真实视角发现机会、问题与下一步可能。',
    tags: ['体验报告', '用户洞察', '趋势研究'],
    icon: 'compass',
  },
  {
    id: 'practice',
    index: '03',
    title: 'AI 应用实践赛',
    eyebrow: 'APPLIED AI',
    description: '把 AI 带入校园与工作现场，用一个可验证的解决方案回应真实需求。',
    tags: ['场景实践', '解决方案', '社会价值'],
    icon: 'layers',
  },
];

export const campaignPhases: CampaignPhase[] = [
  {
    date: '08.12 — 08.25',
    title: '开启报名',
    description: '选择赛道，提交个人信息与初步创意方向。',
    status: 'completed',
  },
  {
    date: '08.26 — 09.20',
    title: '作品征集',
    description: '完善方案、原型或洞察报告，上传最终参赛作品。',
    status: 'active',
  },
  {
    date: '09.21 — 09.28',
    title: '专业评审',
    description: '由产品、技术、设计与行业导师进行多维评审。',
    status: 'upcoming',
  },
  {
    date: '10.10',
    title: '未来盛典',
    description: '公布获奖作品，现场路演并开启创意孵化计划。',
    status: 'upcoming',
  },
];

export const showcaseWorks: ShowcaseWork[] = [
  {
    id: 'focus-flow',
    title: 'Focus Flow',
    category: 'AI 插件创想赛',
    author: '林川 / 浙江大学',
    description: '理解浏览上下文，自动整理信息流与待办的专注力插件。',
    theme: 'violet',
    icon: 'orbit',
  },
  {
    id: 'echo-note',
    title: 'Echo Note',
    category: 'AI 应用实践赛',
    author: '陈默 / 中国传媒大学',
    description: '将课堂讨论实时转化为可追溯知识图谱的协作学习工具。',
    theme: 'cyan',
    icon: 'brain',
  },
  {
    id: 'silver-web',
    title: 'Silver Web',
    category: 'AI 体验洞察官',
    author: '许知遥 / 同济大学',
    description: '面向银发群体的生成式界面研究与无障碍体验提案。',
    theme: 'lime',
    icon: 'wand',
  },
];

export const faqItems: FaqItem[] = [
  {
    question: '谁可以参与本次活动？',
    answer: '18—35 岁的青年均可报名。支持个人或 2—5 人团队参赛，学生与青年从业者都可以参加。',
  },
  {
    question: '必须具备开发能力吗？',
    answer: '不需要。不同赛道接受创意说明、体验报告、交互原型或可运行作品，评审会综合关注洞察、创新、完成度与社会价值。',
  },
  {
    question: '作品可以使用生成式 AI 吗？',
    answer: '可以，但需在作品说明中披露使用的模型、工具与生成范围，并确保提交内容不侵犯第三方知识产权。',
  },
  {
    question: '报名后还能修改作品吗？',
    answer: '作品征集截止前可通过报名编号更新内容；截止后进入评审锁定状态，不再接受替换。',
  },
];

export const judgingCriteria = [
  { label: '洞察价值', value: 30 },
  { label: '创新表达', value: 30 },
  { label: '落地能力', value: 25 },
  { label: '社会影响', value: 15 },
];

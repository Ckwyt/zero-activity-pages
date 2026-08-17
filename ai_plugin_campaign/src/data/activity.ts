import type { PluginWork } from '../types';

export const activityLinks = {
  course: import.meta.env.VITE_COURSE_URL
    || 'https://www.bilibili.com/video/BV1QruC6iEWA/?spm_id_from=333.1007.tianma.1-1-1.click&assistant_action=course_submit',
  drive: import.meta.env.VITE_DRIVE_URL
    || 'https://www.zbrowser.cn/share/?s=1fSSWYKnmM1qLUKrfxGjHL',
  search: import.meta.env.VITE_SEARCH_URL
    || 'zero://newtab?openSearchEngine=1',
  skin: import.meta.env.VITE_SKIN_URL
    || 'zero://newtab/?floor=skin',
  pdf: import.meta.env.VITE_PDF_URL
    || 'https://dnf999.neocities.org/%E6%B5%8B%E8%AF%95.pdf?assistant_action=advanced_feature',
  summary: import.meta.env.VITE_SUMMARY_COURSE_URL
    || 'https://www.bilibili.com/video/BV1QruC6iEWA/?spm_id_from=333.1007.tianma.1-1-1.click&assistant_action=course_finish',
  pluginGenerator: import.meta.env.VITE_PLUGIN_GENERATOR_URL || 'https://www.zbrowser.cn/PluginHub/',
  showcase: import.meta.env.VITE_SHOWCASE_URL || '#showcase',
};

export const competitionConfig = {
  startAt: import.meta.env.VITE_COMPETITION_START_AT || '2026-08-12T00:00:00+08:00',
  // 这两个字段按北京时间自然日判断，可直接修改为需要的 YYYY-MM-DD 日期。
  // 当天（含）以前可进入 PluginHub 上传；之后至初审截止日点击上传会显示截止弹窗。
  uploadDeadline: import.meta.env.VITE_UPLOAD_DEADLINE
    || import.meta.env.VITE_COMPETITION_END_AT
    || '2026-08-01',
  // 该日期之后，首页按钮切换为“作品展示”。
  initialReviewDeadline: import.meta.env.VITE_INITIAL_REVIEW_DEADLINE || '2026-09-04',
  expertReviewDays: 10,
};

export const pluginWorks: PluginWork[] = [
  {
    id: 'campus-study',
    title: '校园学习效率助手',
    description: '自动梳理课程重点，快速生成复习清单与学习计划。',
    author: 'ZERO',
    badge: '135',
    image: '/assets/figma/showcase/raw-2.png',
  },
  {
    id: 'travel-guide',
    title: '文旅灵感生成器',
    description: '根据兴趣与时间，一键规划有温度的城市漫游路线。',
    author: 'ZERO',
    badge: '128',
    image: '/assets/figma/showcase/raw-4.png',
  },
  {
    id: 'job-helper',
    title: '青年求职助理',
    description: '分析岗位要求，针对性优化简历并模拟面试问答。',
    author: 'ZERO',
    badge: '116',
    image: '/assets/figma/showcase/raw-5.png',
  },
  {
    id: 'design-master',
    title: 'F.1建筑设计/草图大师',
    description: '将自然语言需求快速转化为结构清晰的设计草图。',
    author: 'ZERO',
    badge: '109',
    image: '/assets/figma/showcase/raw-3.png',
  },
  {
    id: 'reading',
    title: '文献速读与追问',
    description: '提取长文核心观点，保留依据并支持上下文追问。',
    author: 'ZERO',
    badge: '98',
    image: '/assets/figma/showcase/raw-1.png',
  },
  {
    id: 'club',
    title: '校园社团活动官',
    description: '从策划、物料到招募文案，完成活动全流程协作。',
    author: 'ZERO',
    badge: '92',
    image: '/assets/figma/showcase/raw-11.png',
  },
];

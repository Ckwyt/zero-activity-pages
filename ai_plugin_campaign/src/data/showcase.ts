export interface ShowcaseWork {
  id: string;
  school: string;
  college: string;
  studentName: string;
  title: string;
  description: string;
  author: string;
  badge: string;
  image: string;
}

export type ShowcasePageItem = number | 'ellipsis-start' | 'ellipsis-end';

export const SHOWCASE_PAGE_SIZE = 12;

const schoolProfiles = [
  { school: '北京大学', colleges: ['信息科学技术学院', '建筑与景观设计学院', '新闻与传播学院'] },
  { school: '清华大学', colleges: ['计算机科学与技术系', '美术学院', '建筑学院'] },
  { school: '中国人民大学', colleges: ['信息学院', '新闻学院', '劳动人事学院'] },
  { school: '北京师范大学', colleges: ['人工智能学院', '教育学部', '心理学部'] },
  { school: '中国传媒大学', colleges: ['动画与数字艺术学院', '广告学院', '计算机与网络空间安全学院'] },
  { school: '浙江大学', colleges: ['计算机科学与技术学院', '传媒与国际文化学院', '软件学院'] },
  { school: '复旦大学', colleges: ['计算机科学技术学院', '新闻学院', '管理学院'] },
  { school: '上海交通大学', colleges: ['电子信息与电气工程学院', '设计学院', '安泰经济与管理学院'] },
  { school: '同济大学', colleges: ['建筑与城市规划学院', '设计创意学院', '电子与信息工程学院'] },
  { school: '其他院校', colleges: ['数字媒体学院', '计算机学院', '创新创业学院'] },
];

const workTemplates = [
  ['F.1建筑设计/草图大师', '将自然语言中的空间需求快速转化为结构清晰的建筑设计草图。'],
  ['AI课程笔记助手', '自动提炼课堂重点，生成复习清单、知识卡片与学习计划。'],
  ['校园活动策划师', '根据活动目标生成流程、物料清单和社团招募文案。'],
  ['求职简历优化助手', '分析岗位要求，针对性优化简历并生成模拟面试问题。'],
  ['PDF文献速读器', '提取论文核心观点和关键依据，支持围绕原文继续追问。'],
  ['旅行路线生成器', '结合兴趣、预算与时间，规划更适合年轻人的城市路线。'],
  ['网页信息整理助手', '自动归纳网页信息并整理成清晰、可执行的待办事项。'],
  ['代码学习陪练', '解释代码错误、拆解编程知识点并提供渐进式练习。'],
  ['校园二手交易助手', '生成商品介绍、合理估价并快速整理交易注意事项。'],
  ['英语口语训练师', '模拟真实对话场景，实时纠正表达并给出练习建议。'],
  ['AI搜索导航助手', '根据问题类型推荐搜索引擎，汇总并标注信息来源。'],
  ['创意海报生成器', '用一句话生成校园活动海报方案和配套宣传文案。'],
] as const;

const showcaseImages = [
  '/assets/figma/showcase/card-architecture.png',
  '/assets/figma/showcase/raw-2.png',
  '/assets/figma/showcase/raw-4.png',
  '/assets/figma/showcase/raw-5.png',
];

const surnames = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙'];
const givenNames = ['雨桐', '子涵', '思远', '嘉怡', '宇轩', '若溪', '明哲', '一诺', '知夏', '景行', '诗涵', '浩然'];

// 144 条固定模拟记录，对应设计稿中的 12 页，每页 12 条。
export const mockShowcaseWorks: ShowcaseWork[] = Array.from({ length: 144 }, (_, index) => {
  const profile = schoolProfiles[index % schoolProfiles.length];
  const [title, description] = workTemplates[(index * 5 + Math.floor(index / 10)) % workTemplates.length];
  return {
    id: `showcase-work-${String(index + 1).padStart(3, '0')}`,
    school: profile.school,
    college: profile.colleges[Math.floor(index / schoolProfiles.length) % profile.colleges.length],
    studentName: `${surnames[index % surnames.length]}${givenNames[Math.floor(index / surnames.length) % givenNames.length]}`,
    title,
    description,
    author: 'ZERO',
    badge: String(135 - (index % 28)),
    image: showcaseImages[index % showcaseImages.length],
  };
});

export function filterShowcaseWorks(works: ShowcaseWork[], school: string, keyword: string) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase('zh-CN');
  return works.filter((work) => {
    if (school && work.school !== school) return false;
    if (!normalizedKeyword) return true;
    return [work.title, work.studentName, work.college, work.school, work.description]
      .join(' ')
      .toLocaleLowerCase('zh-CN')
      .includes(normalizedKeyword);
  });
}

export function getShowcasePageItems(currentPage: number, totalPages: number): ShowcasePageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 'ellipsis-end', totalPages - 1, totalPages];
  if (currentPage >= totalPages - 2) return [1, 2, 'ellipsis-start', totalPages - 2, totalPages - 1, totalPages];
  return [1, 'ellipsis-start', currentPage, 'ellipsis-end', totalPages];
}

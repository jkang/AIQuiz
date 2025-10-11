export interface Question {
  type: 'radio' | 'checkbox' | 'textarea';
  question: string;
  options?: string[];
  answer?: string | string[];
  id?: string;
  points: number;
}

export interface QuestionGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: Question[];
}

// 第1组：AI技术应用基础
const group1Questions: Question[] = [
  {
    type: 'radio',
    question: '与传统软件开发的“确定性”不同，大语言模型（LLM）驱动的应用，其核心特性是？',
    options: ['A. 概率性', 'B. 绝对性', 'C. 机械性'],
    answer: 'A',
    points: 1,
  },
  {
    type: 'radio',
    question: '“四级火箭”技术路径不包括以下哪一项？',
    options: ['A. 提示工程', 'B. 检索增强生成（RAG）', 'C. Agent', 'D. 通用人工智能（AGI）'],
    answer: 'D',
    points: 1,
  },
  {
    type: 'radio',
    question: 'ReAct 智能体范式的循环由三个关键步骤组成：思考 (Thought)、行动 (Action) 和？',
    options: ['A. 观察 (Observation)', 'B. 反馈 (Feedback)', 'C. 执行 (Execution)'],
    answer: 'A',
    points: 1,
  },
  {
    type: 'radio',
    question: '如果一个 AI 应用需要处理公司内部“每周都会更新”的规章制度文档，最合适的技术方案是？',
    options: ['A. 提示工程', 'B. RAG', 'C. 微调', 'D. 从头训练'],
    answer: 'B',
    points: 1,
  },
  {
    type: 'radio',
    question: '要实现一个能够“自动调用 API 订机票”的智能助理，所依赖的最核心架构模式是？',
    options: ['A. 多模态', 'B. RAG', 'C. Agent', 'D. 提示链'],
    answer: 'C',
    points: 1,
  },
  {
    type: 'radio',
    question: '为了让 AI 客服的“说话风格”始终贴合品牌调性，最对症下药的技术方案是？',
    options: ['A. 增加 RAG 文档', 'B. 优化 Chunking 策略', 'C. 对模型进行风格化微调', 'D. 使用上下文更大的模型'],
    answer: 'C',
    points: 1,
  },
  {
    type: 'checkbox',
    question: '一个 RAG 系统在回答“今年的年假政策”时却返回了“去年的政策”。这一错误最可能反映出哪些指标表现不佳？（多选）',
    options: ['A. 忠实度 (Faithfulness)', 'B. 答案相关性 (Answer Relevancy)', 'C. 知识时效性 (Knowledge Timeliness)', 'D. API 延迟 (API Latency)'],
    answer: ['B', 'C'],
    points: 1,
  },
  {
    type: 'checkbox',
    question: '作为技术负责人，在选择大模型技术路线时，哪些思路是合理的？（多选）',
    options: ['A. 永远优先选择最昂贵的模型', 'B. 涉及敏感数据时应优先考虑开源模型私有化部署', 'C. 在 PoC 阶段使用成熟的 API 通常成本效益最高', 'D. Token 成本是唯一需要考虑的指标'],
    answer: ['B', 'C'],
    points: 1,
  },
  {
    type: 'radio',
    question: '当模型生成了“看似合理但完全虚构”的回答时，这种现象被称为？',
    options: ['A. 幻觉 (Hallucination)', 'B. 上下文溢出 (Context Overflow)', 'C. 灾难性遗忘 (Catastrophic Forgetting)'],
    answer: 'A',
    points: 1,
  },
  {
    type: 'textarea',
    question: '请简述如何设计一个为研发团队打造的超级助手：它既能回答私有代码相关问题，又能自动创建 Jira 工单。请说明用到的核心架构模式和关键步骤。',
    id: 'shortAnswer1',
    points: 2,
  },
];


// 第2组：AI产品流程和实践（占位题，后续补充）
const group2Questions: Question[] = [
  {
    type: 'textarea',
    question: '请描述在实际AI产品开发中，如何平衡模型性能、成本和用户体验？请结合具体场景说明。',
    id: 'shortAnswer2',
    points: 2,
  },
];

// 分组数据
export const questionGroups: QuestionGroup[] = [
  {
    id: 'group1',
    title: 'AI技术应用基础',
    description: '测试对AI核心技术和架构模式的理解',
    icon: '🎯',
    questions: group1Questions,
  },
  {
    id: 'group2',
    title: 'AI产品流程和实践',
    description: '测试AI产品开发的实战能力',
    icon: '🚀',
    questions: group2Questions,
  },
];

// 兼容性：保留原有的 quizData 导出（将所有题目平铺）
export const quizData: Question[] = questionGroups.flatMap(group => group.questions);

// 计算总分
export const totalPoints = quizData.reduce((sum, q) => sum + q.points, 0);

// 计算每组的总分
export const groupPoints = questionGroups.map(group => ({
  groupId: group.id,
  title: group.title,
  points: group.questions.reduce((sum, q) => sum + q.points, 0),
}));

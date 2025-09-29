export interface Question {
  type: 'radio' | 'checkbox' | 'textarea';
  question: string;
  options?: string[];
  answer?: string | string[];
  id?: string;
  points: number;
}

export const quizData: Question[] = [
  {
    type: 'radio',
    question: '与传统软件开发的“确定性”不同，大语言模型（LLM）驱动的应用开发，其核心特点是？',
    options: ['A. 概率性', 'B. 绝对性', 'C. 机械性'],
    answer: 'A',
    points: 1,
  },
  {
    type: 'radio',
    question: '构建 AI 应用的“四级火箭”不包括以下哪一项？',
    options: ['A. RAG', 'B. Agent', 'C. Fine-tuning', 'D. AGI'],
    answer: 'D',
    points: 1,
  },
  {
    type: 'radio',
    question: 'ReAct 框架的循环由三个关键步骤组成：思考 (Thought)、行动 (Action) 和？',
    options: ['A. 观察 (Observation)', 'B. 反应 (Reaction)', 'C. 结果 (Result)'],
    answer: 'A',
    points: 1,
  },
  {
    type: 'radio',
    question: '为处理每周更新的内部规章制度，最应优先采用的技术方案是？',
    options: ['A. 提示工程', 'B. RAG', 'C. 微调', 'D. 从头训练'],
    answer: 'B',
    points: 1,
  },
  {
    type: 'radio',
    question: '实现“自动调用API订机票”这类功能，最典型的模式是？',
    options: ['A. 多模态', 'B. RAG', 'C. Agent', 'D. 提示链'],
    answer: 'C',
    points: 1,
  },
  {
    type: 'radio',
    question: '为了让机器人的“说话风格”更贴近品牌要求，最对症下药的方案是？',
    options: ['A. 增加 RAG 文档', 'B. 优化 Chunking 策略', 'C. 对模型进行微调', 'D. 换用更大上下文模型'],
    answer: 'C',
    points: 1,
  },
  {
    type: 'checkbox',
    question: 'RAG 系统回答了去年的年假天数。这个问题主要反映了哪些指标表现不佳？（多选）',
    options: ['A. 忠实度 (Faithfulness)', 'B. 相关性 (Answer Relevancy)', 'C. 知识时效性 (Knowledge Timeliness)', 'D. API 延迟 (API Latency)'],
    answer: ['B', 'C'],
    points: 1,
  },
  {
    type: 'checkbox',
    question: '作为技术负责人，选择大模型技术路线时，哪些思路是正确的？（多选）',
    options: ['A. 无论何时都选最贵的API', 'B. 涉及隐私数据，优先考虑私有化部署开源模型', 'C. PoC阶段，使用成熟API通常成本效益最高', 'D. Token成本是唯一要关心的'],
    answer: ['B', 'C'],
    points: 1,
  },
  {
    type: 'textarea',
    question: '请简述为研发团队打造的超级助手（能回答私有代码问题，并能自动创建Jira工单）应该如何设计，并说明用到了哪些架构模式。',
    id: 'shortAnswer',
    points: 2, // 主观题2分
  },
];

export const totalPoints = quizData.reduce((sum, q) => sum + q.points, 0);

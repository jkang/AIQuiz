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
  // 1) 四个子场景判别：恰好两个更适合生成式AI（LLM）
  {
    type: 'radio',
    question:
      '以下四个子场景，请判断各自更适合“判别式AI（传统ML/分类回归等）”还是“生成式AI（LLM）”。\n' +
      '① 根据过去12个月行为预测客户是否会流失\n' +
      '② 为即将流失客户生成一封符合品牌话术的慰留邮件\n' +
      '③ 实时识别异常订单并触发风控拦截\n' +
      '④ 从客户长文本反馈中识别导致其不再使用本产品的主要原因\n' +
      '哪一组匹配最合理？',
    options: [
      'A. ①判别 ②生成 ③判别 ④生成',
      'B. ①生成 ②判别 ③判别 ④生成',
      'C. ①判别 ②生成 ③判别 ④判别',
      'D. ①生成 ②生成 ③生成 ④判别'
    ],
    answer: 'A',
    points: 1,
  },

  // 2) 课堂“政策中心”场景：性价比最高的方案
  {
    type: 'radio',
    question:
      '公司准备上线一个基于大语言模型（LLM）的客服机器人，要求它能用“政策中心”的最新条款给客户做“实时、可溯源”的答复，并且“上线快、后期维护成本低”。在政策内容会不定期更新（今天改、明天生效）的前提下，哪种方案最具性价比、最能满足这些诉求？',
    options: [
      'A. 在公司政策数据上从零开始重新训练一个专用 LLM，让模型把条款都“记住”。',
      'B. 直接在公司政策数据上做全量微调（Fine-tuning），以固化知识与风格。',
      'C. 实施检索增强生成（RAG）：对用户问题进行向量检索匹配最新条款，答案中强制携带可点击来源引用并按上下文响应。',
      'D. 先对公司政策进行额外预训练并做数据增强（DA），扩大模型对条款的“记忆范围”。'
    ],
    answer: 'C',
    points: 1,
  },

  // 3) 会话成本治理（多维度降本）
  {
    type: 'checkbox',
    question:
      '销售助手长期会话导致输入 Token 成本飙升但质量无明显改善。以下哪些做法能显著降本且对质量影响最小？（多选）',
    options: [
      'A. 对历史对话做会话摘要（Memory Compression），仅保留关键事实',
      'B. 使用函数调用（Function Calling）以结构化参数代替长文本上下文',
      'C. 直接把上下文窗口从 128k 升到 1M',
      'D. 引入响应缓存（Prompt+结果缓存）复用高频问答'
    ],
    answer: ['A', 'B', 'D'],
    points: 1,
  },

  // 4) 应用场景化的“大模型 + 小模型”协同选型
  {
    type: 'checkbox',
    question:
      '场景：码头现场需要手机拍照做“集装箱残损识别”，并自动生成一段中文解释邮件发给客户。网络不稳、对隐私有要求、端侧算力有限，但希望解释文字专业、格式统一。\n' +
      '在此场景中，需要考虑多模型协同，请问以下哪些组合更合理？（多选）',
    options: [
      'A. 端侧轻量视觉模型（量化/蒸馏 CNN/ViT）完成缺陷检测 + 云端 LLM 负责中文说明与格式化文案',
      'B. 仅使用大型多模态 LLM 在端侧全量推理',
      'C. 规则引擎 + 关键词模板，无需模型',
      'D. 端侧轻量视觉模型 + 本地小型语言模型生成草稿 + RAG 注入术语表，复杂样本再回传云端强模型复核'
    ],
    answer: ['A', 'D'],
    points: 1,
  },

  // 5) 预训练 vs 后训练：落地决策（有数据条件）
  {
    type: 'radio',
    question:
      '场景：你已整理 1,200 条高质量客服对话范例与品牌话术规范，目标是在多渠道中“长期保持同一语气与结构”，并在 6–8 周内稳定上线。\n' +
      '为了让模型更会遵循话术与格式、拒答越权，最合适的技术路径是？',
    options: [
      'A. 扩大预训练语料（Pre-training）以提升通用能力',
      'B. 微调模型固化语气与拒答策略 + 系统提示模板 + 规则/校验器',
      'C. 只用 RAG 将话术文档接入，无需训练',
      'D. 仅把 Temperature 调低并增加 Few-shot 示例'
    ],
    answer: 'B',
    points: 1,
  },

  // 6) 边缘部署/隐私/鲁棒性（端云协同）
  {
    type: 'checkbox',
    question:
      '要在港区边缘设备上部署“图像残损识别 + 中文解释”的轻量方案，网络不稳定且有隐私要求。以下哪些是更合理的选型/部署考量？（多选）',
    options: [
      'A. 优先选择可本地推理的开源轻量多模态/视觉模型（量化/蒸馏）',
      'B. 结合端侧模型进行初筛，复杂样本回传云端强模型复核（边云协同）',
      'C. 只看准确率，不需要评估 P95 延迟与掉线重试策略',
      'D. 本地合规存储与脱敏，评估端侧故障回退路径'
    ],
    answer: ['A', 'B', 'D'],
    points: 1,
  },

  // 7) Prompt 路径：快速增益且可评估
  {
    type: 'radio',
    question:
      '一周内要把“报关单填写建议”的回复一致性提升，且暂时拿不到内部系统接口。最现实的提升手段是？',
    options: [
      'A. 设计系统提示 + Few-shot 示例 + 严格输出模板，并建立提示版本管理与 A/B 评估',
      'B. 直接做模型微调（Fine-tuning）',
      'C. 先上多 Agent 协作框架',
      'D. 更换到更大上下文模型以容纳更多历史对话'
    ],
    answer: 'A',
    points: 1,
  },

  // 8) RAG 应用题：版本与权限“双保险”
  {
    type: 'checkbox',
    question:
      '场景：上午 8:00 发布《东南亚航线附加费（Surcharge）v5》，生效时间为今天 12:00；旧版 v4 标记为“将被替代”。11:30 销售同事在移动端询问：“今天起订舱是否已包含新附加费？”助手仍返回 v4 的条款；同时，不同事业部的同事在答复里看到了对方事业部不应可见的条款。为在本周内显著提升可用性与合规，你会首批补齐哪些设计？（多选）',
    options: [
      'A. 检索阶段引入基于用户/组/事业部/区域的 ACL/ABAC 过滤；答案渲染前二次校验权限，禁止仅由前端控制',
      'B. 事件驱动的增量同步：Confluence/Webhook 监听→向量库 Upsert/软删除；为文档打上有效期与替代关系（effective_from、expires_at、supersedes/superseded_by），检索时做“时间感知”过滤',
      'C. 缓存隔离：检索与答案缓存的 key 必须包含 userId、roles、tenant/事业部、doc_version；命中新版本/生效点时主动失效旧缓存',
      'D. 混合检索（BM25+向量）+ Cross-Encoder 重排，并在检索器层增加 Freshness/Version 优先级；答案中强制展示带版本与生效时间锚点的引用',
      'E. 仅把 TopK 从 3 提到 15，自然能覆盖到最新条款',
      'F. 立刻对基础模型做一次微调把 v5 写进参数，这样就不会返回 v4 了'
    ],
    answer: ['A', 'B', 'C', 'D'],
    points: 1,
  },

  // 9) Agent 设计：工具链与鲁棒性
  {
    type: 'radio',
    question:
      '订舱智能体需要“查询船期 → 比价 → 下单 → 异常回滚”。为了更稳健，首要的设计要点是？',
    options: [
      'A. 仅在提示里描述步骤即可',
      'B. 使用具备计划与工具调用的 Agent 工作流，并加入参数校验、重试/幂等、超时与回滚策略',
      'C. 增大上下文窗口，保证记住所有步骤',
      'D. 把 Temperature 调到 0 以减少错误'
    ],
    answer: 'B',
    points: 1,
  },

  // 10) 端到端方案甄选（从需求到SLA）
  {
    type: 'radio',
    question:
      '为企业级“客户运营助手”选择更可落地的端到端方案（输入如：“查询 #ABC123 的最新到港并估算滞期费，画 7 日费用趋势图并发邮件给客户”）。以下哪一项最完整且工程可控？',
    options: [
      'A. 仅用提示工程，让模型在对话里一步步完成所有动作',
      'B. RAG + 单一Chat：检索费率与到港信息并让模型自由发挥生成并发送邮件',
      'C. 基于Agent的工作流：意图识别→工具路由；调用船期/费率/报表/邮件API；RAG(带ACL)检索政策并强制引用；失败时超时/重试/回滚；监控P95延迟、工具成功率与答案可溯源率',
      'D. 先做大规模微调，把所有业务流程固化到模型里，再逐步接API'
    ],
    answer: 'C',
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

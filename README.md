# AI 测验应用

这是一个基于 Next.js 开发的 AI 测验应用，支持单选题、多选题和简答题，并集成了 AI 自动评分功能。

## 🚀 快速开始

### 安装依赖
```bash
npm install
# 或
pnpm install
```

### 启动开发服务器
```bash
npm run dev
# 或
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
npm run build
npm start
```

## 📝 如何修改测试题目

所有的测试题目都存储在 `lib/questions.ts` 文件中。你可以通过编辑这个文件来添加、修改或删除题目。

### 题目数据结构

每个题目都是一个 `Question` 对象，包含以下字段：

```typescript
interface Question {
  type: 'radio' | 'checkbox' | 'textarea';  // 题目类型
  question: string;                          // 题目内容
  options?: string[];                        // 选项（单选题和多选题需要）
  answer?: string | string[];                // 正确答案
  id?: string;                              // 题目ID（可选）
  points: number;                           // 分值
}
```

### 题目类型说明

#### 1. 单选题 (radio)
```typescript
{
  type: 'radio',
  question: '与传统软件开发的"确定性"不同，大语言模型（LLM）驱动的应用开发，其核心特点是？',
  options: ['A. 概率性', 'B. 绝对性', 'C. 机械性'],
  answer: 'A',
  points: 1,
}
```

**说明：**
- `type`: 必须是 `'radio'`
- `options`: 选项数组，通常以 A、B、C、D 开头
- `answer`: 正确答案，对应选项中的一个（如 'A'、'B' 等）
- `points`: 题目分值

#### 2. 多选题 (checkbox)
```typescript
{
  type: 'checkbox',
  question: 'RAG 系统回答了去年的年假天数。这个问题主要反映了哪些指标表现不佳？（多选）',
  options: ['A. 忠实度 (Faithfulness)', 'B. 相关性 (Answer Relevancy)', 'C. 知识时效性 (Knowledge Timeliness)', 'D. API 延迟 (API Latency)'],
  answer: ['B', 'C'],
  points: 1,
}
```

**说明：**
- `type`: 必须是 `'checkbox'`
- `options`: 选项数组
- `answer`: 正确答案数组，包含多个正确选项（如 ['B', 'C']）
- 建议在题目中标注"（多选）"

#### 3. 简答题 (textarea)
```typescript
{
  type: 'textarea',
  question: '请简述为研发团队打造的超级助手（能回答私有代码问题，并能自动创建Jira工单）应该如何设计，并说明用到了哪些架构模式。',
  id: 'shortAnswer',
  points: 2,
}
```

**说明：**
- `type`: 必须是 `'textarea'`
- 不需要 `options` 和 `answer` 字段
- `id`: 可选，用于标识特定题目
- 简答题通常分值较高，由 AI 自动评分

### 添加新题目

1. 打开 `lib/questions.ts` 文件
2. 在 `quizData` 数组中添加新的题目对象
3. 确保遵循上述数据结构
4. 保存文件

**示例：添加一道新的单选题**
```typescript
export const quizData: Question[] = [
  // ... 现有题目
  {
    type: 'radio',
    question: '你的新题目内容？',
    options: ['A. 选项1', 'B. 选项2', 'C. 选项3', 'D. 选项4'],
    answer: 'A',
    points: 1,
  },
];
```

### 修改现有题目

直接编辑 `quizData` 数组中对应的题目对象即可。

### 删除题目

从 `quizData` 数组中删除对应的题目对象。

### 注意事项

- 修改题目后，总分会自动重新计算（通过 `totalPoints` 变量）
- 确保单选题和多选题的 `answer` 字段与 `options` 中的选项对应
- 简答题由 AI 自动评分，不需要设置标准答案
- 建议在多选题的题目中明确标注"（多选）"

## 📁 项目结构

```
├── app/                    # Next.js 应用目录
│   ├── api/               # API 路由
│   ├── admin/             # 管理员页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── ui/               # UI 组件库
│   └── ...
├── lib/                   # 工具库
│   ├── questions.ts      # 📝 题目数据（重要！）
│   ├── prompt.ts         # AI 提示词
│   └── utils.ts          # 工具函数
├── docs/                  # 文档
├── public/               # 静态资源
└── types/                # TypeScript 类型定义
```

### 重要文件说明

- **`lib/questions.ts`** - 存储所有测试题目，这是你需要经常修改的文件
- **`app/page.tsx`** - 测验的主页面
- **`app/api/submit/route.ts`** - 处理测验提交的 API
- **`app/admin/page.tsx`** - 管理员查看测验结果的页面

## 🔧 其他功能

- **管理员页面**: 访问 `/admin` 查看所有测验记录
- **Google Sheets 集成**: 自动保存测验结果到 Google Sheets
- **AI 评分**: 简答题自动 AI 评分和反馈
- **数据导出**: 支持 CSV 格式导出测验数据

更多详细配置请参考 `README-GOOGLE-SHEETS.md` 文件。

## 📞 技术支持

如果在修改题目过程中遇到问题，请检查：

1. 题目格式是否正确
2. 数据类型是否匹配
3. 语法是否有错误
4. 浏览器控制台是否有报错信息

修改完成后，刷新页面即可看到更新的题目。
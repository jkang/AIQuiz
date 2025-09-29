# DeepSeek API 调用复用指南

本文档提取了当前应用中 DeepSeek API 调用的核心代码和配置，方便在其他应用中复用。

## 🚨 安全警告

> **⚠️ API 密钥安全提醒**
>
> - **绝对不要**在代码中硬编码 API 密钥
> - **绝对不要**将 API 密钥提交到 Git 仓库
> - **必须**使用环境变量存储 API 密钥
> - **必须**将 `.env` 文件添加到 `.gitignore`

## ⚠️ 重要说明

**这些代码主要用于服务端调用**，因为：

1. **API 密钥安全**: DeepSeek API 密钥不应该暴露在客户端代码中
2. **CORS 限制**: 浏览器环境下直接调用 DeepSeek API 会遇到跨域问题
3. **安全性**: 服务端调用可以更好地控制访问权限和使用量

### 推荐架构

```
客户端 (React/Vue/Angular)
    ↓ HTTP 请求
服务端 API (Node.js/Python/Java等)
    ↓ 调用 DeepSeek API
DeepSeek 官方服务器
```

### 适用场景

- ✅ **Node.js 服务端应用**
- ✅ **Next.js API Routes**
- ✅ **Express.js 后端服务**
- ✅ **Serverless 函数** (Vercel/Netlify/AWS Lambda)
- ❌ **浏览器客户端直接调用** (不推荐)

## 核心类型定义

```typescript
// API 响应通用接口
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// DeepSeek API 请求接口
export interface DeepSeekRequest {
  model: string;
  messages: {
    role: string;
    content: string;
  }[];
  temperature: number;
  max_tokens: number;
  stream?: boolean;
}

// DeepSeek API 响应接口
export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type?: string;
    code?: string;
  };
}

// 模型类型枚举
export enum ModelType {
  DEEPSEEK = "deepseek",
  GEMINI = "gemini",
  KIMI = "kimi",
}
```

## 配置设置

```typescript
// DeepSeek API 配置
export const DEEPSEEK_CONFIG = {
  model: "deepseek-chat",
  // 🔗 DeepSeek 官方 API 端点 - 仅限服务端调用
  endpoint: "https://api.deepseek.com/v1/chat/completions",
  temperature: 0.5,
  timeout: 150000, // 2.5分钟
  maxOutputTokens: 8192, // 最大输出token数
  retry: {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 16000,
  },
  // API Key 申请地址
  apiKeyUrl: "https://platform.deepseek.com",
  description: "DeepSeek 官方平台",
};

// 🌐 API 端点说明
/*
DeepSeek API 端点信息：
- 官方端点: https://api.deepseek.com/v1/chat/completions
- 协议: HTTPS
- 方法: POST
- 认证: Bearer Token (API Key)
- 内容类型: application/json

⚠️ 注意事项:
1. 此端点仅支持服务端调用
2. 需要有效的 API Key 进行认证
3. 请求需要包含正确的 Headers
4. 支持普通调用和流式调用 (stream: true/false)
*/
```

## 工具函数

```typescript
/**
 * 通用的异步请求重试函数
 * @param operation 需要执行的异步操作
 * @param maxRetries 最大重试次数
 * @param initialDelay 初始延迟时间(毫秒)
 * @param onRetry 每次重试时的回调函数
 * @returns 异步操作的结果
 */
export async function retryRequest<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  initialDelay = 1000,
  onRetry?: (attempt: number, error: Error) => void,
): Promise<T> {
  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 检查是否是超时错误，如果是则立即抛出不再重试
      if (
        lastError.name === "TimeoutError" ||
        lastError.name === "AbortError" ||
        lastError.message.includes("timeout") ||
        lastError.message.includes("FUNCTION_INVOCATION_TIMEOUT") ||
        lastError.message.includes("EDGE_FUNCTION_INVOCATION_TIMEOUT")
      ) {
        throw lastError;
      }

      // 对于并发限制错误，如果已经重试过一次，就不再重试
      if (
        attempt > 0 &&
        (lastError.message.includes("并发请求过多") ||
         lastError.message.includes("max organization concurrency") ||
         lastError.message.includes("429"))
      ) {
        console.log(`[Retry] 并发限制错误已重试过，停止重试以避免耗尽 RPM 额度`);
        throw lastError;
      }

      // 如果已经达到最大重试次数，则抛出最后一个错误
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 调用重试回调函数
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // 针对并发限制错误，使用更长的延迟
      let retryDelay = delay;
      if (lastError.message.includes('并发请求过多') || lastError.message.includes('max organization concurrency')) {
        retryDelay = Math.max(delay, 2000);
        console.log(`[Retry] 检测到并发限制，使用延长延迟: ${retryDelay}ms`);
      }

      // 等待一段时间后重试，使用指数退避策略
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
      delay = Math.min(delay * 2, 30000); // 最大延迟30秒
    }
  }

  throw lastError!;
}

/**
 * 检测文本是否主要是中文
 * @param text 文本
 * @returns 是否为中文文本
 */
export function isChineseText(text: string): boolean {
  const chineseRegex = /[\u4e00-\u9fa5]/g;
  const chineseMatches = text.match(chineseRegex) || [];
  const chineseCharCount = chineseMatches.length;
  const totalCharCount = text.replace(/\s/g, "").length;
  return totalCharCount > 0 && (chineseCharCount / totalCharCount) > 0.15;
}

/**
 * 验证API密钥格式
 * @param apiKey API密钥
 * @param modelType 模型类型
 * @returns 是否有效
 */
export function validateApiKey(apiKey: string, modelType: string): boolean {
  if (!apiKey) return false;

  if (modelType === "deepseek") {
    return apiKey.startsWith("sk-") && apiKey.length > 20;
  }

  return false;
}
```

## 核心 API 调用函数

```typescript
/**
 * 调用 DeepSeek API（普通调用）
 * @param messages 消息数组
 * @param apiKey API密钥
 * @param options 可选参数
 * @returns API响应
 */
export async function callDeepSeekApi(
  messages: { role: string; content: string }[],
  apiKey: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
  } = {}
): Promise<ApiResponse<DeepSeekResponse>> {
  const config = DEEPSEEK_CONFIG;
  const startTime = Date.now();

  // 构建请求体
  const requestBody: DeepSeekRequest = {
    model: options.model || config.model,
    messages,
    temperature: options.temperature || config.temperature,
    max_tokens: Math.min(options.maxTokens || config.maxOutputTokens, 20000),
  };

  return await retryRequest(
    async () => {
      if (!apiKey) {
        throw new Error(`无法获取有效的 DeepSeek API密钥`);
      }

      console.log(`[DeepSeek] API 开始调用`);

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(options.timeout || config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed with status: ${response.status}. ${errorData.error?.message || ""}`);
      }

      const data: DeepSeekResponse = await response.json();

      if (data.error) {
        throw new Error(`API 返回错误: ${data.error.message}`);
      }

      const duration = Date.now() - startTime;
      console.log(`[DeepSeek] API 调用成功，耗时: ${duration}ms`);

      return {
        success: true,
        data,
      };
    },
    config.retry.maxRetries,
    config.retry.initialDelay,
    (attempt, error) => {
      console.log(`[DeepSeek] 重试第 ${attempt} 次，错误:`, error.message);
    }
  );
}

/**
 * 调用 DeepSeek API（流式调用）
 * @param messages 消息数组
 * @param apiKey API密钥
 * @param onChunk 接收流式数据的回调函数
 * @param options 可选参数
 * @returns API响应
 */
export async function callDeepSeekApiStream(
  messages: { role: string; content: string }[],
  apiKey: string,
  onChunk: (chunk: string) => void,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
  } = {}
): Promise<ApiResponse<{ content: string }>> {
  const config = DEEPSEEK_CONFIG;
  const startTime = Date.now();

  // 构建请求体
  const requestBody: DeepSeekRequest = {
    model: options.model || config.model,
    messages,
    temperature: options.temperature || config.temperature,
    max_tokens: options.maxTokens || config.maxOutputTokens,
    stream: true
  };

  return await retryRequest(
    async () => {
      if (!apiKey) {
        throw new Error(`无法获取有效的 DeepSeek API密钥`);
      }

      console.log(`[DeepSeek] 流式 API 开始调用`);

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(options.timeout || config.timeout),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API request failed with status: ${response.status}. ${errorData.error?.message || ""}`);
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';

                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
              } catch (parseError) {
                console.log('[DeepSeek] 解析流式数据失败:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      const duration = Date.now() - startTime;
      console.log(`[DeepSeek] 流式 API 调用成功，耗时: ${duration}ms，总内容长度: ${fullContent.length}`);

      return {
        success: true,
        data: { content: fullContent }
      };
    },
    config.retry.maxRetries,
    config.retry.initialDelay,
    (attempt, error) => {
      console.log(`[DeepSeek] 流式调用重试第 ${attempt} 次，错误:`, error.message);
    }
  );
}

## 服务端集成示例

### 1. Next.js API Route 示例

```typescript
// pages/api/chat.ts 或 app/api/chat/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { callDeepSeekApi } from '../../utils/deepseek-api-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    // ✅ 从环境变量安全获取 API 密钥
    const apiKey = getDeepSeekApiKey();

    const messages = [
      { role: 'user', content: message }
    ];

    const response = await callDeepSeekApi(messages, apiKey);

    if (response.success) {
      res.status(200).json({
        reply: response.data?.choices[0].message.content,
        usage: response.data?.usage
      });
    } else {
      res.status(500).json({ error: response.error });
    }
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
}
```

### 2. Express.js 服务端示例

```typescript
// server.js
import express from 'express';
import { callDeepSeekApi, callDeepSeekApiStream } from './utils/deepseek-api-utils';

const app = express();
app.use(express.json());

// 普通聊天接口
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.DEEPSEEK_API_KEY!;

    const messages = [
      { role: 'user', content: message }
    ];

    const response = await callDeepSeekApi(messages, apiKey);

    if (response.success) {
      res.json({
        reply: response.data?.choices[0].message.content,
        usage: response.data?.usage
      });
    } else {
      res.status(500).json({ error: response.error });
    }
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 流式聊天接口
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.DEEPSEEK_API_KEY!;

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    const messages = [
      { role: 'user', content: message }
    ];

    await callDeepSeekApiStream(
      messages,
      apiKey,
      (chunk) => {
        // 发送 SSE 数据
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    );

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: '服务器错误' })}\n\n`);
    res.end();
  }
});

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});
```

### 3. Serverless 函数示例 (Vercel)

```typescript
// api/chat.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { callDeepSeekApi } from '../utils/deepseek-api-utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    const apiKey = process.env.DEEPSEEK_API_KEY!;

    const messages = [
      { role: 'user', content: message }
    ];

    const response = await callDeepSeekApi(messages, apiKey);

    if (response.success) {
      return res.status(200).json({
        reply: response.data?.choices[0].message.content
      });
    } else {
      return res.status(500).json({ error: response.error });
    }
  } catch (error) {
    return res.status(500).json({ error: '服务器错误' });
  }
}
```

## 客户端调用示例

### React 客户端调用服务端 API

```typescript
// React 组件
import { useState } from 'react';

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    try {
      // 调用自己的服务端 API，而不是直接调用 DeepSeek
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      setReply(data.reply);
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="输入消息..."
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? '发送中...' : '发送'}
      </button>
      {reply && <div>AI 回复: {reply}</div>}
    </div>
  );
}
```

## 基本使用示例

```typescript
// 导入必要的函数和类型
import {
  callDeepSeekApi,
  callDeepSeekApiStream,
  DEEPSEEK_CONFIG,
  getDeepSeekApiKey,  // 安全获取 API 密钥的函数
  type DeepSeekResponse,
  type ApiResponse
} from './deepseek-api-utils';

// ✅ 正确方式：从环境变量获取 API 密钥
const API_KEY = getDeepSeekApiKey();

// ❌ 错误方式：硬编码 API 密钥（绝对不要这样做！）
// const API_KEY = 'sk-your-deepseek-api-key-here';

// 普通调用示例
async function simpleChat() {
  try {
    const messages = [
      { role: 'system', content: '你是一个有帮助的助手' },
      { role: 'user', content: '请介绍一下人工智能' }
    ];

    const response = await callDeepSeekApi(messages, API_KEY);

    if (response.success && response.data) {
      console.log('AI 回复:', response.data.choices[0].message.content);
      console.log('Token 使用:', response.data.usage);
    } else {
      console.error('调用失败:', response.error);
    }
  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 流式调用示例
async function streamChat() {
  try {
    const messages = [
      { role: 'user', content: '请详细解释量子计算的原理' }
    ];

    const response = await callDeepSeekApiStream(
      messages,
      API_KEY,
      (chunk) => {
        // 实时接收并处理每个文本片段
        process.stdout.write(chunk);
      }
    );

    if (response.success) {
      console.log('\n\n完整内容长度:', response.data?.content.length);
    }
  } catch (error) {
    console.error('流式调用失败:', error);
  }
}
```

### 2. 自定义配置

```typescript
// 使用自定义参数
const customResponse = await callDeepSeekApi(
  messages,
  API_KEY,
  {
    model: 'deepseek-chat',
    temperature: 0.7,        // 更高的创造性
    maxTokens: 4096,         // 限制输出长度
    timeout: 60000           // 1分钟超时
  }
);
```

### 3. 错误处理

```typescript
import { validateApiKey } from './deepseek-api-utils';

async function robustChat(userInput: string, apiKey: string) {
  // 验证 API 密钥格式
  if (!validateApiKey(apiKey, 'deepseek')) {
    throw new Error('API 密钥格式无效');
  }

  try {
    const messages = [
      { role: 'user', content: userInput }
    ];

    const response = await callDeepSeekApi(messages, apiKey);

    if (!response.success) {
      // 根据错误类型进行不同处理
      if (response.error?.includes('API key')) {
        throw new Error('API 密钥无效，请检查密钥是否正确');
      } else if (response.error?.includes('timeout')) {
        throw new Error('请求超时，请稍后重试');
      } else {
        throw new Error(`API 调用失败: ${response.error}`);
      }
    }

    return response.data?.choices[0].message.content || '';
  } catch (error) {
    console.error('聊天调用失败:', error);
    throw error;
  }
}
```

## 🔐 环境变量配置（重要！）

### 为什么必须使用环境变量？

1. **安全性**: API 密钥不会被提交到代码仓库
2. **灵活性**: 不同环境（开发/测试/生产）可以使用不同的密钥
3. **合规性**: 符合安全开发规范
4. **团队协作**: 每个开发者可以使用自己的密钥

### 环境变量设置

```bash
# .env 文件（添加到 .gitignore 中）
DEEPSEEK_API_KEY=sk-your-actual-api-key-here

# 可选的备用环境变量名
DEEPSEEK_TOKEN=sk-your-actual-api-key-here
```

```bash
# .env.example 文件（可以提交到代码仓库）
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_TOKEN=sk-your-api-key-here
```

```bash
# .gitignore 文件（确保环境变量文件不被提交）
.env
.env.local
.env.production
.env.development
```

### 不同环境的配置

```bash
# 开发环境 (.env.development)
DEEPSEEK_API_KEY=sk-dev-api-key-here

# 生产环境 (.env.production)
DEEPSEEK_API_KEY=sk-prod-api-key-here

# 测试环境 (.env.test)
DEEPSEEK_API_KEY=sk-test-api-key-here
```

### 代码中安全获取 API 密钥

```typescript
// utils/api-key-manager.ts
/**
 * 安全地从环境变量获取 API 密钥
 * @returns API 密钥
 * @throws 如果未找到密钥则抛出错误
 */
export const getDeepSeekApiKey = (): string => {
  // 尝试多个可能的环境变量名
  const apiKey = process.env.DEEPSEEK_TOKEN ||

  if (!apiKey) {
    throw new Error(
      '❌ 未找到 DeepSeek API 密钥！\n' +
      '请设置以下环境变量之一：\n' +
      '- DEEPSEEK_API_KEY\n' +
      '- DEEPSEEK_TOKEN\n' +
      '- DEEPSEEK_API_TOKEN'
    );
  }

  // 验证密钥格式
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    throw new Error('❌ DeepSeek API 密钥格式无效！密钥应该以 "sk-" 开头');
  }

  return apiKey;
};

// 使用示例
try {
  const apiKey = getDeepSeekApiKey();
  const response = await callDeepSeekApi(messages, apiKey);
} catch (error) {
  console.error('API 密钥错误:', error.message);
}
```

## 注意事项

### 🔒 安全性（重要！）

1. **API 密钥安全**:
   - ❌ **绝对不要**在代码中硬编码 API 密钥
   - ❌ **绝对不要**将 API 密钥提交到 Git 仓库
   - ❌ **绝对不要**在客户端代码中暴露 API 密钥
   - ✅ **必须**使用环境变量存储 API 密钥
   - ✅ **必须**将 .env 文件添加到 .gitignore
   - ✅ **必须**在服务端处理所有 DeepSeek API 调用
   - ✅ 定期轮换 API 密钥
   - ✅ 为不同环境使用不同的 API 密钥

2. **服务端架构**:
   - ✅ 客户端 → 自己的服务端 API → DeepSeek API
   - ❌ 客户端直接调用 DeepSeek API
   - ✅ 在服务端实现访问控制和用量限制

3. **速率限制**:
   - DeepSeek API 有请求频率限制
   - 实现适当的请求间隔和队列机制
   - 处理 429 错误码并实现退避策略

4. **性能优化**:
   - 合理设置 `max_tokens` 参数
   - 使用流式调用提升用户体验
   - 实现请求缓存机制
   - 考虑实现连接池

### 🛠️ 错误处理

7. **错误处理**:
   - 实现重试机制（已包含在代码中）
   - 区分不同类型的错误（网络、认证、限流等）
   - 记录详细的错误日志
   - 向客户端返回友好的错误信息

## API 密钥申请

访问 [DeepSeek 官方平台](https://platform.deepseek.com) 注册账号并获取 API 密钥。

## 相关链接

- [DeepSeek API 文档](https://platform.deepseek.com/api-docs)
- [DeepSeek 官方网站](https://www.deepseek.com)
- [API 密钥管理](https://platform.deepseek.com/api_keys)
```

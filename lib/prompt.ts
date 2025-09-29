export function buildPrompt(
    userAnswer: string
)
: string {
  return `你是一名AI助教，请根据以下评分标准为一个关于AI架构设计的简答题打分。满分为2分。
      
      评分标准：
      - 2分 (优秀): 答案清晰、结构合理，并且明确提到了“RAG”用于解决私有知识问答，“Agent”用于调用外部工具（如Jira API）。
      - 1分 (及格): 答案提到了RAG或Agent其中之一，并基本描述了其作用，但不够完整或清晰。
      - 0分 (不及格): 答案完全错误，或者没有提到RAG或Agent的核心概念。

      用户的答案是：
      "${userAnswer}"

      请根据以上标准，返回一个JSON对象，包含两个字段：
      1. "score": 一个数字，只能是 0, 1, 或 2。
      2. "feedback": 一句简短的中文反馈，解释打分原因。

      你的输出必须是严格的JSON格式，不要包含任何其他说明文字。`;
}
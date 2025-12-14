import { NextRequest, NextResponse } from 'next/server';
import { quizData, totalPoints, questionGroups, groupPoints } from '../../../lib/questions';
import { buildPrompt } from '../../../lib/prompt';

// 定义请求体类型
interface SubmitRequest {
  userName: string;
  answers: {
    questionIndex: number;
    answer: string | string[];
  }[];
}

// 定义AI评估响应类型
interface AIEvaluationResponse {
  score: number;
  feedback: string;
}

// 定义API响应类型
interface SubmitResponse {
  score: number;
  totalPoints: number;
  resultText: string;
  wrongAnswers: {
    question: string;
    correctAnswer: string;
  }[];
  shortAnswerFeedback: string;
  groupScores?: {
    groupId: string;
    title: string;
    score: number;
    totalPoints: number;
    resultText: string;
  }[];
}

// 调用AI进行简答题评估
async function evaluateShortAnswer(userAnswer: string): Promise<AIEvaluationResponse> {
  try {
    const prompt = buildPrompt(userAnswer);

    // 使用 DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_TOKEN}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // 解析AI返回的JSON
    const evaluation: AIEvaluationResponse = JSON.parse(aiResponse);
    return evaluation;

  } catch (error) {
    console.error('AI evaluation error:', error);
    // 如果AI评估失败，返回默认评分
    return {
      score: 1,
      feedback: '评估系统暂时不可用，给予基础分数。'
    };
  }
}

// 计算客观题得分
function calculateObjectiveScore(answers: SubmitRequest['answers']): {
  score: number;
  wrongAnswers: { question: string; correctAnswer: string; }[];
} {
  let score = 0;
  const wrongAnswers: { question: string; correctAnswer: string; }[] = [];

  answers.forEach(({ questionIndex, answer }) => {
    const question = quizData[questionIndex];
    if (!question || question.type === 'textarea') return;

    const correctAnswer = question.answer;
    let isCorrect = false;

    if (question.type === 'radio') {
      isCorrect = answer === correctAnswer;
    } else if (question.type === 'checkbox') {
      const userAnswers = Array.isArray(answer) ? answer.sort() : [answer].sort();
      const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer].sort();
      isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
    }

    if (isCorrect) {
      score += question.points;
    } else {
      wrongAnswers.push({
        question: question.question,
        correctAnswer: Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer
      });
    }
  });

  return { score, wrongAnswers };
}

// 根据总分确定结果等级
function getResultText(totalScore: number, maxPoints: number): string {
  const percentage = (totalScore / maxPoints) * 100;

  if (percentage >= 80) {
    return '优秀 ✨';
  } else if (percentage >= 60) {
    return '通过 👍';
  } else {
    return '不通过 🔴';
  }
}

// 计算各组得分
function calculateGroupScores(answers: SubmitRequest['answers']): {
  groupId: string;
  title: string;
  score: number;
  totalPoints: number;
  resultText: string;
}[] {
  const groupScores = [];
  let currentIndex = 0;

  for (const group of questionGroups) {
    let groupScore = 0;
    const groupTotalPoints = group.questions.reduce((sum, q) => sum + q.points, 0);

    // 计算该组的得分
    for (let i = 0; i < group.questions.length; i++) {
      const questionIndex = currentIndex + i;
      const question = group.questions[i];
      const answerData = answers.find(a => a.questionIndex === questionIndex);

      if (!answerData || question.type === 'textarea') {
        // 简答题的分数会在后面单独计算
        continue;
      }

      const correctAnswer = question.answer;
      let isCorrect = false;

      if (question.type === 'radio') {
        isCorrect = answerData.answer === correctAnswer;
      } else if (question.type === 'checkbox') {
        const userAnswers = Array.isArray(answerData.answer) ? answerData.answer.sort() : [answerData.answer].sort();
        const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer.sort() : [correctAnswer].sort();
        isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
      }

      if (isCorrect) {
        groupScore += question.points;
      }
    }

    groupScores.push({
      groupId: group.id,
      title: group.title,
      score: groupScore,
      totalPoints: groupTotalPoints,
      resultText: getResultText(groupScore, groupTotalPoints),
    });

    currentIndex += group.questions.length;
  }

  return groupScores;
}

// 根据各组结果确定最终结果（两组都通过才通过，两组都优秀才优秀）
function getFinalResultText(groupScores: { resultText: string }[]): string {
  const allExcellent = groupScores.every(g => g.resultText === '优秀 ✨');
  const allPassed = groupScores.every(g => g.resultText === '优秀 ✨' || g.resultText === '通过 👍');

  if (allExcellent) {
    return '优秀 ✨';
  } else if (allPassed) {
    return '通过 👍';
  } else {
    return '不通过 🔴';
  }
}

// 保存结果到 Google Sheets
async function saveToGoogleSheets(data: {
  userName: string;
  score: number;
  totalPoints: number;
  resultText: string;
  objectiveScore: number;
  shortAnswerScore: number;
  shortAnswerFeedback: string;
  wrongAnswers: { question: string; correctAnswer: string; }[];
  rawAnswers: SubmitRequest['answers'];
}): Promise<void> {
  try {
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const adminToken = process.env.ADMIN_TOKEN;

    console.log('🔍 Attempting to save to Google Sheets...');
    console.log('📊 Data to save:', {
      userName: data.userName,
      score: data.score,
      totalPoints: data.totalPoints,
      resultText: data.resultText
    });

    if (!webhookUrl) {
      console.error('❌ GOOGLE_SHEETS_WEBHOOK_URL not configured');
      return;
    }

    if (!adminToken) {
      console.error('❌ ADMIN_TOKEN not configured');
      return;
    }

    console.log('🔗 Webhook URL:', webhookUrl);
    console.log('🔑 Admin Token:', adminToken ? 'configured' : 'missing');

    const requestBody = JSON.stringify(data);
    console.log('📤 Request body size:', requestBody.length, 'characters');

    const response = await fetch(`${webhookUrl}?token=${adminToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google Sheets API error response:', errorText);
      throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Successfully saved to Google Sheets:', result);

  } catch (error) {
    console.error('💥 Failed to save to Google Sheets:', error);
    console.error('💥 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // 不抛出错误，避免影响用户体验
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const { userName, answers } = body;

    // 验证请求数据
    if (!userName || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: '请求数据格式错误' },
        { status: 400 }
      );
    }

    // 计算客观题得分
    const { score: objectiveScore, wrongAnswers } = calculateObjectiveScore(answers);

    // 计算各组得分（不包含简答题）
    let groupScores = calculateGroupScores(answers);

    // 处理所有简答题的AI评估
    let totalShortAnswerScore = 0;
    let allShortAnswerFeedback: string[] = [];

    for (let groupIndex = 0; groupIndex < questionGroups.length; groupIndex++) {
      const group = questionGroups[groupIndex];
      let groupStartIndex = 0;

      // 计算该组的起始索引
      for (let i = 0; i < groupIndex; i++) {
        groupStartIndex += questionGroups[i].questions.length;
      }

      // 找到该组的简答题
      for (let i = 0; i < group.questions.length; i++) {
        const question = group.questions[i];
        if (question.type === 'textarea') {
          const globalIndex = groupStartIndex + i;
          const answerData = answers.find(a => a.questionIndex === globalIndex);

          if (answerData && typeof answerData.answer === 'string') {
            const evaluation = await evaluateShortAnswer(answerData.answer);
            totalShortAnswerScore += evaluation.score;
            allShortAnswerFeedback.push(`【${group.title}】${evaluation.feedback}`);

            // 更新该组的得分
            groupScores[groupIndex].score += evaluation.score;
            groupScores[groupIndex].resultText = getResultText(
              groupScores[groupIndex].score,
              groupScores[groupIndex].totalPoints
            );
          }
        }
      }
    }

    // 计算总分
    const totalScore = objectiveScore + totalShortAnswerScore;

    // 根据各组结果确定最终结果
    const finalResultText = getFinalResultText(groupScores);

    // 准备响应数据
    const response: SubmitResponse = {
      score: totalScore,
      totalPoints,
      resultText: finalResultText,
      wrongAnswers,
      shortAnswerFeedback: allShortAnswerFeedback.join('\n\n'),
      groupScores: groupScores,
    };

    // 同步保存到 Google Sheets（确保在响应前完成，避免 Serverless 环境下任务被中断）
    await saveToGoogleSheets({
      userName,
      score: totalScore,
      totalPoints,
      resultText: finalResultText,
      objectiveScore,
      shortAnswerScore: totalShortAnswerScore,
      shortAnswerFeedback: allShortAnswerFeedback.join('\n\n'),
      wrongAnswers,
      rawAnswers: answers,
      groupScores: groupScores,
    } as any).catch(error => {
      console.error('Save to Google Sheets failed:', error);
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

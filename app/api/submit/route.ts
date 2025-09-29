import { NextRequest, NextResponse } from 'next/server';
import { quizData, totalPoints } from '../../../lib/questions';
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

    if (!webhookUrl || !adminToken) {
      console.warn('Google Sheets webhook not configured, skipping save');
      return;
    }

    const response = await fetch(`${webhookUrl}?token=${adminToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Successfully saved to Google Sheets:', result);

  } catch (error) {
    console.error('Failed to save to Google Sheets:', error);
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

    // 找到简答题答案
    const shortAnswerIndex = quizData.findIndex(q => q.type === 'textarea');
    const shortAnswerData = answers.find(a => a.questionIndex === shortAnswerIndex);
    
    let shortAnswerScore = 0;
    let shortAnswerFeedback = '';

    // 如果有简答题，进行AI评估
    if (shortAnswerData && typeof shortAnswerData.answer === 'string') {
      const evaluation = await evaluateShortAnswer(shortAnswerData.answer);
      shortAnswerScore = evaluation.score;
      shortAnswerFeedback = evaluation.feedback;
    }

    // 计算总分
    const totalScore = objectiveScore + shortAnswerScore;
    const resultText = getResultText(totalScore, totalPoints);

    // 准备响应数据
    const response: SubmitResponse = {
      score: totalScore,
      totalPoints,
      resultText,
      wrongAnswers,
      shortAnswerFeedback
    };

    // 异步保存到 Google Sheets（不阻塞响应）
    saveToGoogleSheets({
      userName,
      score: totalScore,
      totalPoints,
      resultText,
      objectiveScore,
      shortAnswerScore,
      shortAnswerFeedback,
      wrongAnswers,
      rawAnswers: answers
    }).catch(error => {
      console.error('Background save to Google Sheets failed:', error);
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

'use client';

import { useState } from 'react';
import { questionGroups, quizData } from '../lib/questions';
import type { Question } from '../lib/questions';
import {
  XCircle,
  CheckCircle,
  Award,
  User,
  Play,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  MessageSquare,
  AlertCircle,
  Layers,
  Circle,
  CheckSquare,
  FileText,
  Download
} from 'lucide-react';

// 定义API返回的结果类型
interface ResultData {
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

// 生成结果 HTML 并下载
function downloadResultAsHTML(resultData: ResultData, userName: string) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const scorePercentage = ((resultData.score / resultData.totalPoints) * 100).toFixed(1);

  // 根据结果类型确定颜色
  let resultColor = '#000';
  let resultBgColor = '#f3f4f6';
  if (resultData.resultText.includes('不通过')) {
    resultColor = '#dc2626';
    resultBgColor = '#fef2f2';
  } else if (resultData.resultText.includes('通过')) {
    resultColor = '#16a34a';
    resultBgColor = '#f0fdf4';
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${userName} 的测验结果 - AI Quiz</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 20px; color: #111; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header .time { color: #6b7280; font-size: 14px; }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .result-badge { display: inline-block; padding: 8px 24px; border-radius: 6px; font-weight: bold; font-size: 18px; background: ${resultBgColor}; color: ${resultColor}; border: 2px solid ${resultColor}; }
    .score-section { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 24px 0; }
    .score-main { font-size: 48px; font-weight: bold; }
    .score-total { font-size: 32px; color: #6b7280; }
    .progress-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 16px 0; }
    .progress-fill { height: 100%; background: ${resultColor}; border-radius: 4px; }
    .percentage { text-align: center; color: #6b7280; font-size: 14px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .group-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .group-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
    .group-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .group-title { font-weight: 600; }
    .group-badge { font-size: 12px; padding: 4px 8px; border-radius: 4px; }
    .wrong-item { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin-bottom: 8px; border-radius: 0 8px 8px 0; }
    .wrong-question { font-weight: 600; margin-bottom: 8px; }
    .wrong-answer { color: #16a34a; font-size: 14px; }
    .feedback-box { background: #f9fafb; border-left: 4px solid #000; padding: 16px; border-radius: 0 8px 8px 0; white-space: pre-wrap; line-height: 1.6; }
    .footer { text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${userName} 的测验结果</h1>
      <p class="time">保存时间：${timestamp}</p>
    </div>

    <div class="card" style="text-align: center;">
      <div class="result-badge">${resultData.resultText}</div>
      <div class="score-section">
        <span class="score-main">${resultData.score}</span>
        <span class="score-total">/ ${resultData.totalPoints}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${scorePercentage}%"></div>
      </div>
      <p class="percentage">正确率: ${scorePercentage}%</p>
    </div>

    ${resultData.groupScores && resultData.groupScores.length > 0 ? `
    <div class="card">
      <h3 class="section-title">📊 各组得分详情</h3>
      <div class="group-grid">
        ${resultData.groupScores.map(group => {
          const gPct = ((group.score / group.totalPoints) * 100).toFixed(1);
          let gColor = '#000';
          if (group.resultText.includes('不通过')) gColor = '#dc2626';
          else if (group.resultText.includes('通过') && !group.resultText.includes('优秀')) gColor = '#16a34a';
          return `
          <div class="group-card">
            <div class="group-header">
              <span class="group-title">${group.title}</span>
              <span class="group-badge" style="background: ${gColor}; color: white;">${group.resultText}</span>
            </div>
            <div style="font-size: 24px; font-weight: bold; margin: 8px 0;">${group.score} <span style="color: #6b7280; font-size: 16px;">/ ${group.totalPoints} 分</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${gPct}%; background: ${gColor};"></div></div>
            <p class="percentage">${gPct}%</p>
          </div>`;
        }).join('')}
      </div>
    </div>
    ` : ''}

    ${resultData.wrongAnswers.length > 0 ? `
    <div class="card">
      <h3 class="section-title" style="color: #dc2626;">❌ 错题解析</h3>
      ${resultData.wrongAnswers.map((item, idx) => `
        <div class="wrong-item">
          <div class="wrong-question">${idx + 1}. ${item.question}</div>
          <div class="wrong-answer">✓ 正确答案：${item.correctAnswer}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${resultData.shortAnswerFeedback ? `
    <div class="card">
      <h3 class="section-title">💬 AI 智能反馈</h3>
      <div class="feedback-box">${resultData.shortAnswerFeedback}</div>
    </div>
    ` : ''}

    <div class="footer">
      <p>AI Quiz 测验系统 | 本结果由系统自动生成</p>
    </div>
  </div>
</body>
</html>`;

  // 创建 Blob 并下载
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${userName}_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 结果展示组件
function ResultCard({ resultData, userName }: { resultData: ResultData; userName: string }) {
    let resultClass = '';
    let ResultIcon: React.ComponentType<{ className?: string }> | null = null;
    let iconColor = '';
    let badgeColor = '';
    let progressColor = '';
    let scorePercentage = (resultData.score / resultData.totalPoints) * 100;

    switch(resultData.resultText) {
        case '不通过 🔴':
            resultClass = 'bg-white border-red-600';
            ResultIcon = XCircle;
            iconColor = 'text-red-600';
            badgeColor = 'bg-red-600 text-white';
            progressColor = 'bg-red-600';
            break;
        case '通过 👍':
            resultClass = 'bg-white border-green-600';
            ResultIcon = CheckCircle;
            iconColor = 'text-green-600';
            badgeColor = 'bg-green-600 text-white';
            progressColor = 'bg-green-600';
            break;
        case '优秀 ✨':
            resultClass = 'bg-white border-black';
            ResultIcon = Award;
            iconColor = 'text-black';
            badgeColor = 'bg-black text-white';
            progressColor = 'bg-black';
            break;
    }

  return (
    <div className="animate-fade-in">
      {/* 主结果卡片 */}
      <div className={`p-8 rounded-lg border-2 shadow-sm ${resultClass}`}>
        {/* 结果标题 */}
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            {ResultIcon && <ResultIcon className={`w-16 h-16 ${iconColor}`} />}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            <span className="text-black">{userName}</span>
            <span className="text-gray-500 text-xl ml-2">的测验结果</span>
          </h2>
          <div className={`inline-block px-6 py-2 rounded-md ${badgeColor} font-bold text-xl`}>
            {resultData.resultText}
          </div>
        </div>

        {/* 分数展示 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-5xl font-extrabold font-mono text-black">
                {resultData.score}
              </div>
              <div className="text-sm text-gray-500 mt-1">获得分数</div>
            </div>
            <div className="text-3xl text-gray-400">/</div>
            <div className="text-center">
              <div className="text-4xl font-bold font-mono text-gray-600">
                {resultData.totalPoints}
              </div>
              <div className="text-sm text-gray-500 mt-1">总分</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${scorePercentage}%` }}
            ></div>
          </div>
          <div className="text-center mt-2 text-sm text-gray-600 font-medium">
            正确率: {scorePercentage.toFixed(1)}%
          </div>
        </div>

        {/* 分组得分展示 */}
        {resultData.groupScores && resultData.groupScores.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <h3 className="font-bold text-lg mb-4 flex items-center text-black">
              <Layers className="w-5 h-5 mr-2" />
              各组得分详情
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resultData.groupScores.map((group, idx) => {
                const groupPercentage = (group.score / group.totalPoints) * 100;
                let groupColor = '';
                let groupBadge = '';

                if (group.resultText === '优秀 ✨') {
                  groupColor = 'bg-black';
                  groupBadge = 'bg-black text-white';
                } else if (group.resultText === '通过 👍') {
                  groupColor = 'bg-green-600';
                  groupBadge = 'bg-green-600 text-white';
                } else {
                  groupColor = 'bg-red-600';
                  groupBadge = 'bg-red-600 text-white';
                }

                return (
                  <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-black">{group.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${groupBadge} font-medium`}>
                        {group.resultText}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold font-mono text-black">{group.score}</span>
                      <span className="text-gray-500">/ {group.totalPoints} 分</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${groupColor} rounded-full transition-all duration-1000`}
                        style={{ width: `${groupPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">
                      {groupPercentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 错题解析 */}
        {resultData.wrongAnswers.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <h3 className="font-bold text-lg mb-4 flex items-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              错题解析
            </h3>
            <div className="space-y-3">
              {resultData.wrongAnswers.map((item, index) => (
                <div key={index} className="bg-white border-l-4 border-red-600 p-4 rounded-r-lg">
                  <div className="font-semibold text-black mb-2">
                    <span className="inline-block w-6 h-6 bg-red-600 text-white rounded-full text-center text-sm leading-6 mr-2">
                      {index + 1}
                    </span>
                    {item.question}
                  </div>
                  <div className="text-sm text-gray-700 ml-8">
                    <span className="font-semibold text-green-600">✓ 正确答案：</span>
                    <span className="ml-2">{item.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI反馈 */}
        {resultData.shortAnswerFeedback && (
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="font-bold text-lg mb-4 flex items-center text-black">
              <MessageSquare className="w-5 h-5 mr-2" />
              AI 智能反馈
            </h3>
            <div className="bg-white border-l-4 border-black p-4 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {resultData.shortAnswerFeedback}
              </p>
            </div>
          </div>
        )}

        {/* 保存结果按钮 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => downloadResultAsHTML(resultData, userName)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 border border-gray-300"
          >
            <Download className="w-5 h-5" />
            <span>保存结果到本地</span>
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            下载 HTML 文件，可在浏览器中查看完整结果
          </p>
        </div>
      </div>
    </div>
  );
}


export default function QuizClient() {
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [userName, setUserName] = useState('');
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'submitting' | 'completed'>('not_started');
  const [result, setResult] = useState<ResultData | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // 当前页码（从0开始）

  const handleInputChange = (questionIndex: number, answer: string, isCheckbox: boolean) => {
    setAnswers(prev => {
      if (isCheckbox) {
        const existing = (prev[questionIndex] as string[] || []);
        if (existing.includes(answer)) {
          return { ...prev, [questionIndex]: existing.filter(a => a !== answer) };
        } else {
          return { ...prev, [questionIndex]: [...existing, answer] };
        }
      }
      return { ...prev, [questionIndex]: answer };
    });
  };

  const startQuiz = () => {
    if (userName.trim() === '') {
      alert('请输入你的名字开始测验。');
      return;
    }
    setQuizState('in_progress');
    setCurrentPage(0);
  };

  // 获取当前组的题目及其全局索引
  const getCurrentGroupQuestions = () => {
    const currentGroup = questionGroups[currentPage];
    let startIndex = 0;

    // 计算当前组题目的起始索引
    for (let i = 0; i < currentPage; i++) {
      startIndex += questionGroups[i].questions.length;
    }

    return {
      group: currentGroup,
      questions: currentGroup.questions,
      startIndex: startIndex,
    };
  };

  // 检查当前页是否所有必填题都已回答
  const isCurrentPageComplete = () => {
    const { questions, startIndex } = getCurrentGroupQuestions();

    for (let i = 0; i < questions.length; i++) {
      const globalIndex = startIndex + i;
      const question = questions[i];

      // 检查必填题（所有题目都是必填的）
      if (!answers[globalIndex]) {
        return false;
      }

      // 对于多选题，检查是否至少选了一个
      if (question.type === 'checkbox') {
        const answer = answers[globalIndex];
        if (!Array.isArray(answer) || answer.length === 0) {
          return false;
        }
      }
    }

    return true;
  };

  // 下一页
  const goToNextPage = () => {
    if (!isCurrentPageComplete()) {
      alert('请完成当前页面的所有题目后再继续');
      return;
    }

    if (currentPage < questionGroups.length - 1) {
      setCurrentPage(currentPage + 1);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 上一页
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 是否是最后一页
  const isLastPage = () => {
    return currentPage === questionGroups.length - 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证所有页面的题目都已完成
    if (!isCurrentPageComplete()) {
      alert('请完成当前页面的所有题目');
      return;
    }

    setQuizState('submitting');
    
    // 格式化答案以发送到后端
    const formattedAnswers = Object.entries(answers).map(([key, value]) => ({
      questionIndex: parseInt(key),
      answer: value,
    }));

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, answers: formattedAnswers }),
      });
      
      if (!response.ok) {
        throw new Error('评估请求失败');
      }

      const data: ResultData = await response.json();
      setResult(data);
      setQuizState('completed');

    } catch (error) {
      console.error(error);
      alert('提交失败，请检查网络并重试。');
      setQuizState('in_progress');
    }
  };

  if (quizState === 'not_started') {
    return (
      <div className="text-center py-8">
        {/* 欢迎信息 */}
        <div className="mb-8">
          <div className="mb-4 flex justify-center">
            <BarChart3 className="w-16 h-16 text-black" />
          </div>
          <h3 className="text-2xl font-bold text-black mb-2">欢迎参加测验</h3>
          <p className="text-gray-600">请输入你的姓名开始答题</p>
        </div>

        {/* 输入框 */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="请输入你的名字"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none text-lg"
              onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
            />
          </div>

          <button
            onClick={startQuiz}
            className="w-full bg-black text-white font-bold py-4 px-6 rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            <span>开始测验</span>
          </button>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 text-sm text-gray-500 space-y-2">
          <p className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            共 20 道题目，包含单选、多选和简答题
          </p>
          <p className="flex items-center justify-center gap-2">
            <BarChart3 className="w-4 h-4" />
            预计用时 15-20 分钟
          </p>
          <p className="flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />
            AI 将为你的简答题提供专业反馈
          </p>
        </div>
      </div>
    );
  }

  if (quizState === 'completed' && result) {
    return <ResultCard resultData={result} userName={userName} />;
  }

  // 获取当前组信息
  const { group, questions, startIndex } = getCurrentGroupQuestions();
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = quizData.length;

  return (
    <form onSubmit={handleSubmit}>
      {/* 页面标题和进度 */}
      <div className="mb-8">
        {/* 分页指示器 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">
              第 {currentPage + 1} 页 / 共 {questionGroups.length} 页
            </span>
          </div>
          <div className="flex gap-1">
            {questionGroups.map((_, idx) => (
              <div
                key={idx}
                className={`w-8 h-1 rounded-full transition-all ${
                  idx === currentPage
                    ? 'bg-black'
                    : idx < currentPage
                    ? 'bg-gray-400'
                    : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* 组标题 */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{group.icon}</span>
            <h2 className="text-2xl font-bold text-black">
              {group.title}
            </h2>
          </div>
          <p className="text-gray-600 ml-12">{group.description}</p>
        </div>

        {/* 整体进度 */}
        <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-black">总体进度</span>
            <span className="text-sm text-gray-600 font-mono">
              {totalAnswered} / {totalQuestions} 题
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-black rounded-full transition-all duration-300"
              style={{ width: `${(totalAnswered / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 当前组的题目列表 */}
      <div className="space-y-6">
        {questions.map((q: Question, localIndex: number) => {
          const globalIndex = startIndex + localIndex;

          // 根据题目类型选择图标
          let TypeIcon = Circle;
          let typeLabel = '单选题';
          if (q.type === 'checkbox') {
            TypeIcon = CheckSquare;
            typeLabel = '多选题';
          } else if (q.type === 'textarea') {
            TypeIcon = FileText;
            typeLabel = '简答题';
          }

          return (
          <div
            key={globalIndex}
            className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-400 transition-all duration-200"
          >
            {/* 题目标题 */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-md flex items-center justify-center font-bold">
                {localIndex + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-black text-lg leading-relaxed">
                  {q.question}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 font-medium flex items-center gap-1">
                    <TypeIcon className="w-3 h-3" />
                    {typeLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* 选项 */}
            {q.type === 'radio' && (
              <div className="space-y-2 ml-11">
                {q.options?.map((opt: string) => (
                  <label
                    key={opt}
                    className="flex items-center p-3 rounded-lg border border-gray-300 hover:border-black hover:bg-gray-50 cursor-pointer transition-all group"
                  >
                    <input
                      type="radio"
                      name={`q${globalIndex}`}
                      value={opt.split('.')[0]}
                      required
                      onChange={(e) => handleInputChange(globalIndex, e.target.value, false)}
                      className="w-4 h-4 text-black focus:ring-2 focus:ring-gray-300"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-black font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'checkbox' && (
              <div className="space-y-2 ml-11">
                {q.options?.map((opt: string) => (
                  <label
                    key={opt}
                    className="flex items-center p-3 rounded-lg border border-gray-300 hover:border-black hover:bg-gray-50 cursor-pointer transition-all group"
                  >
                    <input
                      type="checkbox"
                      name={`q${globalIndex}`}
                      value={opt.split('.')[0]}
                      onChange={(e) => handleInputChange(globalIndex, e.target.value, true)}
                      className="w-4 h-4 text-black rounded focus:ring-2 focus:ring-gray-300"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-black font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'textarea' && (
              <div className="ml-11">
                <textarea
                  id={q.id}
                  required
                  placeholder="请详细描述你的答案，AI 将为你提供专业反馈..."
                  className="w-full p-4 border border-gray-300 rounded-lg min-h-[150px] focus:border-black focus:ring-2 focus:ring-gray-200 transition-all outline-none resize-none"
                  onChange={(e) => handleInputChange(globalIndex, e.target.value, false)}
                ></textarea>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>建议字数：100-300字</span>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* 页面导航按钮 */}
      <div className="mt-8 flex gap-4">
        {/* 上一页按钮 */}
        {currentPage > 0 && (
          <button
            type="button"
            onClick={goToPreviousPage}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-lg hover:border-black hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>上一页</span>
          </button>
        )}

        {/* 下一页或提交按钮 */}
        {isLastPage() ? (
          <button
            type="submit"
            disabled={quizState === 'submitting'}
            className="flex-1 bg-black text-white font-bold py-4 px-6 rounded-lg hover:bg-gray-800 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {quizState === 'submitting' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>AI 正在智能评估中...</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                <span>提交评估</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goToNextPage}
            className="flex-1 bg-black text-white font-bold py-4 px-6 rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>下一页</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { quizData } from '../lib/questions';
import type { Question } from '../lib/questions';

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
}

// 结果展示组件
function ResultCard({ resultData, userName }: { resultData: ResultData; userName: string }) {
    let resultClass = '';
    let resultIcon = '';
    let resultGradient = '';
    let scorePercentage = (resultData.score / resultData.totalPoints) * 100;

    switch(resultData.resultText) {
        case '不通过 🔴':
            resultClass = 'bg-gradient-to-br from-red-50 to-red-100 border-red-300';
            resultIcon = '😔';
            resultGradient = 'from-red-500 to-red-600';
            break;
        case '通过 👍':
            resultClass = 'bg-gradient-to-br from-green-50 to-green-100 border-green-300';
            resultIcon = '👍';
            resultGradient = 'from-green-500 to-green-600';
            break;
        case '优秀 ✨':
            resultClass = 'bg-gradient-to-br from-blue-50 to-purple-100 border-blue-300';
            resultIcon = '🎉';
            resultGradient = 'from-blue-500 to-purple-600';
            break;
    }

  return (
    <div className="animate-fade-in-up">
      {/* 主结果卡片 */}
      <div className={`p-8 rounded-2xl border-2 shadow-xl ${resultClass}`}>
        {/* 结果标题 */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce-in">{resultIcon}</div>
          <h2 className="text-3xl font-bold mb-2">
            <span className="text-gray-700">{userName}</span>
            <span className="text-gray-500 text-xl ml-2">的测验结果</span>
          </h2>
          <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${resultGradient} text-white font-bold text-xl shadow-lg`}>
            {resultData.resultText}
          </div>
        </div>

        {/* 分数展示 */}
        <div className="bg-white/70 backdrop-blur rounded-xl p-6 mb-6 shadow-inner">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {resultData.score}
              </div>
              <div className="text-sm text-gray-500 mt-1">获得分数</div>
            </div>
            <div className="text-3xl text-gray-400">/</div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-600">
                {resultData.totalPoints}
              </div>
              <div className="text-sm text-gray-500 mt-1">总分</div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${resultGradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${scorePercentage}%` }}
            ></div>
          </div>
          <div className="text-center mt-2 text-sm text-gray-600">
            正确率: {scorePercentage.toFixed(1)}%
          </div>
        </div>

        {/* 错题解析 */}
        {resultData.wrongAnswers.length > 0 && (
          <div className="bg-white/70 backdrop-blur rounded-xl p-6 mb-6 shadow-inner">
            <h3 className="font-bold text-lg mb-4 flex items-center text-red-600">
              <span className="text-2xl mr-2">📝</span>
              错题解析
            </h3>
            <div className="space-y-3">
              {resultData.wrongAnswers.map((item, index) => (
                <div key={index} className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                  <div className="font-semibold text-gray-800 mb-2">
                    <span className="inline-block w-6 h-6 bg-red-500 text-white rounded-full text-center text-sm leading-6 mr-2">
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
          <div className="bg-white/70 backdrop-blur rounded-xl p-6 shadow-inner">
            <h3 className="font-bold text-lg mb-4 flex items-center text-blue-600">
              <span className="text-2xl mr-2">🤖</span>
              AI 智能反馈
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {resultData.shortAnswerFeedback}
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}


export default function QuizClient() {
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [userName, setUserName] = useState('');
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'submitting' | 'completed'>('not_started');
  const [result, setResult] = useState<ResultData | null>(null);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="text-center py-8 animate-fade-in">
        {/* 欢迎信息 */}
        <div className="mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">欢迎参加测验</h3>
          <p className="text-gray-600">请输入你的姓名开始答题</p>
        </div>

        {/* 输入框 */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-xl">👤</span>
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="请输入你的名字"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-lg"
              onKeyDown={(e) => e.key === 'Enter' && startQuiz()}
            />
          </div>

          <button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <span className="text-xl">🚀</span>
            <span>开始测验</span>
          </button>
        </div>

        {/* 提示信息 */}
        <div className="mt-8 text-sm text-gray-500 space-y-2">
          <p>💡 共 9 道题目，包含单选、多选和简答题</p>
          <p>⏱️ 预计用时 10-15 分钟</p>
          <p>🤖 AI 将为你的简答题提供专业反馈</p>
        </div>
      </div>
    );
  }

  if (quizState === 'completed' && result) {
    return <ResultCard resultData={result} userName={userName} />;
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      {/* 进度指示器 */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">答题进度</span>
          <span className="text-sm text-gray-600">
            {Object.keys(answers).length} / {quizData.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(Object.keys(answers).length / quizData.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="space-y-6">
        {quizData.map((q: Question, index: number) => (
          <div
            key={index}
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200"
          >
            {/* 题目标题 */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-lg leading-relaxed">
                  {q.question}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    q.type === 'radio' ? 'bg-blue-100 text-blue-700' :
                    q.type === 'checkbox' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {q.type === 'radio' ? '📻 单选题' : q.type === 'checkbox' ? '☑️ 多选题' : '✍️ 简答题'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {q.points} 分
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
                    className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group"
                  >
                    <input
                      type="radio"
                      name={`q${index}`}
                      value={opt.split('.')[0]}
                      required
                      onChange={(e) => handleInputChange(index, e.target.value, false)}
                      className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-gray-900 font-medium">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'checkbox' && (
              <div className="space-y-2 ml-11">
                {q.options?.map((opt: string) => (
                  <label
                    key={opt}
                    className="flex items-center p-3 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all group"
                  >
                    <input
                      type="checkbox"
                      name={`q${index}`}
                      value={opt.split('.')[0]}
                      onChange={(e) => handleInputChange(index, e.target.value, true)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-gray-900 font-medium">{opt}</span>
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
                  className="w-full p-4 border-2 border-gray-200 rounded-lg min-h-[150px] focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none resize-none"
                  onChange={(e) => handleInputChange(index, e.target.value, false)}
                ></textarea>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <span>💡</span>
                  <span>建议字数：100-300字</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 提交按钮 */}
      <div className="mt-8 sticky bottom-4">
        <button
          type="submit"
          disabled={quizState === 'submitting'}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
        >
          {quizState === 'submitting' ? (
            <>
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>AI 正在智能评估中...</span>
            </>
          ) : (
            <>
              <span className="text-xl">🎯</span>
              <span>提交评估</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

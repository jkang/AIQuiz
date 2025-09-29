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
    switch(resultData.resultText) {
        case '不通过 🔴': resultClass = 'bg-red-50 border-red-200'; break;
        case '通过 👍': resultClass = 'bg-green-50 border-green-200'; break;
        case '优秀 ✨': resultClass = 'bg-blue-50 border-blue-200'; break;
    }

  return (
    <div className={`mt-8 p-6 rounded-lg border ${resultClass}`}>
      <h2 className="text-2xl font-bold text-center mb-4">
        {userName}，你的评估结果是：{resultData.resultText}
      </h2>
      <p className="text-center text-lg mb-6">
        你的总分是：<strong>{resultData.score} / {resultData.totalPoints}</strong>
      </p>
      
      {resultData.wrongAnswers.length > 0 && (
        <div className="text-left mt-6">
          <h3 className="font-bold mb-2">错题解析：</h3>
          <ul className="list-disc pl-5 space-y-2">
            {resultData.wrongAnswers.map((item, index) => (
              <li key={index}>
                <strong>题目:</strong> {item.question}<br />
                <strong>正确答案:</strong> {item.correctAnswer}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {resultData.shortAnswerFeedback && (
        <div className="text-left mt-6">
           <h3 className="font-bold mb-2">简答题反馈：</h3>
           <p>{resultData.shortAnswerFeedback}</p>
        </div>
      )}
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
      <div className="text-center">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="请输入你的名字"
          className="w-full max-w-sm p-3 border rounded-lg mb-4"
        />
        <button onClick={startQuiz} className="w-full max-w-sm bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          开始测验
        </button>
      </div>
    );
  }

  if (quizState === 'completed' && result) {
    return <ResultCard resultData={result} userName={userName} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      {quizData.map((q: Question, index: number) => (
        <div key={index} className="mb-6 pb-6 border-b last:border-b-0">
          <p className="font-semibold mb-3">{index + 1}. {q.question}</p>
          {q.type === 'radio' && q.options?.map((opt: string) => (
            <label key={opt} className="block p-2 rounded-md hover:bg-gray-100 cursor-pointer">
              <input type="radio" name={`q${index}`} value={opt.split('.')[0]} required onChange={(e) => handleInputChange(index, e.target.value, false)} />
              <span className="ml-2">{opt}</span>
            </label>
          ))}
          {q.type === 'checkbox' && q.options?.map((opt: string) => (
             <label key={opt} className="block p-2 rounded-md hover:bg-gray-100 cursor-pointer">
              <input type="checkbox" name={`q${index}`} value={opt.split('.')[0]} onChange={(e) => handleInputChange(index, e.target.value, true)} />
              <span className="ml-2">{opt}</span>
            </label>
          ))}
          {q.type === 'textarea' && (
            <textarea
              id={q.id}
              required
              placeholder="请在这里输入你的答案..."
              className="w-full p-2 border rounded-lg min-h-[120px]"
              onChange={(e) => handleInputChange(index, e.target.value, false)}
            ></textarea>
          )}
        </div>
      ))}
      <button type="submit" disabled={quizState === 'submitting'} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
        {quizState === 'submitting' ? '正在智能评估中...' : '提交评估'}
      </button>
    </form>
  );
}

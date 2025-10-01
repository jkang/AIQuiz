'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, RefreshCw, Lock, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { quizData } from '../../lib/questions';

interface QuizRecord {
  '提交时间': string;
  '用户姓名': string;
  '总分': number;
  '满分': number;
  '结果等级': string;
  '客观题得分': number;
  '简答题得分': number;
  '简答题反馈': string;
  '错题详情': string;
  '原始答案数据': string;
}

interface ApiResponse {
  data: QuizRecord[];
  total: number;
  lastUpdated: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [records, setRecords] = useState<QuizRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [expandedRecord, setExpandedRecord] = useState<number | null>(null);

  // 验证管理员令牌
  const handleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      // 通过 API 验证令牌
      const response = await fetch(`/api/admin/verify?token=${token}`);

      if (response.ok) {
        setIsAuthenticated(true);
        await fetchRecords();
      } else {
        setError('无效的管理员令牌');
      }
    } catch (err) {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取记录数据
  const fetchRecords = async () => {
    setLoading(true);
    setError('');

    try {
      // 通过 API 路由获取数据，避免在前端暴露 webhook URL
      const response = await fetch(`/api/admin/records?token=${token}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      setRecords(data.data || []);
      setLastUpdated(data.lastUpdated || new Date().toISOString());

    } catch (err) {
      setError(`获取数据失败: ${err instanceof Error ? err.message : '未知错误'}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 导出 CSV
  const handleExport = () => {
    const exportUrl = `/api/admin/export?token=${token}`;
    window.open(exportUrl, '_blank');
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return dateString;
    }
  };

  // 解析错题详情
  const parseWrongAnswers = (wrongAnswersStr: string) => {
    try {
      const wrongAnswers = JSON.parse(wrongAnswersStr);
      return Array.isArray(wrongAnswers) ? wrongAnswers : [];
    } catch {
      return [];
    }
  };

  // 解析原始答案数据
  const parseRawAnswers = (rawAnswersStr: string) => {
    try {
      const rawAnswers = JSON.parse(rawAnswersStr);
      return Array.isArray(rawAnswers) ? rawAnswers : [];
    } catch {
      return [];
    }
  };

  // 切换记录展开状态
  const toggleRecordExpansion = (index: number) => {
    setExpandedRecord(expandedRecord === index ? null : index);
  };

  // 渲染答题详情
  const renderAnswerDetails = (rawAnswersStr: string) => {
    const rawAnswers = parseRawAnswers(rawAnswersStr);

    return (
      <div className="mt-4 space-y-4">
        <h4 className="font-semibold text-lg flex items-center">
          <FileText className="w-4 h-4 mr-2" />
          答题详情
        </h4>

        {rawAnswers.map((answer: any, idx: number) => {
          const question = quizData[answer.questionIndex];
          if (!question) return null;

          const userAnswer = answer.answer;
          const isCorrect = question.type !== 'textarea' &&
            (question.type === 'radio' ?
              userAnswer === question.answer :
              JSON.stringify(Array.isArray(userAnswer) ? userAnswer.sort() : [userAnswer].sort()) ===
              JSON.stringify(Array.isArray(question.answer) ? question.answer.sort() : [question.answer].sort())
            );

          return (
            <div key={idx} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-medium text-sm text-gray-700">
                  题目 {answer.questionIndex + 1} ({question.points}分)
                </h5>
                {question.type !== 'textarea' && (
                  <Badge variant={isCorrect ? 'default' : 'destructive'} className="text-xs">
                    {isCorrect ? '正确' : '错误'}
                  </Badge>
                )}
              </div>

              <p className="text-sm mb-3 font-medium">{question.question}</p>

              {question.type === 'radio' && (
                <div className="space-y-1">
                  {question.options?.map((option: string, optIdx: number) => (
                    <div key={optIdx} className={`text-sm p-2 rounded ${
                      userAnswer === option ? 'bg-blue-100 border border-blue-300' : 'bg-white'
                    } ${question.answer === option ? 'ring-2 ring-green-300' : ''}`}>
                      <span className="font-mono text-xs mr-2">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      {option}
                      {userAnswer === option && <span className="ml-2 text-blue-600">👤 用户选择</span>}
                      {question.answer === option && <span className="ml-2 text-green-600">✓ 正确答案</span>}
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'checkbox' && (
                <div className="space-y-1">
                  {question.options?.map((option: string, optIdx: number) => {
                    const userSelected = Array.isArray(userAnswer) ? userAnswer.includes(option) : userAnswer === option;
                    const isCorrectOption = Array.isArray(question.answer) ? question.answer.includes(option) : question.answer === option;

                    return (
                      <div key={optIdx} className={`text-sm p-2 rounded ${
                        userSelected ? 'bg-blue-100 border border-blue-300' : 'bg-white'
                      } ${isCorrectOption ? 'ring-2 ring-green-300' : ''}`}>
                        <span className="font-mono text-xs mr-2">
                          {userSelected ? '☑️' : '☐'} {String.fromCharCode(65 + optIdx)}.
                        </span>
                        {option}
                        {userSelected && <span className="ml-2 text-blue-600">👤 用户选择</span>}
                        {isCorrectOption && <span className="ml-2 text-green-600">✓ 正确答案</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {question.type === 'textarea' && (
                <div className="space-y-2">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-xs text-gray-500 mb-1">用户回答：</p>
                    <p className="text-sm whitespace-pre-wrap">{userAnswer || '未回答'}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 获取结果等级的颜色
  const getResultBadgeVariant = (resultText: string) => {
    if (resultText.includes('优秀')) return 'default';
    if (resultText.includes('通过')) return 'secondary';
    return 'destructive';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

        <Card className="w-full max-w-md shadow-2xl border-0 relative z-10 bg-white/80 backdrop-blur-lg">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              管理员登录
            </CardTitle>
            <CardDescription className="text-base mt-2">
              请输入管理员令牌以访问测验记录
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 animate-shake">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <Input
                  type="password"
                  placeholder="请输入管理员令牌"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleAuth()}
                  className="pl-10 h-12 border-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <Button
                onClick={handleAuth}
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>验证中...</span>
                  </div>
                ) : (
                  '登录'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <div className="inline-block">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2">
              AI测验结果管理
            </h1>
            <p className="text-gray-600 text-lg">查看和管理所有用户的测验结果</p>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mt-3"></div>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between bg-white/80 backdrop-blur-lg p-4 rounded-xl shadow-lg border border-white/20">
          <div className="flex gap-2">
            <Button
              onClick={fetchRecords}
              disabled={loading}
              variant="outline"
              className="border-2 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              导出 CSV
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-700">
              总记录数: <span className="text-blue-600">{records.length}</span>
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">
              最后更新: {formatDate(lastUpdated)}
            </span>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {records.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-xl">
              <CardContent className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">暂无测验记录</p>
                <p className="text-gray-400 text-sm mt-2">等待用户提交测验结果</p>
              </CardContent>
            </Card>
          ) : (
            records.map((record, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-lg border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01]">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 用户信息 */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {record['用户姓名'].charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{record['用户姓名']}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span>🕐</span>
                          {formatDate(record['提交时间'])}
                        </p>
                      </div>
                    </div>

                    {/* 分数展示 */}
                    <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3">
                      <div className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">
                        {record['总分']}<span className="text-xl text-gray-400">/{record['满分']}</span>
                      </div>
                      <Badge
                        variant={getResultBadgeVariant(record['结果等级'])}
                        className="shadow-md"
                      >
                        {record['结果等级']}
                      </Badge>
                    </div>

                    {/* 得分详情 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-gray-600">客观题:</span>
                        <span className="font-semibold text-blue-600">{record['客观题得分']}分</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-gray-600">简答题:</span>
                        <span className="font-semibold text-green-600">{record['简答题得分']}分</span>
                      </div>
                    </div>

                    {/* 操作区域 */}
                    <div className="flex flex-col gap-2">
                      {parseWrongAnswers(record['错题详情']).length > 0 && (
                        <div className="flex items-center gap-2 text-sm bg-red-50 px-3 py-1 rounded-full border border-red-200">
                          <span className="text-red-600 font-semibold">❌ 错题数:</span>
                          <span className="text-red-700 font-bold">{parseWrongAnswers(record['错题详情']).length}</span>
                        </div>
                      )}
                      {record['简答题反馈'] && (
                        <div className="flex items-center gap-1 text-xs bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                          <span>🤖</span>
                          <span className="text-blue-600 font-medium">有AI反馈</span>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRecordExpansion(index)}
                        className="mt-2 border-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                      >
                        {expandedRecord === index ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            收起详情
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            查看详情
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* 展开的答题详情 */}
                  {expandedRecord === index && (
                    <div className="mt-6 pt-6 border-t">
                      {/* 错题详情 */}
                      {parseWrongAnswers(record['错题详情']).length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-lg mb-3 text-red-600">错题分析</h4>
                          <div className="space-y-2">
                            {parseWrongAnswers(record['错题详情']).map((wrongAnswer: any, idx: number) => (
                              <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="font-medium text-sm text-red-800 mb-1">
                                  {wrongAnswer.question}
                                </p>
                                <p className="text-sm text-red-600">
                                  正确答案: {wrongAnswer.correctAnswer}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 简答题反馈 */}
                      {record['简答题反馈'] && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-lg mb-3 text-blue-600">AI 评估反馈</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800 whitespace-pre-wrap">
                              {record['简答题反馈']}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 完整答题详情 */}
                      {renderAnswerDetails(record['原始答案数据'])}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

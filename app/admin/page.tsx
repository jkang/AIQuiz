'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, RefreshCw, Lock } from 'lucide-react';

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

  // 获取结果等级的颜色
  const getResultBadgeVariant = (resultText: string) => {
    if (resultText.includes('优秀')) return 'default';
    if (resultText.includes('通过')) return 'secondary';
    return 'destructive';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>管理员登录</CardTitle>
            <CardDescription>请输入管理员令牌以访问测验结果</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="输入管理员令牌"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleAuth()}
            />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleAuth} disabled={loading} className="w-full">
              {loading ? '验证中...' : '登录'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI测验结果管理</h1>
          <p className="text-gray-600">查看和管理所有用户的测验结果</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={fetchRecords} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              导出 CSV
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            总记录数: {records.length} | 最后更新: {formatDate(lastUpdated)}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {records.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无测验记录</p>
              </CardContent>
            </Card>
          ) : (
            records.map((record, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{record['用户姓名']}</h3>
                      <p className="text-sm text-gray-500">{formatDate(record['提交时间'])}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {record['总分']}/{record['满分']}
                      </div>
                      <Badge variant={getResultBadgeVariant(record['结果等级'])}>
                        {record['结果等级']}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">客观题: {record['客观题得分']}分</div>
                      <div className="text-sm text-gray-600">简答题: {record['简答题得分']}分</div>
                    </div>
                    
                    <div>
                      {parseWrongAnswers(record['错题详情']).length > 0 && (
                        <div className="text-sm">
                          <span className="text-red-600">错题数: {parseWrongAnswers(record['错题详情']).length}</span>
                        </div>
                      )}
                      {record['简答题反馈'] && (
                        <div className="text-sm text-gray-600 mt-1 truncate">
                          反馈: {record['简答题反馈']}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

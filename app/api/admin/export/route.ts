import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // 验证管理员令牌
    if (token !== process.env.ADMIN_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Google Sheets webhook not configured' },
        { status: 500 }
      );
    }

    // 调用 Google Sheets API 导出 CSV
    const response = await fetch(`${webhookUrl}?action=export&token=${process.env.ADMIN_TOKEN}`);
    
    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    // 获取 CSV 内容
    const csvContent = await response.text();
    
    // 生成文件名
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `ai-quiz-results-${timestamp}.csv`;

    // 返回 CSV 文件
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Admin export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

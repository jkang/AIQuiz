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
    const adminToken = process.env.ADMIN_TOKEN;

    console.log('🧪 Testing Google Sheets connection...');
    console.log('🔗 Webhook URL:', webhookUrl);
    console.log('🔑 Admin Token:', adminToken ? 'configured' : 'missing');

    if (!webhookUrl || !adminToken) {
      return NextResponse.json({
        success: false,
        error: 'Google Sheets webhook or admin token not configured',
        config: {
          webhookUrl: webhookUrl ? 'configured' : 'missing',
          adminToken: adminToken ? 'configured' : 'missing'
        }
      });
    }

    // 测试数据
    const testData = {
      userName: '测试用户',
      score: 8,
      totalPoints: 10,
      resultText: '优秀 ✨',
      objectiveScore: 6,
      shortAnswerScore: 2,
      shortAnswerFeedback: '测试反馈',
      wrongAnswers: [{ question: '测试题目', correctAnswer: '测试答案' }],
      rawAnswers: [{ questionIndex: 0, answer: '测试答案' }]
    };

    console.log('📤 Sending test data:', testData);

    const response = await fetch(`${webhookUrl}?token=${adminToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { rawResponse: responseText };
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      testData: testData
    });

  } catch (error) {
    console.error('💥 Test sheets API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
}

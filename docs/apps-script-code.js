/**
 * AI测验结果处理器 - Google Apps Script
 * 
 * 功能：
 * 1. 接收来自 Next.js 应用的测验结果数据
 * 2. 将数据写入 Google Sheets
 * 3. 提供管理员查看和导出功能
 */

// 配置常量
const ADMIN_TOKEN = 'ai20pm'; // 与 .env.local 中的 ADMIN_TOKEN 保持一致
const SHEET_NAME = 'Sheet1'; // 工作表名称，可根据需要修改

/**
 * 处理 POST 请求 - 接收测验结果数据
 */
function doPost(e) {
  try {
    // 验证 token
    const token = e.parameter.token || '';
    if (token !== ADMIN_TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 解析请求数据
    const requestData = JSON.parse(e.postData.contents || '{}');
    
    // 验证必要字段
    if (!requestData.userName || typeof requestData.score !== 'number') {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Invalid data format' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 获取工作表
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }

    // 准备要写入的数据行
    const timestamp = new Date();
    const rowData = [
      timestamp,                                    // A: 提交时间
      requestData.userName,                         // B: 用户姓名
      requestData.score,                           // C: 总分
      requestData.totalPoints,                     // D: 满分
      requestData.resultText,                      // E: 结果等级
      requestData.objectiveScore || 0,             // F: 客观题得分
      requestData.shortAnswerScore || 0,           // G: 简答题得分
      requestData.shortAnswerFeedback || '',       // H: 简答题反馈
      JSON.stringify(requestData.wrongAnswers || []), // I: 错题详情
      JSON.stringify(requestData.rawAnswers || []),   // J: 原始答案数据
      JSON.stringify(requestData.groupScores || [])   // K: 分组得分详情（新增）
    ];

    // 写入数据
    sheet.appendRow(rowData);

    // 返回成功响应
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Data saved successfully',
        timestamp: timestamp.toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('doPost error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Internal server error',
        details: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 处理 GET 请求 - 提供管理员查看和导出功能
 */
function doGet(e) {
  try {
    // 验证 token
    const token = e.parameter.token || '';
    if (token !== ADMIN_TOKEN) {
      return ContentService
        .createTextOutput('Unauthorized')
        .setMimeType(ContentService.MimeType.TEXT);
    }

    const action = e.parameter.action || 'list';
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found`);
    }

    // 获取所有数据
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (values.length <= 1) {
      // 只有表头或空表
      if (action === 'export') {
        return ContentService
          .createTextOutput('提交时间,用户姓名,总分,满分,结果等级,客观题得分,简答题得分,简答题反馈,错题详情,原始答案数据\n')
          .setMimeType(ContentService.MimeType.TEXT)
          .downloadAsFile('ai-quiz-results.csv');
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({ data: [], total: 0 }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    if (action === 'export') {
      // 导出 CSV
      return exportAsCSV(values);
    } else {
      // 返回 JSON 数据
      return getAsJSON(values);
    }

  } catch (error) {
    console.error('doGet error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        error: 'Internal server error',
        details: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 导出为 CSV 格式
 */
function exportAsCSV(values) {
  let csvContent = '';

  values.forEach((row, index) => {
    let enhancedRow = [...row];

    if (index === 0) {
      // 标题行，添加额外的列
      enhancedRow.push(
        '详细答题情况',
        '错题分析',
        '第1组得分',
        '第1组总分',
        '第1组结果',
        '第2组得分',
        '第2组总分',
        '第2组结果'
      );
    } else {
      // 数据行，解析原始答案数据
      const rawAnswersStr = row[9] || ''; // 原始答案数据在第10列（索引9）
      const wrongAnswersStr = row[8] || ''; // 错题详情在第9列（索引8）
      const groupScoresStr = row[10] || ''; // 分组得分在第11列（索引10）

      let detailedAnswers = '';
      let wrongAnalysis = '';
      let group1Score = '';
      let group1Total = '';
      let group1Result = '';
      let group2Score = '';
      let group2Total = '';
      let group2Result = '';

      try {
        // 解析原始答案
        if (rawAnswersStr) {
          const rawAnswers = JSON.parse(rawAnswersStr);
          detailedAnswers = rawAnswers.map((answer) =>
            `题目${answer.questionIndex + 1}: ${Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}`
          ).join(' | ');
        }

        // 解析错题详情
        if (wrongAnswersStr) {
          const wrongAnswers = JSON.parse(wrongAnswersStr);
          wrongAnalysis = wrongAnswers.map((wrong) =>
            `${wrong.question} (正确答案: ${wrong.correctAnswer})`
          ).join(' | ');
        }

        // 解析分组得分
        if (groupScoresStr) {
          const groupScores = JSON.parse(groupScoresStr);
          if (groupScores.length > 0) {
            group1Score = groupScores[0].score || '';
            group1Total = groupScores[0].totalPoints || '';
            group1Result = groupScores[0].resultText || '';
          }
          if (groupScores.length > 1) {
            group2Score = groupScores[1].score || '';
            group2Total = groupScores[1].totalPoints || '';
            group2Result = groupScores[1].resultText || '';
          }
        }

      } catch (e) {
        detailedAnswers = '解析失败';
        wrongAnalysis = '解析失败';
      }

      enhancedRow.push(
        detailedAnswers,
        wrongAnalysis,
        group1Score,
        group1Total,
        group1Result,
        group2Score,
        group2Total,
        group2Result
      );
    }

    const csvRow = enhancedRow.map(cell => {
      // 处理包含逗号、引号或换行符的单元格
      let cellValue = String(cell || '');
      if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
        cellValue = '"' + cellValue.replace(/"/g, '""') + '"';
      }
      return cellValue;
    }).join(',');

    csvContent += csvRow + '\n';
  });

  return ContentService
    .createTextOutput(csvContent)
    .setMimeType(ContentService.MimeType.TEXT)
    .downloadAsFile(`ai-quiz-results-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * 返回 JSON 格式数据
 */
function getAsJSON(values) {
  const headers = values[0];
  const data = values.slice(1).map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index];
    });
    return record;
  });

  return ContentService
    .createTextOutput(JSON.stringify({ 
      data: data,
      total: data.length,
      lastUpdated: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 测试函数 - 用于在 Apps Script 编辑器中测试
 */
function testFunction() {
  console.log('Apps Script is working correctly!');
  
  // 测试获取工作表
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (sheet) {
    console.log('Sheet found:', sheet.getName());
    console.log('Sheet has', sheet.getLastRow(), 'rows');
  } else {
    console.log('Sheet not found:', SHEET_NAME);
  }
}

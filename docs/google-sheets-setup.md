# Google Sheets 存储方案设置指南

## 概述

本指南将帮你设置 Google Sheets + Apps Script 来存储用户测验结果，实现：
- 自动保存每次测验结果
- 管理员可查看所有记录
- 支持导出 CSV 格式

## 第一步：创建 Google Sheets

1. 访问 [Google Sheets](https://sheets.google.com)
2. 创建新的电子表格，命名为 "AI测验结果"
3. 在第一行设置列头：
   ```
   A1: 提交时间
   B1: 用户姓名  
   C1: 总分
   D1: 满分
   E1: 结果等级
   F1: 客观题得分
   G1: 简答题得分
   H1: 简答题反馈
   I1: 错题详情
   J1: 原始答案数据
   ```

## 第二步：创建 Apps Script

1. 在你的 Google Sheets 中，点击 **扩展程序** → **Apps Script**
2. 删除默认代码，粘贴 `docs/apps-script-code.js` 中的完整代码
3. 保存项目，命名为 "AI测验结果处理器"

## 第三步：部署 Web App

1. 在 Apps Script 编辑器中，点击右上角 **部署** → **新部署**
2. 点击 **选择类型** → **Web 应用**
3. 配置部署设置：
   - **说明**：AI测验结果收集器
   - **执行身份**：我（脚本所有者）
   - **谁有权访问**：任何拥有链接的人
4. 点击 **部署**
5. **重要**：复制生成的 Web 应用 URL，格式类似：
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```

## 第四步：首次授权

1. 部署后会提示需要授权
2. 点击 **授权访问权限**
3. 选择你的 Google 账号
4. 点击 **高级** → **转至项目名称（不安全）**
5. 点击 **允许**

## 第五步：配置环境变量

在你的 `.env.local` 文件中更新：
```env
# Google Sheets Webhook URL - 替换为你的实际 Script ID
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 第六步：测试集成

1. 启动你的 Next.js 应用：`npm run dev`
2. 完成一次测验提交
3. 检查 Google Sheets 是否有新记录
4. 检查浏览器控制台是否有错误

## 管理员功能

### 查看所有记录
直接打开你的 Google Sheets 即可查看所有测验记录

### 导出 CSV
访问以下 URL 可下载 CSV 格式的所有记录：
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=export&token=ai20pm
```

### 获取 JSON 格式数据
访问以下 URL 可获取 JSON 格式的记录：
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=list&token=ai20pm
```

## 安全说明

- Google Sheets 保持私有，只有你能访问
- Apps Script 以你的身份执行，具有写入权限
- Webhook 使用 ADMIN_TOKEN 进行验证
- 所有数据传输都在服务端进行，不会暴露给前端

## 故障排除

### 如果 Apps Script 部署失败
1. 确保你有 Google 账号的完整权限
2. 尝试刷新页面重新部署
3. 检查是否正确设置了执行权限

### 如果数据没有写入 Sheets
1. 检查 Apps Script 的执行日志
2. 确认 GOOGLE_SHEETS_WEBHOOK_URL 配置正确
3. 确认 ADMIN_TOKEN 配置正确
4. 检查网络连接和 API 调用

### 如果管理员页面无法访问
1. 确认 ADMIN_TOKEN 配置正确
2. 检查浏览器控制台的错误信息
3. 确认 API 路由正常工作

### 如果导出功能不工作
1. 确认令牌验证通过
2. 检查 Apps Script 的 doGet 函数是否正确部署
3. 查看浏览器网络请求是否成功

import QuizClient from "@/components/quick-client";
import { Lightbulb } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-white">
      {/* 主内容 */}
      <div className="relative w-full max-w-5xl">
        {/* 标题卡片 */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-black mb-3">
              AI项目快速启动
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-gray-600 mb-4">
              知识小测验
            </h2>
            <div className="h-0.5 w-32 bg-black mx-auto"></div>
          </div>
        </div>

        {/* 测验卡片 */}
        <div className="bg-white p-6 md:p-10 rounded-lg border border-gray-200 shadow-sm">
          <QuizClient />
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
          <Lightbulb className="w-4 h-4" />
          <p>测试你的 AI 技术知识，获得专业评估反馈</p>
        </div>
      </div>
    </main>
  );
}

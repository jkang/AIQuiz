import QuizClient from "@/components/quick-client";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gray-50">
      <div className="w-full max-w-4xl bg-white p-6 md:p-10 rounded-xl shadow-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-600 mb-8">
          AI 技术应用架构知识测验
        </h1>
        {/* 核心交互逻辑由客户端组件处理 */}
        <QuizClient />
      </div>
    </main>
  );
}

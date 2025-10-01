import QuizClient from "@/components/quick-client";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>

      {/* 装饰性背景元素 */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* 主内容 */}
      <div className="relative w-full max-w-5xl">
        {/* 标题卡片 */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-3 animate-fade-in">
              AI应用知多
            </h1>
            <h2 className="text-1xl md:text-2xl font-bold text-gray-700 mb-4 animate-fade-in-delay">
              知识小测验
            </h2>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* 测验卡片 */}
        <div className="bg-white/80 backdrop-blur-lg p-6 md:p-10 rounded-2xl shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
          <QuizClient />
        </div>

        {/* 底部装饰 */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p className="animate-fade-in-delay-2">💡 测试你的 AI 技术知识，获得专业评估反馈</p>
        </div>
      </div>
    </main>
  );
}

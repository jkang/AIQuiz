import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 技术应用架构测验",
  description: "一个用于评估AI技术应用知识的在线测验。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

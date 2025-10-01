import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI知识基础测验",
  description: "AI应用知识的在线测验",
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

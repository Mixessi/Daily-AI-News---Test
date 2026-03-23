import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Daily News - AI 资讯聚合",
  description: "每日聚合最新 AI 资讯，涵盖 LLM、计算机视觉、AI Agents、开源项目等领域",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "ThreadForge — Synthetic Retail Investor Conversation Engine",
  description:
    "Generate hyper-realistic retail investor discussion threads across YouTube, Reddit, X/Twitter, and Discord. Powered by probabilistic archetype simulation.",
  keywords: [
    "thread simulator",
    "retail investor",
    "conversation engine",
    "social media simulation",
    "finance threads",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}

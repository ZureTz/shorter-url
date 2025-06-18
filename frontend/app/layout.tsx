import { ThemeProvider } from "@/components/theme-provider";
import { LayoutContent } from "@/components/layout-content";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Toaster } from "sonner";
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "短链接生成器 - 简单、快速、安全",
  description: "免费的短链接生成服务，支持自定义链接、过期时间设置，帮您创建简洁易记的短链接",
  keywords: "短链接,URL缩短,链接生成器,自定义链接",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProtectedRoute>
              <LayoutContent>{children}</LayoutContent>
              <Toaster />
            </ProtectedRoute>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

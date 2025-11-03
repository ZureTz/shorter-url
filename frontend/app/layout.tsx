"use client";

import { Toaster } from "sonner";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { LayoutContent } from "@/components/layout-content";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";

import "@/i18n/i18n";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // 更新文档标题和元数据
    document.title = t("metadata.title");

    // 更新或创建 meta 标签
    const updateMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateMetaTag("description", t("metadata.description"));
    updateMetaTag("keywords", t("metadata.keywords"));

    // 更新 html lang 属性
    document.documentElement.lang = i18n.language === "zh" ? "zh-CN" : "en";
  }, [t, i18n.language]);

  return (
    <html
      lang={i18n.language === "zh" ? "zh-CN" : "en"}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
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

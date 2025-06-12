"use client";

import { useAuth } from "@/contexts/auth-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { usePathname } from "next/navigation";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // 登录页面不需要侧边栏
  const isLoginPage = pathname === "/login";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果是登录页面或用户未认证，直接渲染内容（不带侧边栏）
  if (isLoginPage || !isAuthenticated) {
    return <>{children}</>;
  }

  // 已认证用户显示带侧边栏的布局
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">
        <div className="sticky top-0 z-50 bg-background border-b p-2">
          <SidebarTrigger />
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}

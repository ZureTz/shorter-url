"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { usePathname } from "next/navigation";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 检查当前路径是否需要隐藏侧边栏
  const noSideBar = pathname === "/login" || pathname === "/register" || pathname === "/reset-password";

  // 如果是登录、注册或重置密码页面，或者用户未认证，则不显示侧边栏
  if (noSideBar) {
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

"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  // 显示带侧边栏的布局
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

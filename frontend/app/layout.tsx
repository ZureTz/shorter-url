import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

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
          {/* Sidebar with trigger and main content */}
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 w-full flex flex-col h-screen overflow-hidden">
              <div className="sticky top-0 z-50 bg-background border-b p-2">
                <SidebarTrigger />
              </div>
              <div className="flex-1 overflow-auto">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import { ThemeProvider } from "@/components/theme-provider";
import { LayoutContent } from "@/components/layout-content";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Toaster } from "sonner";

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

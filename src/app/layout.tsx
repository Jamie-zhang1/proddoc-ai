import type { Metadata } from "next";
import type { Viewport } from "next";
import { AppHeader } from "@/components/app-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineIndicator } from "@/components/offline-indicator";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProdDoc AI",
  description: "通用软件产品说明书与操作文档生成工作台",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

function ServiceWorkerRegistration() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration failed silently
    });
  }
  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <ServiceWorkerRegistration />
        <ThemeProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <AppHeader />
              {children}
            </ErrorBoundary>
            <OfflineIndicator />
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Copy, RefreshCw } from "lucide-react";

function isDataError(error: Error): boolean {
  const msg = error.message?.toLowerCase() || "";
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("json") ||
    msg.includes("data")
  );
}

async function copyErrorInfo(error: Error, errorInfo: ErrorInfo | null) {
  const text = [
    `Error: ${error.message}`,
    error.stack ? `Stack: ${error.stack}` : "",
    errorInfo?.componentStack ? `Component Stack: ${errorInfo.componentStack}` : "",
    `Time: ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null, copied: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  private handleCopy = async () => {
    const { error, errorInfo } = this.state;
    if (!error) return;
    const success = await copyErrorInfo(error, errorInfo);
    if (success) this.setState({ copied: true });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, errorInfo, copied } = this.state;
      const isDev = typeof process !== "undefined" && process.env?.NODE_ENV === "development";
      const isData = error ? isDataError(error) : false;

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle className="size-7" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {isData ? "数据加载失败" : "页面渲染出错"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {isData
                ? "无法加载或解析数据，请检查网络连接后重试。"
                : "发生了一个意外错误，请尝试重新加载页面。"}
            </p>

            {error ? (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
                {error.message}
              </p>
            ) : null}

            {isDev && errorInfo?.componentStack ? (
              <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-slate-100 p-3 text-left text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {error?.stack}
                {errorInfo.componentStack}
              </pre>
            ) : null}

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
              >
                <RefreshCw className="size-4" />
                重试
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={this.handleCopy}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Copy className="size-4" />
                  {copied ? "已复制" : "复制错误信息"}
                </button>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  重新加载
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

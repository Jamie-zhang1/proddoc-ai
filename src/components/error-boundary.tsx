"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400">
              <AlertTriangle className="size-7" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

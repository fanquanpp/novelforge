// 错误边界组件
// 捕获子组件渲染中的异常，展示降级 UI 防止白屏

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-nf-bg text-nf-text">
          <h2 className="text-lg font-semibold mb-2">页面渲染异常</h2>
          <p className="text-sm text-nf-text-secondary mb-4 max-w-md text-center">
            {this.state.error?.message || "发生了未知错误"}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-fandex-primary text-nf-text-inverse text-sm hover:bg-fandex-primary-hover transition-fast"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

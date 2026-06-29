// 共享状态展示组件
//
// 功能概述：
// 提供统一的加载、错误、空状态展示组件，确保应用内各模块
// 使用一致的视觉语言与交互模式。
//
// 模块职责：
// 1. LoadingSpinner: 加载中动画
// 2. ErrorMessage: 错误信息展示（含重试按钮）
// 3. EmptyState: 空状态占位（含操作按钮）

import { Loader2, AlertTriangle, FileText } from "lucide-react";

// 加载中旋转指示器
export function LoadingSpinner({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-nf-bg">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-fandex-primary" />
        <span className="text-sm text-nf-text-tertiary">{text}</span>
      </div>
    </div>
  );
}

// 错误信息展示（含重试按钮）
export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-nf-bg">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center">
        <AlertTriangle className="w-10 h-10 text-fandex-tertiary" />
        <p className="text-sm text-red-400">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-sm text-fandex-primary border border-fandex-primary/30 hover:bg-fandex-primary/10 transition-fast"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}

// 空状态占位
export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-nf-bg">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center">
        <Icon className="w-12 h-12 text-nf-border" />
        <p className="text-sm font-medium text-nf-text">{title}</p>
        {description && (
          <p className="text-xs text-nf-text-tertiary">{description}</p>
        )}
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-fandex-primary border border-fandex-primary hover:bg-fandex-primary/10 transition-fast"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

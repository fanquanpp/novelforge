// 快捷键参考面板
//
// 功能概述：
// 按 `?` 键弹出快捷键参考面板，展示所有可用快捷键及其功能描述。
// 采用 FANDEX 直角美学，分类展示编辑器、全局、侧边栏快捷键。

import { useEffect, useState, useCallback } from "react";
import { X, Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; desc: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "编辑器",
    shortcuts: [
      { keys: "Ctrl + B", desc: "加粗" },
      { keys: "Ctrl + I", desc: "斜体" },
      { keys: "Ctrl + U", desc: "下划线" },
      { keys: "Ctrl + 1", desc: "一级标题" },
      { keys: "Ctrl + 2", desc: "二级标题" },
      { keys: "Ctrl + Shift + P", desc: "诗歌排版" },
      { keys: "Ctrl + Shift + L", desc: "歌词排版" },
      { keys: "Ctrl + Z", desc: "撤销" },
      { keys: "Ctrl + Shift + Z", desc: "重做" },
      { keys: "Ctrl + S", desc: "保存" },
      { keys: "Tab", desc: "剧本模式呼出角色" },
    ],
  },
  {
    title: "全局",
    shortcuts: [
      { keys: "?", desc: "打开/关闭快捷键面板" },
      { keys: "Ctrl + K", desc: "命令面板" },
      { keys: "Ctrl + Shift + F", desc: "全局搜索" },
      { keys: "Escape", desc: "关闭面板/返回" },
      { keys: "F11", desc: "切换聚焦模式" },
    ],
  },
  {
    title: "侧边栏导航",
    shortcuts: [
      { keys: "Alt + 1", desc: "正文" },
      { keys: "Alt + 2", desc: "大纲" },
      { keys: "Alt + 3", desc: "角色" },
      { keys: "Alt + 4", desc: "世界观" },
      { keys: "Alt + 5", desc: "名词" },
      { keys: "Alt + 6", desc: "素材" },
      { keys: "Alt + 7", desc: "时间线" },
      { keys: "Alt + 8", desc: "统计" },
    ],
  },
];

const STORAGE_KEY = "novelforge-shortcuts-seen";

export default function ShortcutPanel() {
  const [open, setOpen] = useState(false);

  // 第一次打开时自动弹出
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen && typeof window !== "undefined") {
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(STORAGE_KEY, "1");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 在输入框内不触发
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    },
    [open]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-nf-bg-card border border-nf-border-light shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nf-border-light">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-4 h-4 text-fandex-primary" />
            <h2 className="fandex-bar-left text-lg font-bold font-display text-nf-text">
              快捷键参考
            </h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-nf-bg-hover text-nf-text-tertiary hover:text-nf-text transition-fast"
            aria-label="关闭快捷键面板"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 — 分类快捷键 */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-5">
          <p className="text-xs text-nf-text-tertiary leading-relaxed">
            按 <kbd className="px-1.5 py-0.5 bg-nf-bg-hover border border-nf-border-light rounded text-nf-text text-[11px] font-mono">?</kbd> 随时打开此面板
          </p>

          {SHORTCUTS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold font-display text-nf-text-secondary uppercase tracking-wider mb-2.5">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((sc) => (
                  <div
                    key={sc.keys + sc.desc}
                    className="flex items-center justify-between py-1.5 px-2 hover:bg-nf-bg-hover transition-fast"
                  >
                    <span className="text-sm text-nf-text">{sc.desc}</span>
                    <div className="flex gap-1">
                      {sc.keys.split(" + ").map((k, i, arr) => (
                        <span key={i} className="flex items-center">
                          <kbd className="px-1.5 py-0.5 bg-nf-bg-hover border border-nf-border-light text-[11px] font-mono text-nf-text-secondary">
                            {k}
                          </kbd>
                          {i < arr.length - 1 && (
                            <span className="text-[10px] text-nf-text-tertiary mx-0.5">
                              +
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-3 border-t border-nf-border-light text-center">
          <span className="text-xs text-nf-text-tertiary">
            此面板仅在首次使用时自动弹出，之后按 <kbd className="px-1 py-0.5 bg-nf-bg-hover border border-nf-border-light rounded text-[10px] font-mono text-nf-text-secondary">?</kbd> 打开
          </span>
        </div>
      </div>
    </div>
  );
}

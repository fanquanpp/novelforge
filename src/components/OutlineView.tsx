// 编辑器大纲视图
//
// 功能概述：
// 从编辑器的 HTML 内容中提取各级标题（H1/H2），
// 生成可点击的文档大纲，点击可滚动到对应标题位置。
// 用于辅助长文档导航。
//
// 模块职责：
// 1. 解析编辑器内容提取标题
// 2. 渲染标题树形大纲
// 3. 点击导航到对应位置

import { useState, useEffect, useMemo } from "react";
import { ListTree, Hash, X } from "lucide-react";

interface Heading {
  level: 1 | 2;
  text: string;
  id: string;
}

function extractHeadingsFromHtml(htmlContent: string): Heading[] {
  if (!htmlContent) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const headings: Heading[] = [];

  const elements = doc.querySelectorAll("h1, h2");
  elements.forEach((el, idx) => {
    const text = el.textContent?.trim() || "";
    if (!text) return;
    const level = el.tagName === "H1" ? 1 : 2;
    const id = `outline-h-${idx}`;
    headings.push({ level, text, id });
  });

  return headings;
}

interface OutlineViewProps {
  htmlContent: string;
}

export default function OutlineView({ htmlContent }: OutlineViewProps) {
  const [collapsed, setCollapsed] = useState(false);

  // 基于传入 htmlContent 实时计算标题（纯数据驱动，无 DOM 查询竞态）
  const headings = useMemo(() => extractHeadingsFromHtml(htmlContent), [htmlContent]);

  // 当 htmlContent 变化时，同步 id 到真实 DOM 以便 scrollIntoView 工作
  useEffect(() => {
    if (!htmlContent) return;
    const headingsList = extractHeadingsFromHtml(htmlContent);
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;
    const realHeadings = editorEl.querySelectorAll("h1, h2");
    realHeadings.forEach((el, idx) => {
      if (idx < headingsList.length) {
        el.setAttribute("id", headingsList[idx].id);
      }
    });
  }, [htmlContent]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fandex-nav-blur absolute right-2 bottom-2 p-1.5 border border-nf-border-light bg-nf-bg-card hover:bg-nf-bg-hover transition-fast z-10"
        title="打开大纲"
      >
        <ListTree className="w-4 h-4 text-nf-text-tertiary" />
      </button>
    );
  }

  return (
    <div className="absolute right-2 top-2 bottom-2 w-52 bg-nf-bg-card border border-nf-border-light shadow-lg flex flex-col z-10 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-nf-border-light flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <ListTree className="w-3.5 h-3.5 text-fandex-primary" />
          <span className="text-xs font-medium font-display text-nf-text">大纲</span>
          <span className="text-[10px] text-nf-text-tertiary font-mono">
            {headings.length}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-nf-text-tertiary hover:text-nf-text transition-fast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto py-1">
        {headings.length === 0 ? (
          <div className="px-3 py-4 text-center text-[11px] text-nf-text-tertiary">
            当前文档暂无标题
            <br />
            <span className="text-[10px]">使用 Ctrl+1 / Ctrl+2 添加标题</span>
          </div>
        ) : (
          headings.map((h) => (
            <button
              key={h.id}
              onClick={() => handleClick(h.id)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-left text-nf-text hover:bg-nf-bg-hover transition-fast truncate"
              style={{ paddingLeft: h.level === 1 ? "12px" : "24px" }}
              title={h.text}
            >
              <Hash className="w-3 h-3 text-nf-text-tertiary flex-shrink-0" />
              <span
                className={`truncate ${
                  h.level === 1 ? "font-medium text-nf-text" : "text-nf-text-secondary"
                }`}
              >
                {h.text}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

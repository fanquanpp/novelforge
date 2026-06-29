// 编辑器工具栏组件
//
// 功能概述：
// 提供 TipTap 编辑器的格式化工具栏，包含加粗、斜体、标题、
// 列表、引用、诗歌/歌词排版、撤销/重做等按钮，以及保存状态指示。
// 采用 FANDEX 直角按钮 + 毛玻璃风格。
//
// 模块职责：
// 1. ToolbarButton: 通用工具栏按钮
// 2. Divider: 分隔符
// 3. EditorToolbar: 完整的工具栏组件

import type { Editor } from "@tiptap/core";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Save,
  Loader2,
  Download,
  Music,
  Pilcrow,
} from "lucide-react";

// 工具栏按钮属性
interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}

// 工具栏按钮 - FANDEX 直角风格
export function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 transition-fast border ${
        active
          ? "bg-fandex-primary/10 text-fandex-primary border-fandex-primary"
          : "text-nf-text-tertiary hover:text-nf-text hover:bg-nf-bg-hover border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

// 分隔符
export function Divider() {
  return <div className="w-px h-5 bg-nf-border-light mx-1" />;
}

// 工具栏属性
interface EditorToolbarProps {
  editor: Editor | null;
  wordCount: number;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onExportTxt: () => void;
  focusMode?: boolean;
}

// 编辑器工具栏组件
export default function EditorToolbar({
  editor,
  wordCount,
  dirty,
  saving,
  onSave,
  onExportTxt,
  focusMode = false,
}: EditorToolbarProps) {
  const dispatchEditorEvent = (key: string, ctrlKey: boolean, shiftKey: boolean) => {
    const event = new KeyboardEvent("keydown", {
      key,
      ctrlKey,
      shiftKey,
      bubbles: true,
    });
    document.querySelector(".ProseMirror")?.dispatchEvent(event);
  };

  return (
    <div className="fandex-nav-blur flex items-center gap-1 px-4 py-2 border-b border-nf-border-light">
      {/* 聚焦模式下隐藏格式化按钮，仅保留状态和保存 */}
      {!focusMode && (
        <>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive("bold") || false}
            title="加粗"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive("italic") || false}
            title="斜体"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor?.isActive("heading", { level: 1 }) || false}
            title="一级标题"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor?.isActive("heading", { level: 2 }) || false}
            title="二级标题"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive("bulletList") || false}
            title="无序列表"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive("orderedList") || false}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive("blockquote") || false}
            title="引用"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => dispatchEditorEvent("P", true, true)}
            active={false}
            title="诗歌排版 (Ctrl+Shift+P)"
          >
            <Pilcrow className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => dispatchEditorEvent("L", true, true)}
            active={false}
            title="歌词排版 (Ctrl+Shift+L)"
          >
            <Music className="w-4 h-4" />
          </ToolbarButton>
          <Divider />
          <ToolbarButton
            onClick={() => editor?.chain().focus().undo().run()}
            active={false}
            title="撤销"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().redo().run()}
            active={false}
            title="重做"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </>
      )}

      {/* 右侧状态区 */}
      <div className="ml-auto flex items-center gap-3 text-xs text-nf-text-tertiary">
        <span>{wordCount} 字</span>
        {dirty && <span className="text-fandex-tertiary">未保存</span>}
        {!focusMode && (
          <button
            onClick={onExportTxt}
            title="导出为 TXT"
            className="flex items-center gap-1 px-2 py-1 text-fandex-secondary border border-fandex-secondary/30 hover:bg-fandex-secondary/10 transition-fast"
          >
            <Download className="w-3.5 h-3.5" />
            TXT
          </button>
        )}
        <button
          onClick={onSave}
          disabled={!dirty || saving}
          className="flex items-center gap-1 px-2 py-1 bg-fandex-primary hover:bg-fandex-primary-hover text-nf-text-inverse transition-fast disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          保存
        </button>
      </div>
    </div>
  );
}

// TipTap 富文本编辑器组件
//
// 功能概述：
// 基于 TipTap 的小说创作编辑器，支持富文本编辑、自动保存、
// 字数统计等功能。适配 FANDEX 暗黑主题。
//
// 模块职责：
// 1. 提供 TipTap 编辑器实例
// 2. 自动加载与保存文件内容
// 3. 实时统计字数
// 4. 工具栏: 加粗/斜体/标题/列表/引用等

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { readFile, writeFile } from "../lib/api";

// 编辑器属性接口
interface NovelEditorProps {
  // 文件绝对路径
  filePath: string | null;
}

// TipTap 富文本编辑器组件
// 输入: filePath 文件路径
// 输出: 渲染编辑器界面
// 流程:
//   1. 文件路径变化时加载内容
//   2. 用户编辑时实时统计字数
//   3. Ctrl+S 或自动保存时写入文件
export default function NovelEditor({ filePath }: NovelEditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState("");

  // 创建 TipTap 编辑器实例
  // 输入: 无
  // 输出: Editor 实例
  // 流程: 配置扩展与占位文本
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "开始你的创作...",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[60vh] px-8 py-6 leading-loose",
      },
    },
    onUpdate: () => {
      setDirty(true);
      updateWordCount();
    },
  });

  // 更新字数统计
  // 输入: 无
  // 输出: 无
  // 流程: 从编辑器获取文本并统计中文字符与英文单词
  const updateWordCount = useCallback(() => {
    if (!editor) return;
    const text = editor.getText();
    let count = 0;
    let inWord = false;
    for (const ch of text) {
      if (
        ("\u4E00" <= ch && ch <= "\u9FFF") ||
        ("\u3400" <= ch && ch <= "\u4DBF")
      ) {
        count += 1;
        inWord = false;
      } else if (/[a-zA-Z]/.test(ch)) {
        if (!inWord) {
          count += 1;
          inWord = true;
        }
      } else {
        inWord = false;
      }
    }
    setWordCount(count);
  }, [editor]);

  // 加载文件内容
  // 输入: 无
  // 输出: 无
  // 流程: 文件路径变化时读取文件并设置编辑器内容
  useEffect(() => {
    if (!editor || !filePath) {
      editor?.commands.clearContent();
      setWordCount(0);
      setDirty(false);
      return;
    }

    setLoadError("");
    readFile(filePath)
      .then((content) => {
        // 将 Markdown 文本转换为 HTML(简化处理: 保留换行)
        const html = markdownToHtml(content);
        editor.commands.setContent(html);
        setDirty(false);
        updateWordCount();
      })
      .catch((e) => {
        setLoadError(`加载文件失败: ${e}`);
      });
  }, [filePath, editor, updateWordCount]);

  // 保存文件
  // 输入: 无
  // 输出: 无
  // 流程: 将编辑器内容转换为 Markdown 并写入文件
  const handleSave = useCallback(async () => {
    if (!editor || !filePath || !dirty) return;
    setSaving(true);
    try {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      await writeFile(filePath, markdown);
      setDirty(false);
    } catch (e) {
      setLoadError(`保存失败: ${e}`);
    } finally {
      setSaving(false);
    }
  }, [editor, filePath, dirty]);

  // 键盘快捷键: Ctrl+S 保存
  // 输入: 无
  // 输出: 无
  // 流程: 监听 keydown 事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // 自动保存: 每 30 秒保存一次
  // 输入: 无
  // 输出: 无
  // 流程: 设置定时器调用 handleSave
  useEffect(() => {
    if (!filePath || !dirty) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 30000);
    return () => clearTimeout(timer);
  }, [filePath, dirty, handleSave]);

  // 组件卸载时销毁编辑器
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!filePath) {
    return (
      <div className="flex-1 flex items-center justify-center bg-nf-bg text-nf-text-tertiary">
        <div className="text-center">
          <p className="text-sm">从左侧选择或创建一个文件开始编辑</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-nf-bg">
        <div className="text-center text-red-400 text-sm">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-nf-bg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-nf-border-light bg-nf-bg-sidebar">
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

        {/* 右侧保存按钮与状态 */}
        <div className="ml-auto flex items-center gap-3 text-xs text-nf-text-tertiary">
          <span>{wordCount} 字</span>
          {dirty && <span className="text-fandex-tertiary">未保存</span>}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1 px-2 py-1 rounded text-fandex-primary hover:bg-nf-bg-hover transition-fast disabled:opacity-30 disabled:cursor-not-allowed"
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

      {/* 编辑器内容区 */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// 工具栏按钮组件
// 输入: onClick, active, title, children
// 输出: 渲染按钮
function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-fast ${
        active
          ? "bg-fandex-primary/20 text-fandex-primary"
          : "text-nf-text-tertiary hover:text-nf-text hover:bg-nf-bg-hover"
      }`}
    >
      {children}
    </button>
  );
}

// 分隔符组件
function Divider() {
  return <div className="w-px h-5 bg-nf-border-light mx-1" />;
}

// Markdown 转 HTML(简化版)
// 输入: md Markdown 文本
// 输出: HTML 字符串
// 流程: 将基本 Markdown 语法转换为 HTML
function markdownToHtml(md: string): string {
  if (!md) return "";
  let html = md;
  // 标题转换
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // 加粗与斜体
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // 引用
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  // 无序列表
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  // 段落(双换行)
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;
  // 清理空段落
  html = html.replace(/<p><\/p>/g, "");
  return html;
}

// HTML 转 Markdown(简化版)
// 输入: html HTML 字符串
// 输出: Markdown 文本
// 流程: 将 HTML 转换回 Markdown
function htmlToMarkdown(html: string): string {
  if (!html) return "";
  let md = html;
  // 标题转换
  md = md.replace(/<h1>(.+?)<\/h1>/g, "# $1\n\n");
  md = md.replace(/<h2>(.+?)<\/h2>/g, "## $1\n\n");
  md = md.replace(/<h3>(.+?)<\/h3>/g, "### $1\n\n");
  // 加粗与斜体
  md = md.replace(/<strong>(.+?)<\/strong>/g, "**$1**");
  md = md.replace(/<em>(.+?)<\/em>/g, "*$1*");
  // 引用
  md = md.replace(/<blockquote>(.+?)<\/blockquote>/g, "> $1\n\n");
  // 列表
  md = md.replace(/<li>(.+?)<\/li>/g, "- $1\n");
  // 段落
  md = md.replace(/<p>(.*?)<\/p>/g, "$1\n\n");
  // 清理 HTML 标签
  md = md.replace(/<[^>]+>/g, "");
  // 解码 HTML 实体
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&amp;/g, "&");
  // 压缩多余空行
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

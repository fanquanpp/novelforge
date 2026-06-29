// 卡片管理组件
//
// 功能概述：
// 用于角色、世界观、名词等分类的卡片式管理界面。
// 支持卡片的增删改查，每个卡片展开后占用整个编辑区。
//
// 模块职责：
// 1. 渲染卡片网格列表
// 2. 支持新建卡片
// 3. 点击卡片进入编辑模式
// 4. 编辑模式下支持保存与返回

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Plus, Trash2, ChevronLeft, Save, FileText } from "lucide-react";
import { useAppStore, CATEGORY_DIRS } from "../lib/store";
import { readProjectTree, createFile, deletePath, readFile, writeFile } from "../lib/api";
import type { FileNode } from "../lib/api";
import { findDirByName } from "../lib/fileTreeUtils";

// 卡片管理属性接口
interface CardManagerProps {
  // 卡片类型标签(如"角色"、"世界观")
  categoryLabel: string;
}

// 卡片项接口
interface CardItem {
  // 文件节点
  node: FileNode;
  // 卡片标题(文件名去掉扩展名)
  title: string;
  // 卡片内容预览
  preview: string;
}

// 卡片管理组件
// 输入: categoryLabel 分类标签
// 输出: 渲染卡片网格或卡片编辑界面
// 流程:
//   1. 加载当前分类目录下的文件作为卡片
//   2. 点击卡片进入编辑模式
//   3. 编辑模式下使用 TipTap 编辑器
export default function CardManager({ categoryLabel }: CardManagerProps) {
  const { currentProject, activeCategory } = useAppStore();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // TipTap 编辑器实例（卡片编辑模式）
  const cardEditor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "开始编辑卡片内容..." }),
    ],
    content: "",
    onUpdate: () => setDirty(true),
  });

  // 退出编辑时重置
  useEffect(() => {
    if (!editingCard) {
      setDirty(false);
      setEditContent("");
    }
  }, [editingCard]);

  // 编辑器就绪后同步内容（避免 setTimeout 竞态）
  useEffect(() => {
    if (editingCard && cardEditor && editContent) {
      cardEditor.commands.setContent(simpleMdToHtml(editContent));
    }
  }, [editingCard, !!cardEditor]);

  // 加载卡片列表
  // 输入: 无
  // 输出: 无
  // 流程: 从项目目录树中过滤当前分类的文件
  const loadCards = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      const tree = await readProjectTree(currentProject.path);
      const dirName = CATEGORY_DIRS[activeCategory];
      // 查找当前分类目录
      const dir = findDirByName(tree, dirName);
      const files = dir?.children.filter((f) => !f.is_dir) || [];

      // 加载每个文件的预览
      const cardItems: CardItem[] = [];
      for (const file of files) {
        try {
          const content = await readFile(
            `${currentProject.path}\\${file.relative_path}`
          );
          cardItems.push({
            node: file,
            title: file.name.replace(/\.(md|txt)$/i, ""),
            preview: content.slice(0, 100).replace(/[#*\n]/g, " ").trim(),
          });
        } catch {
          cardItems.push({
            node: file,
            title: file.name.replace(/\.(md|txt)$/i, ""),
            preview: "",
          });
        }
      }
      setCards(cardItems);
    } catch (e) {
      console.error("加载卡片失败:", e);
    } finally {
      setLoading(false);
    }
  }, [currentProject, activeCategory]);

  // 初始化加载
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // 新建卡片
  // 输入: 无
  // 输出: 无
  // 流程: 创建新文件并刷新列表
  const handleCreateCard = async () => {
    if (!currentProject) return;
    const title = prompt(`输入${categoryLabel}名称:`);
    if (!title) return;
    try {
      const dirName = CATEGORY_DIRS[activeCategory];
      await createFile(currentProject.path, `${dirName}/${title}.md`, `# ${title}\n\n`);
      await loadCards();
    } catch (e) {
      alert(`创建失败: ${e}`);
    }
  };

  // 删除卡片
  // 输入: card 卡片项, e 事件
  // 输出: 无
  // 流程: 确认后删除文件并刷新
  const handleDeleteCard = async (card: CardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;
    if (!confirm(`确定删除 "${card.title}" 吗?`)) return;
    try {
      await deletePath(`${currentProject.path}\\${card.node.relative_path}`);
      await loadCards();
    } catch (e) {
      alert(`删除失败: ${e}`);
    }
  };

  // 打开卡片编辑 — 加载内容到 TipTap 编辑器
  // 输入: card 卡片项
  // 输出: 无
  const handleOpenCard = async (card: CardItem) => {
    if (!currentProject) return;
    try {
      const content = await readFile(
        `${currentProject.path}\\${card.node.relative_path}`
      );
      setEditingCard(card);
      setEditContent(content);
      setDirty(false);
    } catch (e) {
      alert(`加载失败: ${e}`);
    }
  };

  // 保存卡片 — 将 TipTap HTML 转为 Markdown 写入文件
  // 输入: 无
  // 输出: 无
  const handleSave = async () => {
    if (!currentProject || !editingCard || !cardEditor || saving) return;
    setSaving(true);
    try {
      const md = simpleHtmlToMd(cardEditor.getHTML());
      await writeFile(
        `${currentProject.path}\\${editingCard.node.relative_path}`,
        md
      );
      setDirty(false);
      await loadCards();
    } catch (e) {
      alert(`保存失败: ${e}`);
    } finally {
      setSaving(false);
    }
  };

  // 编辑模式
  if (editingCard) {
    return (
      <div className="flex-1 flex flex-col bg-nf-bg overflow-hidden">
        {/* 顶部工具栏 - FANDEX 左侧色条标题 */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-nf-border-light bg-nf-bg-sidebar">
          <button
            onClick={() => {
              setEditingCard(null);
              loadCards();
            }}
            className="flex items-center gap-1 text-sm text-nf-text-tertiary hover:text-fandex-primary transition-fast"
          >
            <ChevronLeft className="w-4 h-4" />
            返回列表
          </button>
          <h2 className="fandex-bar-left text-sm font-bold font-display text-nf-text">{editingCard.title}</h2>
          <div className="ml-auto flex items-center gap-2">
            {dirty && <span className="text-xs text-fandex-tertiary">未保存</span>}
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-fandex-primary hover:bg-fandex-primary-hover text-nf-text-inverse transition-fast disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>

        {/* TipTap 富文本编辑区 */}
        <div className="flex-1 overflow-y-auto">
          <EditorContent
            editor={cardEditor}
            className="prose prose-invert max-w-none min-h-full px-8 py-6 leading-loose"
          />
        </div>
      </div>
    );
  }

  // 列表模式
  return (
    <div className="flex-1 flex flex-col bg-nf-bg overflow-hidden">
      {/* 顶部标题栏 - FANDEX 左侧色条 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-nf-border-light">
        <h2 className="fandex-bar-left text-lg font-bold font-display text-nf-text">{categoryLabel}</h2>
        <button
          onClick={handleCreateCard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-fandex-primary hover:bg-fandex-primary-hover text-nf-text-inverse transition-fast"
        >
          <Plus className="w-4 h-4" />
          新建{categoryLabel}
        </button>
      </div>

      {/* 卡片网格 - FANDEX 1px 间距网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-nf-text-tertiary text-sm">
            加载中...
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-nf-border mb-4" />
            <p className="text-sm text-nf-text-tertiary mb-4">
              暂无{categoryLabel}，点击右上角新建
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-1 bg-nf-border-light border border-nf-border-light">
            {cards.map((card) => (
              <div
                key={card.node.relative_path}
                role="button"
                tabIndex={0}
                onClick={() => handleOpenCard(card)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenCard(card);
                  }
                }}
                className="group relative bg-nf-bg hover:bg-nf-bg-hover p-4 cursor-pointer transition-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-fandex-primary focus-visible:outline-offset-[-2px]"
              >
                {/* 删除按钮 */}
                <button
                  onClick={(e) => handleDeleteCard(card, e)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-nf-text-tertiary hover:text-red-400 transition-fast"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* 卡片标题 - FANDEX 左侧色条 */}
                <h3 className="fandex-bar-left text-sm font-bold font-display text-nf-text mb-2 pr-6 truncate">
                  {card.title}
                </h3>

                {/* 内容预览 */}
                <p className="text-xs text-nf-text-tertiary line-clamp-3 leading-relaxed">
                  {card.preview || "暂无内容"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 简易 Markdown → HTML（供卡片的 TipTap 编辑器使用）
function simpleMdToHtml(md: string): string {
  if (!md) return "<p></p>";
  let html = md;
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\n\n/g, "</p><p>");
  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, "");
  return html;
}

// 简易 HTML → Markdown（从 TipTap 编辑器导出）
function simpleHtmlToMd(html: string): string {
  if (!html) return "";
  let md = html;
  md = md.replace(/<h1>(.+?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2>(.+?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3>(.+?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<strong>(.+?)<\/strong>/gi, "**$1**");
  md = md.replace(/<em>(.+?)<\/em>/gi, "*$1*");
  md = md.replace(/<code>(.+?)<\/code>/gi, "`$1`");
  md = md.replace(/<blockquote>(.+?)<\/blockquote>/gi, "> $1\n\n");
  md = md.replace(/<li>(.+?)<\/li>/gi, "- $1\n");
  md = md.replace(/<a\s+href="(.+?)">(.+?)<\/a>/gi, "[$2]($1)");
  md = md.replace(/<p>(.+?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

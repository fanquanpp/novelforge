// TipTap 富文本编辑器组件
//
// 功能概述：
// 基于 TipTap 的小说创作编辑器，支持富文本编辑、自动保存、
// 字数统计、特色自动化功能（剧本角色名/散文缩进/诗歌排版）、
// TXT 导出、大纲视图、聚焦模式。适配 FANDEX 暗黑主题。
//
// 模块职责：
// 1. 提供 TipTap 编辑器实例
// 2. 自动加载与保存文件内容
// 3. 实时统计字数
// 4. 根据项目类型加载特色扩展
// 5. 支持 TXT 导出、大纲视图、聚焦模式

import { useEditor, EditorContent } from "@tiptap/react";
import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { readFile, writeFile } from "../lib/api";
import { useAppStore } from "../lib/store";
import { CharacterMention } from "../lib/characterMention";
import { IndentParagraph } from "../lib/indentParagraph";
import { PoetryFormat } from "../lib/poetryFormat";
import { markdownToHtml, htmlToMarkdown } from "../lib/markdownConverter";
import { countWords } from "../lib/wordCounter";
import { addRecentFile } from "../lib/recentFiles";
import { useToast } from "../lib/toast";
import EditorToolbar from "./EditorToolbar";
import OutlineView from "./OutlineView";

interface NovelEditorProps {
  filePath: string | null;
  focusMode?: boolean;
  focusTimerActive?: boolean;
}

export default function NovelEditor({
  filePath,
  focusMode = false,
  focusTimerActive = false,
}: NovelEditorProps) {
  const { currentProject } = useAppStore();
  const [wordCount, setWordCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [characters, setCharacters] = useState<string[]>([]);
  const [editorHtml, setEditorHtml] = useState("");
  const { showToast } = useToast();

  const projectType = currentProject?.meta?.type || "standard";
  const isScript = projectType === "script";
  const isEssay = projectType === "essay";

  // 加载剧本角色名列表
  useEffect(() => {
    if (!isScript || !currentProject) {
      setCharacters([]);
      return;
    }
    const rosterPath = `${currentProject.path}\\角色\\角色名册.md`;
    readFile(rosterPath)
      .then((content) => {
        const names = content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(
            (line) =>
              line &&
              !line.startsWith("#") &&
              !line.startsWith(">") &&
              !line.startsWith("-") &&
              !/^[-=]{3,}$/.test(line)
          );
        setCharacters(names);
      })
      .catch(() => {
        setCharacters([]);
      });
  }, [isScript, currentProject]);

  // 构建 TipTap 扩展列表
  const extensions: Extensions = useMemo(() => {
    const exts: Extensions = [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "开始你的创作..." }),
    ];

    if (isEssay) {
      exts.push(IndentParagraph.configure({ enabled: true }));
    }

    if (isScript) {
      exts.push(
        CharacterMention.configure({
          characters,
          onSelect: () => {},
        })
      );
    }

    exts.push(PoetryFormat.configure({ enabled: true }));
    return exts;
  }, [isEssay, isScript, characters]);

  // 创建编辑器实例
  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[60vh] px-8 py-6 leading-loose",
      },
    },
    onUpdate: () => {
      setDirty(true);
      if (editor) {
        setWordCount(countWords(editor.getText()));
        setEditorHtml(editor.getHTML());
      }
    },
  });

  // 加载文件内容
  useEffect(() => {
    if (!editor || !filePath) {
      editor?.commands.clearContent();
      setWordCount(0);
      setDirty(false);
      setEditorHtml("");
      return;
    }

    setLoadError("");
    readFile(filePath)
      .then((content) => {
        editor.commands.setContent(markdownToHtml(content));
        setDirty(false);
        setWordCount(countWords(editor.getText()));
        setEditorHtml(editor.getHTML());
        // 记录最近文件
        const relativePath = filePath.replace(currentProject?.path + "\\" || "", "");
        const fileName = relativePath.split(/[\\/]/).pop() || relativePath;
        addRecentFile({
          name: fileName,
          relative_path: relativePath,
          project_name: currentProject?.meta?.name || "",
          project_path: currentProject?.path || "",
        });
      })
      .catch((e) => {
        setLoadError(`加载文件失败: ${e}`);
      });
  }, [filePath, editor, currentProject]);

  // 保存文件（含外部修改冲突检测）
  const lastSavedContentRef = useRef("");
  const handleSave = useCallback(async () => {
    if (!editor || !filePath || !dirty || saving) return;
    setSaving(true);
    autoSavePendingRef.current = true;
    try {
      try {
        const currentContent = await readFile(filePath);
        if (
          lastSavedContentRef.current &&
          currentContent !== lastSavedContentRef.current
        ) {
          const overwrite = confirm(
            '文件已被外部修改，是否覆盖保存？\n\n选择「确定」将覆盖外部修改，选择「取消」将跳过本次保存。'
          );
          if (!overwrite) {
            showToast("warning", "已取消保存（文件被外部修改）");
            return;
          }
        }
      } catch {
        // 文件可能不存在，跳过冲突检测
      }

      const markdown = htmlToMarkdown(editor.getHTML());
      await writeFile(filePath, markdown);
      lastSavedContentRef.current = markdown;
      setDirty(false);
      showToast("success", "已保存");
    } catch (e) {
      showToast("error", `保存失败: ${e}`);
    } finally {
      setSaving(false);
      autoSavePendingRef.current = false;
    }
  }, [editor, filePath, dirty, saving, showToast]);

  // 初始化 lastSavedContent
  useEffect(() => {
    if (editor && filePath) {
      readFile(filePath)
        .then((content) => {
          lastSavedContentRef.current = content;
        })
        .catch(() => {});
    }
  }, [editor, filePath]);

  // 导出 TXT
  const handleExportTxt = useCallback(async () => {
    if (!editor) return;
    try {
      const text = editor.getText();
      let txtName = "导出.txt";
      if (filePath) {
        const baseName = filePath.split(/[\\/]/).pop() || "导出";
        txtName = baseName.replace(/\.(md|markdown|txt)$/i, "") + ".txt";
      }
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = txtName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("success", `已导出: ${txtName}`);
    } catch (e) {
      showToast("error", `导出失败: ${e}`);
    }
  }, [editor, filePath, showToast]);

  // Ctrl+S 快捷键
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

  // 自动保存: 30 秒
  const autoSavePendingRef = useRef(false);
  useEffect(() => {
    if (!filePath || !dirty) return;
    const timer = setTimeout(() => {
      if (!autoSavePendingRef.current) {
        handleSave();
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [filePath, dirty, handleSave]);

  // 卸载时销毁编辑器
  const editorRef = useRef(editor);
  editorRef.current = editor;
  useEffect(() => {
    return () => {
      editorRef.current?.destroy();
    };
  }, []);

  if (!filePath) {
    return (
      <div className="flex-1 flex items-center justify-center bg-nf-bg">
        <div className="text-center space-y-3" role="status">
          <p className="text-sm text-nf-text-tertiary">
            从左侧选择或创建一个文件开始编辑
          </p>
          <p className="text-xs text-nf-text-tertiary/60">
            按 <kbd className="px-1 py-0.5 bg-nf-bg-hover border border-nf-border-light rounded text-[10px] font-mono text-nf-text-secondary">Ctrl+K</kbd> 打开命令面板
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-nf-bg" role="alert">
        <div className="text-center text-red-400 text-sm">{loadError}</div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col bg-nf-bg overflow-hidden ${focusMode ? "fandex-focus-mode" : ""}`}
      role="region"
      aria-label={`编辑器 - ${filePath ? filePath.split(/[\\/]/).pop() : ""}`}
    >
      {/* 聚焦模式下简化工具栏 */}
      <EditorToolbar
        editor={editor}
        wordCount={wordCount}
        dirty={dirty}
        saving={saving}
        onSave={handleSave}
        onExportTxt={handleExportTxt}
        focusMode={focusMode}
      />

      {isScript && characters.length > 0 && (
        <div className="fandex-admonition fandex-admonition-note px-4 py-1.5 border-b border-nf-border-light text-xs text-nf-text-tertiary flex items-center gap-2">
          <span className="text-fandex-primary font-medium">剧本模式</span>
          <span>·</span>
          <span>
            在空行按 Tab 键呼出角色名选择（共 {characters.length} 个角色）
          </span>
        </div>
      )}

      {isEssay && (
        <div className="fandex-admonition fandex-admonition-tip px-4 py-1.5 border-b border-nf-border-light text-xs text-nf-text-tertiary flex items-center gap-2">
          <span className="text-fandex-secondary font-medium">散文模式</span>
          <span>·</span>
          <span>已启用首行双字缩进</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto relative">
        <EditorContent editor={editor} />
        {/* 大纲视图 — 编辑器右侧覆盖 */}
        {filePath && <OutlineView htmlContent={editorHtml} />}
      </div>
    </div>
  );
}

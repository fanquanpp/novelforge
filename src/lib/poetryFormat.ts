// 诗歌/歌词行内排版 TipTap 扩展
//
// 功能概述：
// 为诗歌/歌词类型内容提供行内排版功能，仅作用于用户选中的文字本身。
// 与粗体/斜体等行内格式一致：选中文本后点击工具栏按钮即可应用样式。
// 视觉表现为纯文本属性（字间距、斜体等），不引入任何块级装饰
// （无边框、无背景色、无圆角、无引用块效果），类似 Word 中给文字加样式。
//
// 模块职责：
// 1. 定义 PoetryMark / LyricsMark 两个行内 Mark 扩展
// 2. 提供 togglePoetry / toggleLyrics 命令供工具栏和快捷键调用
// 3. 监听 Ctrl+Shift+P / Ctrl+Shift+L 快捷键
//
// 设计说明：
// 原实现将诗歌/歌词作为段落级属性（data-poetry/data-lyrics）作用于整段，
// 并通过 CSS 添加边框/背景等块级装饰，视觉上类似 Markdown 引用块。
// 现改为行内 Mark，仅对选中文本生效，且只改变文字本身属性，
// 视觉表现保持纯文本风格，符合 Word 文档式的排版习惯。

import { Extension, Mark, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { toggleMark } from "@tiptap/pm/commands";
import type { EditorView } from "@tiptap/pm/view";
import type { MarkType } from "@tiptap/pm/model";

// ===== 类型扩展：为 TipTap Commands 添加自定义命令声明 =====
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    poetryFormat: {
      /** 切换选中文本的诗歌排版样式（行内 Mark） */
      togglePoetry: () => ReturnType;
      /** 切换选中文本的歌词排版样式（行内 Mark） */
      toggleLyrics: () => ReturnType;
    };
  }
}

// 诗歌排版扩展配置
export interface PoetryFormatOptions {
  /** 是否启用诗歌排版 */
  enabled: boolean;
}

/**
 * 诗歌排版 Mark 扩展
 * 仅作用于选中文本，纯文字属性样式（斜体 + 字间距加大）
 * 不包含任何块级装饰（无边框、无背景、无圆角）
 */
export const PoetryMark = Mark.create({
  name: "poetryMark",

  inclusive: true,

  parseHTML() {
    return [
      { tag: "span[data-poetry]" },
      { tag: "poetry" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-poetry": "true",
        class: "nf-poetry-text",
      }),
      0,
    ];
  },
});

/**
 * 歌词排版 Mark 扩展
 * 仅作用于选中文本，纯文字属性样式（字间距 + 字重调整）
 * 不包含任何块级装饰（无边框、无背景、无左侧粗边框）
 */
export const LyricsMark = Mark.create({
  name: "lyricsMark",

  inclusive: true,

  parseHTML() {
    return [
      { tag: "span[data-lyrics]" },
      { tag: "lyrics" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-lyrics": "true",
        class: "nf-lyrics-text",
      }),
      0,
    ];
  },
});

// 诗歌排版扩展（聚合 PoetryMark / LyricsMark，提供命令与快捷键）
export const PoetryFormat = Extension.create<PoetryFormatOptions>({
  name: "poetryFormat",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addExtensions() {
    return [PoetryMark, LyricsMark];
  },

  addCommands() {
    return {
      // 切换选中文本的诗歌样式：与粗体/斜体一致的行内 toggle 行为
      // 无选中文本时，设置当前光标状态，后续输入的文字将应用该样式
      togglePoetry:
        () =>
        ({ commands }) => {
          return commands.toggleMark("poetryMark");
        },

      // 切换选中文本的歌词样式：与粗体/斜体一致的行内 toggle 行为
      // 无选中文本时，设置当前光标状态，后续输入的文字将应用该样式
      toggleLyrics:
        () =>
        ({ commands }) => {
          return commands.toggleMark("lyricsMark");
        },
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const pluginKey = new PluginKey("poetryFormat");

    return [
      new Plugin({
        key: pluginKey,
        props: {
          handleKeyDown(view: EditorView, event: KeyboardEvent) {
            if (!options.enabled) return false;
            // Ctrl+Shift+P 切换诗歌样式（作用于选中文本）
            if (
              (event.ctrlKey || event.metaKey) &&
              event.shiftKey &&
              (event.key === "P" || event.key === "p")
            ) {
              const { state, dispatch } = view;
              const markType: MarkType | undefined = state.schema.marks.poetryMark;
              if (markType) {
                // 使用 ProseMirror 原生 toggleMark，仅作用于选中文本
                toggleMark(markType)(state, dispatch);
              }
              event.preventDefault();
              return true;
            }
            // Ctrl+Shift+L 切换歌词样式（作用于选中文本）
            if (
              (event.ctrlKey || event.metaKey) &&
              event.shiftKey &&
              (event.key === "L" || event.key === "l")
            ) {
              const { state, dispatch } = view;
              const markType: MarkType | undefined = state.schema.marks.lyricsMark;
              if (markType) {
                toggleMark(markType)(state, dispatch);
              }
              event.preventDefault();
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

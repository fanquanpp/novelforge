// 诗歌/歌词特殊排版 TipTap 扩展
//
// 功能概述：
// 为诗歌/歌词类型内容提供特殊排版功能，包括：
// 1. 诗歌块（居中、行间距加大）
// 2. 歌词块（带前缀符号、节与节之间分隔）
// 3. 自动识别诗歌格式并应用样式
//
// 模块职责：
// 1. 定义诗歌与歌词的自定义节点类型
// 2. 提供快捷键切换诗歌/歌词模式
// 3. 应用特殊排版样式

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

// 诗歌排版扩展配置
export interface PoetryFormatOptions {
  // 是否启用诗歌排版
  enabled: boolean;
}

// 诗歌排版扩展
// 输入: enabled 是否启用
// 输出: TipTap Extension 实例
// 流程:
//   1. 监听输入事件
//   2. 检测诗歌/歌词格式
//   3. 应用居中与间距样式
export const PoetryFormat = Extension.create<PoetryFormatOptions>({
  name: "poetryFormat",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const pluginKey = new PluginKey("poetryFormat");

    return [
      new Plugin({
        key: pluginKey,
        props: {
          // 处理快捷键
          handleKeyDown(view: EditorView, event: KeyboardEvent) {
            if (!options.enabled) return false;
            // Ctrl+Shift+P 切换诗歌模式（应用居中样式）
            if (
              (event.ctrlKey || event.metaKey) &&
              event.shiftKey &&
              (event.key === "P" || event.key === "p")
            ) {
              applyPoetryStyle(view);
              event.preventDefault();
              return true;
            }
            // Ctrl+Shift+L 切换歌词模式
            if (
              (event.ctrlKey || event.metaKey) &&
              event.shiftKey &&
              (event.key === "L" || event.key === "l")
            ) {
              applyLyricsStyle(view);
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

// 应用诗歌样式（居中、行间距加大）
// 输入: view 编辑器视图
// 输出: 无
// 流程: 为当前选中段落添加诗歌样式类
function applyPoetryStyle(view: EditorView): void {
  const { state } = view;
  const { from, to } = state.selection;
  const tr = state.tr;

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === "paragraph") {
      tr.setNodeMarkup(pos, undefined, {
        class: "poetry-block",
        "data-poetry": "true",
      });
    }
    return true;
  });

  view.dispatch(tr);
}

// 应用歌词样式（带前缀、节间分隔）
// 输入: view 编辑器视图
// 输出: 无
// 流程: 为当前选中段落添加歌词样式类
function applyLyricsStyle(view: EditorView): void {
  const { state } = view;
  const { from, to } = state.selection;
  const tr = state.tr;

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === "paragraph") {
      tr.setNodeMarkup(pos, undefined, {
        class: "lyrics-block",
        "data-lyrics": "true",
      });
    }
    return true;
  });

  view.dispatch(tr);
}

// 诗歌与歌词 CSS 样式已迁移至 src/styles.css，POETRY_STYLES 导出已废弃


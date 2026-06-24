// 散文类型自动首行缩进 TipTap 扩展
//
// 功能概述：
// 为散文随笔类型项目提供段落首行自动双字缩进功能。
// 当用户在段落起始位置输入文字时，自动在段首插入两个全角空格作为缩进。
//
// 模块职责：
// 1. 监听编辑器输入事件
// 2. 检测段落起始位置
// 3. 自动插入双全角空格缩进
// 4. 防止重复插入

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { Node } from "@tiptap/pm/model";

// 散文缩进扩展配置
export interface IndentParagraphOptions {
  // 是否启用缩进
  enabled: boolean;
}

// 全角空格缩进（两个全角空格）
const INDENT_TEXT = "\u3000\u3000";

// 散文首行缩进扩展
// 输入: enabled 是否启用
// 输出: TipTap Extension 实例
// 流程:
//   1. 监听编辑器事务
//   2. 检测新段落起始输入
//   3. 自动插入双全角空格
export const IndentParagraph = Extension.create<IndentParagraphOptions>({
  name: "indentParagraph",

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const pluginKey = new PluginKey("indentParagraph");

    return [
      new Plugin({
        key: pluginKey,
        appendTransaction: (
          transactions: readonly Transaction[],
          _oldState: EditorState,
          newState: EditorState
        ): Transaction | null => {
          if (!options.enabled) return null;

          // 检查是否有文档结构变化
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          // 检查是否有文本输入事务
          const hasTextInput = transactions.some(
            (tr) =>
              tr.getMeta("inputType") === "insertText" ||
              tr.getMeta("paste") === true
          );
          if (!hasTextInput) return null;

          const tr = newState.tr;
          let modified = false;
          const { selection } = newState;

          // 检查当前光标所在段落
          const $head = selection.$head;
          const paragraphPos = $head.before($head.depth);

          if (paragraphPos < 0) return null;

          const paragraphNode: Node | null = newState.doc.nodeAt(paragraphPos);
          if (!paragraphNode || paragraphNode.type.name !== "paragraph") {
            return null;
          }

          // 检查段落是否已有缩进
          const text = paragraphNode.textContent;
          if (text.startsWith(INDENT_TEXT)) return null;

          // 检查光标是否在段首附近（前 2 个字符内）
          const offsetInParagraph = $head.parentOffset;
          if (offsetInParagraph > 2) return null;

          // 检查段落是否为空或刚输入第一个字符
          if (text.length > 1) return null;

          // 插入缩进
          tr.insertText(INDENT_TEXT, paragraphPos + 1);
          modified = true;

          return modified ? tr : null;
        },
      }),
    ];
  },
});

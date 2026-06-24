// 剧本角色名自动选择 TipTap 扩展
//
// 功能概述：
// 为舞台剧本类型项目提供台词前的角色名自动选择功能。
// 当用户在空行输入或按 Tab 键时，弹出角色名选择浮层，
// 用户可从预设角色名中选择，也可自定义输入。
//
// 模块职责：
// 1. 监听编辑器输入，检测台词行起始位置
// 2. 弹出角色名选择浮层
// 3. 选中后自动插入角色名前缀
// 4. 支持自定义角色名输入

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// 角色名选择扩展的配置选项
export interface CharacterMentionOptions {
  // 预设角色名列表
  characters: string[];
  // 选择角色名后的回调
  onSelect: (name: string) => void;
}

// 角色名选择扩展
// 输入: characters 角色名列表, onSelect 选择回调
// 输出: TipTap Extension 实例
// 流程:
//   1. 监听编辑器更新
//   2. 检测光标是否在行首
//   3. 显示角色名选择浮层
//   4. 处理选择事件
export const CharacterMention = Extension.create<CharacterMentionOptions>({
  name: "characterMention",

  addOptions() {
    return {
      characters: [],
      onSelect: () => {},
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const pluginKey = new PluginKey("characterMention");

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return {
              active: false,
              query: "",
              selectedIndex: 0,
              rect: null as DOMRect | null,
            };
          },
          apply(tr, prev) {
            return prev;
          },
        },
        props: {
          handleKeyDown(view, event) {
            // Tab 键触发角色名选择
            if (event.key === "Tab") {
              const { state } = view;
              const { selection } = state;
              const $pos = selection.$head;

              // 检查是否在行首
              const lineStart = $pos.start($pos.depth);
              const isLineStart = selection.from === lineStart;

              // 检查是否为空行或行首
              const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
              const isEmptyLine = textBefore.trim() === "";

              if (isLineStart || isEmptyLine) {
                // 触发角色名选择浮层
                const coords = view.coordsAtPos(selection.from);
                const rect = new DOMRect(coords.left, coords.top, 0, coords.bottom - coords.top);
                showCharacterPicker(rect, options.characters, (name) => {
                  // 插入角色名
                  const tr = view.state.tr.insertText(`${name}: `, selection.from);
                  view.dispatch(tr);
                  options.onSelect(name);
                });
                event.preventDefault();
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

// 角色名选择浮层管理
// 输入: rect 光标位置矩形, characters 角色名列表, callback 选择回调
// 输出: 无
// 流程: 创建浮层 DOM 元素并定位
function showCharacterPicker(
  rect: DOMRect,
  characters: string[],
  callback: (name: string) => void
) {
  // 移除已存在的浮层
  const existing = document.getElementById("character-picker");
  if (existing) existing.remove();

  const picker = document.createElement("div");
  picker.id = "character-picker";
  picker.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.bottom + 4}px;
    z-index: 9999;
    background: var(--fandex-bg-card, #181818);
    border: 1px solid var(--fandex-border-light, #383838);
    border-radius: 8px;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.4);
    padding: 4px;
    min-width: 160px;
    max-height: 240px;
    overflow-y: auto;
    font-family: 'Noto Sans SC', sans-serif;
  `;

  // 角色名列表
  characters.forEach((name) => {
    const item = document.createElement("div");
    item.textContent = name;
    item.style.cssText = `
      padding: 6px 12px;
      font-size: 13px;
      color: var(--fandex-text, #ebebeb);
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.12s;
    `;
    item.onmouseenter = () => {
      item.style.background = "var(--fandex-bg-hover, #282828)";
      item.style.color = "var(--fandex-primary, #6ea8fe)";
    };
    item.onmouseleave = () => {
      item.style.background = "transparent";
      item.style.color = "var(--fandex-text, #ebebeb)";
    };
    item.onclick = () => {
      callback(name);
      picker.remove();
    };
    picker.appendChild(item);
  });

  // 自定义输入框
  const divider = document.createElement("div");
  divider.style.cssText = `
    height: 1px;
    background: var(--fandex-border-light, #383838);
    margin: 4px 0;
  `;
  picker.appendChild(divider);

  const input = document.createElement("input");
  input.placeholder = "自定义角色名...";
  input.style.cssText = `
    width: 100%;
    box-sizing: border-box;
    padding: 6px 12px;
    font-size: 13px;
    background: var(--fandex-bg, #0d0d0d);
    border: 1px solid var(--fandex-border-light, #383838);
    border-radius: 4px;
    color: var(--fandex-text, #ebebeb);
    outline: none;
  `;
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      const customName = input.value.trim();
      if (customName) {
        callback(customName);
        picker.remove();
      }
    } else if (e.key === "Escape") {
      picker.remove();
    }
  };
  picker.appendChild(input);

  // 关闭按钮提示
  const hint = document.createElement("div");
  hint.textContent = "Tab 选择 | Esc 关闭";
  hint.style.cssText = `
    padding: 4px 12px;
    font-size: 11px;
    color: var(--fandex-text-tertiary, #8a8a8a);
  `;
  picker.appendChild(hint);

  document.body.appendChild(picker);
  input.focus();

  // 点击外部关闭
  setTimeout(() => {
    const handler = (e: MouseEvent) => {
      if (!picker.contains(e.target as Node)) {
        picker.remove();
        document.removeEventListener("mousedown", handler);
      }
    };
    document.addEventListener("mousedown", handler);
  }, 100);
}

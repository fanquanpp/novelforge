// 主题状态管理
//
// 功能概述：
// 使用 Zustand 管理应用主题(亮色/暗色)，支持本地持久化。
// 通过在 document.documentElement 上切换 .light 类实现主题切换。
//
// 模块职责：
// 1. 管理当前主题状态
// 2. 提供主题切换方法
// 3. 持久化主题到 localStorage
// 4. 应用主题到 DOM 根元素

import { create } from "zustand";

// 主题类型枚举
export type ThemeMode = "dark" | "light";

// 主题状态接口
interface ThemeState {
  // 当前主题
  theme: ThemeMode;
  // 切换主题
  toggleTheme: () => void;
  // 设置主题
  setTheme: (theme: ThemeMode) => void;
  // 初始化主题(从 localStorage 读取并应用)
  initTheme: () => void;
}

// localStorage 键名
const THEME_STORAGE_KEY = "novelforge-theme";

// 应用主题到 DOM 根元素
// 输入: theme 主题模式
// 输出: 无
// 流程: 在 documentElement 上添加/移除 .light 类
function applyThemeToDom(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}

// 从 localStorage 读取主题
// 输入: 无
// 输出: 主题模式
// 流程: 读取本地存储，默认返回 dark
function loadThemeFromStorage(): ThemeMode {
  if (typeof localStorage === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

// 保存主题到 localStorage
// 输入: theme 主题模式
// 输出: 无
// 流程: 写入本地存储
function saveThemeToStorage(theme: ThemeMode): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

// 创建主题状态 store
// 输入: 无
// 输出: Zustand store 实例
// 流程: 定义主题状态与操作方法
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",

  toggleTheme: () => {
    const current = get().theme;
    const next: ThemeMode = current === "dark" ? "light" : "dark";
    applyThemeToDom(next);
    saveThemeToStorage(next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    applyThemeToDom(theme);
    saveThemeToStorage(theme);
    set({ theme });
  },

  initTheme: () => {
    const stored = loadThemeFromStorage();
    applyThemeToDom(stored);
    set({ theme: stored });
  },
}));

// 国际化 (i18n) 框架
//
// 功能概述：
// 提供轻量级国际化支持，基于 React Context 实现。
// 支持中/英文切换，文案集中管理，组件通过 useI18n() 获取翻译函数。
//
// 模块职责：
// 1. I18nProvider: 语言上下文提供者
// 2. useI18n: 获取翻译函数的 Hook
// 3. translations: 集中管理的翻译文案映射
// 4. useI18nInit: 从 localStorage 读取语言偏好并初始化

import { createContext, useContext, useState, useCallback, useEffect } from "react";

// 支持的语言
export type Locale = "zh-CN" | "en-US";

// 翻译字典类型
type TranslationDict = Record<string, string>;

// 中文翻译
const zhCN: TranslationDict = {
  // 通用
  "app.title": "NovelForge",
  "app.loading": "加载中...",
  "app.error": "发生错误",
  "app.retry": "重试",
  "app.cancel": "取消",
  "app.confirm": "确认",
  "app.save": "保存",
  "app.delete": "删除",
  "app.create": "创建",
  "app.rename": "重命名",
  "app.export": "导出",
  "app.search": "搜索",
  "app.refresh": "刷新",
  "app.empty": "暂无数据",

  // 启动器
  "launcher.title": "NovelForge",
  "launcher.subtitle": "沉浸式创作工坊",
  "launcher.newProject": "新建项目",
  "launcher.importProject": "导入项目",
  "launcher.recentProjects": "最近项目",
  "launcher.noProjects": "暂无项目，点击上方按钮创建",

  // 工作台
  "workspace.newFile": "新建文件",
  "workspace.fileName": "文件名",
  "workspace.createIn": "将创建在 {dir} 目录下",
  "workspace.creating": "创建中...",

  // 编辑器
  "editor.placeholder": "开始你的创作...",
  "editor.unsaved": "未保存",
  "editor.wordCount": "{count} 字",
  "editor.exportTxt": "导出为 TXT",
  "editor.bold": "加粗",
  "editor.italic": "斜体",
  "editor.heading1": "一级标题",
  "editor.heading2": "二级标题",
  "editor.bulletList": "无序列表",
  "editor.orderedList": "有序列表",
  "editor.blockquote": "引用",
  "editor.undo": "撤销",
  "editor.redo": "重做",
  "editor.poetryFormat": "诗歌排版 (Ctrl+Shift+P)",
  "editor.lyricsFormat": "歌词排版 (Ctrl+Shift+L)",
  "editor.conflictDetected": "文件已被外部修改，是否覆盖保存？",
  "editor.scriptMode": "剧本模式",
  "editor.essayMode": "散文模式",
  "editor.selectFile": "从左侧选择或创建一个文件开始编辑",
  "editor.charRosterHint": "在空行按 Tab 键呼出角色名选择（共 {count} 个角色）",
  "editor.essayHint": "已启用首行双字缩进",
  "editor.loadFailed": "加载文件失败",

  // 文件列表
  "filelist.empty": "此分类下暂无文件",
  "filelist.createFirst": "创建第一个文件",
  "filelist.gridView": "卡片视图",
  "filelist.listView": "列表视图",
  "filelist.confirmDelete": "确定删除 \"{name}\" 吗?",
  "filelist.renamePrompt": "输入新文件名:",

  // 侧边栏
  "sidebar.characters": "角色",
  "sidebar.worldview": "世界观",
  "sidebar.glossary": "名词",
  "sidebar.timeline": "时间线",
  "sidebar.manuscript": "正文",
  "sidebar.outline": "大纲",
  "sidebar.materials": "素材",
  "sidebar.stats": "统计",
  "sidebar.search": "搜索",
  "sidebar.closeProject": "关闭项目",

  // 写作统计
  "stats.title": "写作统计",
  "stats.totalWords": "总字数",
  "stats.chapters": "章节数",
  "stats.files": "文件数",
  "stats.days": "创作天数",
  "stats.wordsDist": "字数分布",
  "stats.manuscript": "正文",
  "stats.settings": "设定",
  "stats.outline": "大纲",
  "stats.chapterRank": "章节字数排行",
  "stats.noChapters": "暂无章节数据",

  // 全局搜索
  "search.title": "全局搜索",
  "search.placeholder": "搜索项目内所有文件内容...",
  "search.caseSensitive": "区分大小写",
  "search.results": "找到 {count} 条匹配结果",
  "search.noResults": "未找到匹配结果",
  "search.startSearch": "输入关键词开始搜索",

  // 时间线
  "timeline.title": "时间线",
  "timeline.empty": "暂无时间线事件",
  "timeline.addEvent": "添加事件",
  "timeline.sortByDate": "按日期排序",
};

// 英文翻译
const enUS: TranslationDict = {
  "app.title": "NovelForge",
  "app.loading": "Loading...",
  "app.error": "An error occurred",
  "app.retry": "Retry",
  "app.cancel": "Cancel",
  "app.confirm": "Confirm",
  "app.save": "Save",
  "app.delete": "Delete",
  "app.create": "Create",
  "app.rename": "Rename",
  "app.export": "Export",
  "app.search": "Search",
  "app.refresh": "Refresh",
  "app.empty": "No data",

  "launcher.title": "NovelForge",
  "launcher.subtitle": "Immersive Writing Studio",
  "launcher.newProject": "New Project",
  "launcher.importProject": "Import Project",
  "launcher.recentProjects": "Recent Projects",
  "launcher.noProjects": "No projects yet. Create one above.",

  "workspace.newFile": "New File",
  "workspace.fileName": "File Name",
  "workspace.createIn": "Will be created in {dir}",
  "workspace.creating": "Creating...",

  "editor.placeholder": "Start writing...",
  "editor.unsaved": "Unsaved",
  "editor.wordCount": "{count} words",
  "editor.exportTxt": "Export TXT",
  "editor.bold": "Bold",
  "editor.italic": "Italic",
  "editor.heading1": "Heading 1",
  "editor.heading2": "Heading 2",
  "editor.bulletList": "Bullet List",
  "editor.orderedList": "Ordered List",
  "editor.blockquote": "Blockquote",
  "editor.undo": "Undo",
  "editor.redo": "Redo",
  "editor.poetryFormat": "Poetry Format (Ctrl+Shift+P)",
  "editor.lyricsFormat": "Lyrics Format (Ctrl+Shift+L)",
  "editor.conflictDetected":
    "File has been modified externally. Overwrite?",
  "editor.scriptMode": "Script Mode",
  "editor.essayMode": "Essay Mode",
  "editor.selectFile": "Select or create a file from the sidebar",
  "editor.charRosterHint":
    "Press Tab on empty line for character selection ({count} characters)",
  "editor.essayHint": "Double-character indent enabled",
  "editor.loadFailed": "Failed to load file",

  "filelist.empty": "No files in this category",
  "filelist.createFirst": "Create first file",
  "filelist.gridView": "Grid View",
  "filelist.listView": "List View",
  "filelist.confirmDelete": 'Delete "{name}"?',
  "filelist.renamePrompt": "Enter new file name:",

  "sidebar.characters": "Characters",
  "sidebar.worldview": "Worldview",
  "sidebar.glossary": "Glossary",
  "sidebar.timeline": "Timeline",
  "sidebar.manuscript": "Manuscript",
  "sidebar.outline": "Outline",
  "sidebar.materials": "Materials",
  "sidebar.stats": "Stats",
  "sidebar.search": "Search",
  "sidebar.closeProject": "Close Project",

  "stats.title": "Writing Stats",
  "stats.totalWords": "Total Words",
  "stats.chapters": "Chapters",
  "stats.files": "Files",
  "stats.days": "Days",
  "stats.wordsDist": "Word Distribution",
  "stats.manuscript": "Manuscript",
  "stats.settings": "Settings",
  "stats.outline": "Outline",
  "stats.chapterRank": "Chapter Ranking",
  "stats.noChapters": "No chapter data",

  "search.title": "Global Search",
  "search.placeholder": "Search all project files...",
  "search.caseSensitive": "Case Sensitive",
  "search.results": "Found {count} results",
  "search.noResults": "No results found",
  "search.startSearch": "Enter keywords to search",

  "timeline.title": "Timeline",
  "timeline.empty": "No timeline events",
  "timeline.addEvent": "Add Event",
  "timeline.sortByDate": "Sort by Date",
};

const translations: Record<Locale, TranslationDict> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

// 翻译函数类型
type TFunction = (key: string, params?: Record<string, string | number>) => string;

// i18n 上下文值
interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "zh-CN",
  setLocale: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "novelforge-locale";

// 从 localStorage 读取语言偏好
function loadLocale(): Locale {
  if (typeof localStorage === "undefined") return "zh-CN";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "zh-CN" || stored === "en-US") return stored;
  return "zh-CN";
}

// 保存语言偏好
function saveLocale(locale: Locale): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);
}

// i18n Provider 组件
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    saveLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t: TFunction = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = translations[locale];
      let text = dict[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// 获取翻译函数
export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

// 初始化 i18n（在 App 挂载时调用）
export function useI18nInit(): Locale {
  const [locale] = useState<Locale>(loadLocale);
  useEffect(() => {
    saveLocale(locale);
  }, [locale]);
  return locale;
}

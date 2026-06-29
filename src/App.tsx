// 根组件
//
// 功能概述：
// NovelForge 应用根组件，根据全局状态切换启动器与工作台视图。
// 在挂载时初始化主题状态和 i18n。
//
// 模块职责：
// 1. 读取全局状态中的 viewMode
// 2. 渲染 Launcher 或 Workspace
// 3. 包裹 FANDEX 主题容器、ToastProvider、I18nProvider
// 4. 全局快捷键面板与命令面板

import { useEffect } from "react";
import Launcher from "./components/Launcher";
import Workspace from "./components/Workspace";
import ErrorBoundary from "./components/ErrorBoundary";
import ShortcutPanel from "./components/ShortcutPanel";
import { useAppStore } from "./lib/store";
import { useThemeStore } from "./lib/themeStore";
import { ToastProvider } from "./lib/toast";
import { I18nProvider } from "./lib/i18n";

function App() {
  const viewMode = useAppStore((s) => s.viewMode);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <div className="antialiased text-nf-text bg-nf-bg min-h-screen">
            {viewMode === "launcher" ? <Launcher /> : <Workspace />}
          </div>
          <ShortcutPanel />
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}

export default App;

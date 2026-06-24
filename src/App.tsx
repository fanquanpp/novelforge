// 根组件
//
// 功能概述：
// NovelForge 应用根组件，根据全局状态切换启动器与工作台视图。
//
// 模块职责：
// 1. 读取全局状态中的 viewMode
// 2. 渲染 Launcher 或 Workspace
// 3. 包裹 FANDEX 主题容器

import Launcher from "./components/Launcher";
import Workspace from "./components/Workspace";
import { useAppStore } from "./lib/store";

// 根组件
// 输入: 无
// 输出: 渲染 Launcher 或 Workspace
// 流程: 根据 viewMode 切换视图
function App() {
  const viewMode = useAppStore((s) => s.viewMode);

  return (
    <div className="antialiased text-nf-text bg-nf-bg min-h-screen">
      {viewMode === "launcher" ? <Launcher /> : <Workspace />}
    </div>
  );
}

export default App;

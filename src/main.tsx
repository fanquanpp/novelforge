import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// 禁用浏览器/Tauri 默认右键菜单（桌面应用不应显示网页上下文菜单）
// 仍允许特定组件通过 stopPropagation 自定义右键行为
document.addEventListener("contextmenu", (e) => {
  // 允许 input/textarea 内的右键（复制/粘贴等编辑操作）
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
    return;
  }
  e.preventDefault();
});

// 阻止拖拽默认行为（防止用户意外拖拽文件到窗口导致导航）
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("drop", (e) => e.preventDefault());

// React 应用入口
// 输入: 无
// 输出: 挂载到 DOM 的 React 根组件
// 流程: 创建 React 根并渲染 App 组件
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

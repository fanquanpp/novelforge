// 视图模式状态切片
//
// openProject / closeProject 是跨切片动作，会同时设置 currentProject、
// activeCategory、selectedFile、projectTree 等跨领域字段。
// 使用 StateCreator<CombinedSlice> 泛型以在类型层面支持跨切片 set。

import type { StateCreator } from "zustand";
import type { ProjectInfo, FileNode } from "../api";
import type { SidebarCategory } from "../store";

export type ViewMode = "launcher" | "workspace";

// 本切片支持的视图模式字段
export interface ViewSlice {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // 跨切片动作：这些 setter 会写入不属于 ViewSlice 的字段
  openProject: (project: ProjectInfo) => void;
  closeProject: () => void;
}

// 扩展切片类型，声明 openProject / closeProject 可能写入的跨切片字段
export interface CrossSliceState {
  viewMode: ViewMode;
  currentProject: ProjectInfo | null;
  activeCategory: SidebarCategory;
  selectedFile: FileNode | null;
  projectTree: FileNode[];
}

export const createViewSlice: StateCreator<CrossSliceState, [], [], ViewSlice> = (
  set
) => ({
  viewMode: "launcher",

  setViewMode: (mode) => set({ viewMode: mode }),

  openProject: (project) =>
    set({
      currentProject: project,
      viewMode: "workspace",
      activeCategory: "manuscript",
      selectedFile: null,
    }),

  closeProject: () =>
    set({
      currentProject: null,
      viewMode: "launcher",
      selectedFile: null,
      projectTree: [],
    }),
});

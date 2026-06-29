// 项目状态切片
//
// 管理当前打开项目信息、目录树、加载状态

import type { StateCreator } from "zustand";
import type { ProjectInfo, FileNode } from "../api";

export interface ProjectSlice {
  currentProject: ProjectInfo | null;
  projectTree: FileNode[];
  loading: boolean;

  setProjectTree: (tree: FileNode[]) => void;
  setLoading: (loading: boolean) => void;
}

export const createProjectSlice: StateCreator<ProjectSlice> = (set) => ({
  currentProject: null,
  projectTree: [],
  loading: false,

  setProjectTree: (tree) => set({ projectTree: tree }),
  setLoading: (loading) => set({ loading }),
});

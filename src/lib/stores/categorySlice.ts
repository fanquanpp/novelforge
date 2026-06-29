// 分类与文件选择状态切片

import type { StateCreator } from "zustand";
import type { FileNode } from "../api";
import type { SidebarCategory } from "./types";

export interface CategorySlice {
  activeCategory: SidebarCategory;
  selectedFile: FileNode | null;

  setActiveCategory: (category: SidebarCategory) => void;
  setSelectedFile: (file: FileNode | null) => void;
}

export const createCategorySlice: StateCreator<CategorySlice> = (set) => ({
  activeCategory: "manuscript",
  selectedFile: null,

  setActiveCategory: (category) =>
    set({ activeCategory: category, selectedFile: null }),

  setSelectedFile: (file) => set({ selectedFile: file }),
});

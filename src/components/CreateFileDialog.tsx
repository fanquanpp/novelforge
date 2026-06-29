// 新建文件对话框组件
//
// 功能概述：
// 提供统一的新建文件对话框 UI，含文件名输入校验、
// 目标目录提示、创建/取消操作。
// 采用 FANDEX 直角美学。
//
// 模块职责：
// 1. 渲染新建文件对话框
// 2. 文件名输入与实时校验
// 3. 键盘快捷操作（Enter 提交）
// 4. 创建中加载状态

import { useState } from "react";
import { X, FilePlus, Loader2 } from "lucide-react";
import { isValidFileName } from "../lib/fileTreeUtils";

interface CreateFileDialogProps {
  // 对话框是否可见
  open: boolean;
  // 目标目录名（提示用）
  dirName: string;
  // 关闭对话框回调
  onClose: () => void;
  // 确认创建回调，传入文件名（不含目录前缀）
  onConfirm: (fileName: string) => Promise<void>;
}

export default function CreateFileDialog({
  open,
  dirName,
  onClose,
  onConfirm,
}: CreateFileDialogProps) {
  const [newFileName, setNewFileName] = useState("");
  const [fileNameError, setFileNameError] = useState("");
  const [creating, setCreating] = useState(false);

  if (!open) return null;

  const handleCreate = async () => {
    const name = newFileName.trim();
    if (!name) return;

    if (!isValidFileName(name)) {
      setFileNameError('文件名不能包含以下字符: < > : " / \\ | ? *');
      return;
    }

    if (name.includes(".")) {
      const ext = name.split(".").pop()?.toLowerCase();
      if (ext !== "md" && ext !== "txt") {
        setFileNameError("仅支持 .md 或 .txt 文件");
        return;
      }
    }

    setFileNameError("");
    setCreating(true);
    try {
      let fileName = name;
      if (!fileName.endsWith(".md") && !fileName.endsWith(".txt")) {
        fileName += ".md";
      }
      await onConfirm(fileName);
      setNewFileName("");
      onClose();
    } catch (e) {
      alert(`创建文件失败: ${e}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-nf-bg-card border border-nf-border-light shadow-lg overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-nf-border-light">
          <div className="flex items-center gap-2">
            <FilePlus className="w-4 h-4 text-fandex-primary" />
            <h3 className="fandex-bar-left text-sm font-semibold font-display text-nf-text">
              新建文件
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-nf-bg-hover text-nf-text-tertiary transition-fast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 py-4">
          <label className="block text-xs text-nf-text-secondary mb-1.5">
            文件名（将创建在 {dirName} 目录下）
          </label>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => {
              setNewFileName(e.target.value);
              setFileNameError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            placeholder="输入文件名"
            autoFocus
            className="w-full bg-nf-bg border border-nf-border-light px-3 py-2 text-sm text-nf-text placeholder-nf-text-tertiary focus:outline-none focus:border-fandex-primary/60 transition-fast"
          />
          {fileNameError && (
            <p className="text-xs text-red-400 mt-1.5">{fileNameError}</p>
          )}
          <p className="text-xs text-nf-text-tertiary mt-2">
            不输入扩展名将自动添加 .md
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-nf-border-light">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-nf-text-secondary hover:text-nf-text hover:bg-nf-bg-hover transition-fast"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!newFileName.trim() || creating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-fandex-primary hover:bg-fandex-primary-hover text-sm font-medium text-nf-text-inverse transition-fast disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {creating ? "创建中..." : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}

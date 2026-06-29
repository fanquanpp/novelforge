// 项目卡片组件
//
// 功能概述：
// 渲染单张项目卡片，展示项目名称、类型、字数、章节数、更新时间。
// 采用 FANDEX 美术风格，渐变封面 + 沉浸式设计。
// 支持键盘导航和删除操作。

import { memo, useCallback } from "react";
import { Clock, BarChart3, BookOpen, Trash2, BookMarked } from "lucide-react";
import { useAppStore } from "../lib/store";
import type { ProjectInfo } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAutoSaveOnExit } from "../hooks/useAutoSaveOnExit";

export interface ProjectData {
  id: string;
  name: string;
  type: string;
  typeColor: string;
  words: string;
  chapters: number;
  updated: string;
  gradient: string;
}

export interface ProjectCardProps {
  project: ProjectData;
  projectInfo?: ProjectInfo;
  onDelete?: (project: ProjectInfo) => void;
}

function ProjectCardImpl({ project, projectInfo, onDelete }: ProjectCardProps) {
  const { handleSwitchProject } = useAutoSaveOnExit();
  const { t } = useI18n();

  const handleClick = useCallback(() => {
    if (!projectInfo) return;
    const currentProject = useAppStore.getState().currentProject;
    if (currentProject) {
      handleSwitchProject(projectInfo);
    } else {
      useAppStore.getState().openProject(projectInfo);
    }
  }, [handleSwitchProject, projectInfo]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (projectInfo && onDelete) {
        onDelete(projectInfo);
      }
    },
    [projectInfo, onDelete]
  );

  const handleDeleteKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        if (projectInfo && onDelete) {
          onDelete(projectInfo);
        }
      }
    },
    [projectInfo, onDelete]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t("projectcard.openProject") + ": " + project.name}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group relative bg-nf-bg-card border border-nf-border-light hover:border-fandex-primary/50 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden focus:outline-none focus:ring-1 focus:ring-fandex-primary focus:ring-inset hover:shadow-lg hover:shadow-black/20"
    >
      {/* 渐变封面区 */}
      <div className={`relative h-20 bg-gradient-to-br ${project.gradient} overflow-hidden`}>
        {/* 装饰性纹理 */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.15) 8px, rgba(0,0,0,0.15) 9px)"
        }} />
        {/* 图标 */}
        <div className="absolute top-3 right-3 opacity-30">
          <BookMarked className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        {/* 类型标签 */}
        <span className="absolute bottom-2 left-3 text-[10px] font-medium px-2 py-0.5 bg-black/30 backdrop-blur-sm text-white/90 border border-white/10">
          {project.type}
        </span>
        {/* 删除按钮 */}
        {onDelete && projectInfo && (
          <button
            onClick={handleDeleteClick}
            onKeyDown={handleDeleteKeyDown}
            title={t("projectcard.deleteTooltip")}
            aria-label={t("projectcard.deleteProject") + ": " + project.name}
            className="absolute top-2 right-2 z-10 p-1.5 bg-black/30 backdrop-blur-sm border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto text-white/70 hover:text-red-300 hover:border-red-400/40 transition duration-fast"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 内容区 */}
      <div className="px-4 pt-3 pb-3 flex-1 flex flex-col">
        <h3 className="text-base font-bold font-display text-nf-text group-hover:text-fandex-primary transition duration-fast tracking-tight line-clamp-2 mb-2 leading-snug">
          {project.name}
        </h3>

        <div className="mt-auto flex items-center justify-between text-xs text-nf-text-tertiary pt-2 border-t border-nf-border-light/50">
          <div className="flex items-center gap-1" title={t("projectcard.totalWords")}>
            <BarChart3 className="w-3 h-3" />
            <span>{project.words}</span>
          </div>
          <div className="flex items-center gap-1" title={t("projectcard.chapters")}>
            <BookOpen className="w-3 h-3" />
            <span>{project.chapters} {t("projectcard.chapterUnit")}</span>
          </div>
          <div className="flex items-center gap-1" title={t("projectcard.lastUpdate")}>
            <Clock className="w-3 h-3" />
            <span>{project.updated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProjectCard = memo(ProjectCardImpl);
export default ProjectCard;

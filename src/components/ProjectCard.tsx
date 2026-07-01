// 项目卡片组件（低宽型布局）
//
// 功能概述：
// 渲染单张项目卡片，采用低宽型设计减少垂直空白，增加信息密度。
// 左侧渐变色条 + 右侧信息区的横向布局。
// 支持键盘导航和删除操作。

import { memo, useCallback } from "react";
import { Clock, BarChart3, BookOpen, Trash2, Calendar, User, Tag } from "lucide-react";
import { useAppStore } from "../lib/store";
import type { ProjectInfo } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAutoSaveOnExit } from "../hooks/useAutoSaveOnExit";

/** 项目卡片展示数据（由上层从 ProjectInfo 转换而来） */
export interface ProjectData {
  id: string;
  name: string;
  type: string;
  typeColor: string;
  words: string;
  chapters: number;
  updated: string;
  gradient: string;
  /** 项目作者（可为空字符串） */
  author: string;
  /** 项目描述（可为空字符串,过长时自动截断） */
  description: string;
  /** 项目题材（中文化后的字符串,可为空） */
  genre: string;
  /** 项目创建时间(ISO 8601 字符串,用于卡片展示) */
  createdAt: string;
}

/** ProjectCard 组件属性 */
export interface ProjectCardProps {
  project: ProjectData;
  projectInfo?: ProjectInfo;
  onDelete?: (project: ProjectInfo) => void;
}

/**
 * 项目卡片实现组件
 * 输入:
 *   - project: 卡片展示数据（名称、类型、字数等）
 *   - projectInfo: 原始项目信息（用于打开/删除操作）
 *   - onDelete: 删除回调（可选）
 * 输出: JSX 卡片元素
 * 流程:
 *   1. 点击卡片时，若当前已有打开项目则走切换流程，否则直接打开
 *   2. 支持键盘 Enter/Space 触发点击（无障碍）
 *   3. 删除按钮悬浮显示，阻止事件冒泡避免触发卡片点击
 */
function ProjectCardImpl({ project, projectInfo, onDelete }: ProjectCardProps) {
  const { handleSwitchProject } = useAutoSaveOnExit();
  const { t } = useI18n();

  /** 卡片点击：打开项目或切换项目 */
  const handleClick = useCallback(() => {
    if (!projectInfo) return;
    const currentProject = useAppStore.getState().currentProject;
    if (currentProject) {
      handleSwitchProject(projectInfo);
    } else {
      useAppStore.getState().openProject(projectInfo);
    }
  }, [handleSwitchProject, projectInfo]);

  /** 键盘事件：Enter/Space 触发点击 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  /** 删除按钮点击：阻止冒泡并触发 onDelete 回调 */
  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (projectInfo && onDelete) {
        onDelete(projectInfo);
      }
    },
    [projectInfo, onDelete]
  );

  /** 删除按钮键盘事件：Enter/Space 触发删除 */
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
      className="nf-card-sheen nf-hover-float group relative bg-nf-bg-card backdrop-blur-none border border-nf-border-light hover:border-fandex-primary/50 cursor-pointer flex overflow-hidden focus:outline-none focus:ring-1 focus:ring-fandex-primary focus:ring-inset hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5 transition-all duration-base"
      style={{ backgroundColor: 'var(--fandex-bg-card)' }}
    >
      {/* 背景装饰图案:不占位,绝对定位右下角,低透明度,不影响文字排版 */}
      <svg
        className="absolute bottom-0 right-0 w-32 h-32 opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-500"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* 装饰性羽毛笔图案,呼应品牌主题 */}
        <path
          d="M20 80 L70 30 M70 30 Q80 20 75 15 Q70 10 60 20 L70 30 Z M65 35 L75 25 M60 40 L70 30 M55 45 L65 35 M50 50 L60 40 M45 55 L55 45 M40 60 L50 50 M35 65 L45 55 M30 70 L40 60 M25 75 L35 65"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-fandex-primary"
        />
        {/* 装饰圆点 */}
        <circle cx="78" cy="22" r="2" className="text-fandex-secondary" fill="currentColor" />
        <circle cx="85" cy="15" r="1.5" className="text-fandex-tertiary" fill="currentColor" />
      </svg>

      {/* 左侧渐变色条 - 加宽并增加光晕 */}
      <div className={`relative w-2 flex-shrink-0 bg-gradient-to-b ${project.gradient}`}>
        <div className="absolute inset-0 opacity-50" style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15), transparent 30%)',
        }} />
      </div>

      {/* 主内容区 - 增加留白与呼吸感 */}
      <div className="flex-1 min-w-0 px-5 py-4 flex flex-col gap-2.5 relative z-[2]">
        {/* 顶部行：项目名 + 类型标签 + 删除按钮 */}
        <div className="flex items-start gap-2">
          <h3 className="flex-1 min-w-0 text-base font-bold font-display text-nf-text group-hover:text-fandex-primary transition-colors duration-200 truncate leading-snug">
            《{project.name}》
          </h3>
          <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 border ${project.typeColor}`}>
            {project.type}
          </span>
          {onDelete && projectInfo && (
            <button
              onClick={handleDeleteClick}
              onKeyDown={handleDeleteKeyDown}
              title={t("projectcard.deleteTooltip")}
              aria-label={t("projectcard.deleteProject") + ": " + project.name}
              className="flex-shrink-0 p-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto text-nf-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 描述行:有描述时显示,最多两行,无描述时隐藏节省垂直空间 */}
        {project.description && (
          <p className="text-xs text-nf-text-tertiary line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* 作者/题材/创建时间信息行:三者皆空时隐藏,使用图标增强可读性 */}
        {(project.author || project.genre || project.createdAt) && (
          <div className="flex items-center gap-3 text-[11px] text-nf-text-tertiary/80 flex-wrap">
            {project.author && (
              <span className="flex items-center gap-1 truncate" title={`${t("projectcard.authorLabel")}: ${project.author}`}>
                <User className="w-3 h-3 flex-shrink-0 text-nf-text-tertiary/60" />
                <span className="truncate">{project.author}</span>
              </span>
            )}
            {project.genre && (
              <span className="flex items-center gap-1 truncate" title={`${t("projectcard.genreLabel")}: ${project.genre}`}>
                <Tag className="w-3 h-3 flex-shrink-0 text-nf-text-tertiary/60" />
                <span className="truncate">{project.genre}</span>
              </span>
            )}
            {project.createdAt && (
              <span className="flex items-center gap-1 whitespace-nowrap" title={`${t("projectcard.createdLabel")}: ${project.createdAt}`}>
                <Calendar className="w-3 h-3 flex-shrink-0 text-nf-text-tertiary/60" />
                <span>{project.createdAt}</span>
              </span>
            )}
          </div>
        )}

        {/* 底部行：统计信息 - 增加间距与图标精致度 */}
        <div className="flex items-center gap-4 text-xs text-nf-text-tertiary">
          <div className="flex items-center gap-1.5" title={t("projectcard.totalWords")}>
            <BarChart3 className="w-3.5 h-3.5 text-fandex-primary/70 transition-transform duration-fast group-hover:scale-110" />
            <span className="tabular-nums">{project.words}</span>
          </div>
          <div className="flex items-center gap-1.5" title={t("projectcard.chapters")}>
            <BookOpen className="w-3.5 h-3.5 text-fandex-secondary/70 transition-transform duration-fast group-hover:scale-110" />
            <span className="tabular-nums">{project.chapters} {t("projectcard.chapterUnit")}</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto" title={t("projectcard.lastUpdate")}>
            <Clock className="w-3.5 h-3.5 text-fandex-tertiary/70 transition-transform duration-fast group-hover:scale-110" />
            <span className="truncate">{project.updated}</span>
          </div>
        </div>
      </div>

      {/* 底部进度条装饰 - 加粗并增加光晕 */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-fandex-primary via-fandex-secondary to-fandex-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}

const ProjectCard = memo(ProjectCardImpl);
export default ProjectCard;

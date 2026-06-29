// Markdown ↔ HTML 双向转换器
//
// 功能概述：
// 提供 Markdown 文本与 HTML 字符串之间的双向转换能力。
// 支持标题、列表、代码块、引用、链接、图片、行内格式等常用元素。
//
// 模块职责：
// 1. markdownToHtml: Markdown 文本 → HTML 字符串
// 2. htmlToMarkdown: HTML 字符串 → Markdown 文本
// 3. inlineMarkdownToHtml: 行内 Markdown 格式 → HTML

// Markdown 转 HTML（完整块级 + 行内格式支持）
// 输入: md Markdown 文本
// 输出: HTML 字符串
export function markdownToHtml(md: string): string {
  if (!md) return "";

  const lines = md.split("\n");
  const result: string[] = [];
  let listBuffer: { tag: "ol" | "ul"; items: string[] } | null = null;

  function flushList() {
    if (!listBuffer || listBuffer.items.length === 0) return;
    const tag = listBuffer.tag;
    result.push(`<${tag}>`);
    for (const item of listBuffer.items) {
      result.push(`<li>${item}</li>`);
    }
    result.push(`</${tag}>`);
    listBuffer.items.length = 0;
  }

  let inCodeBlock = false;
  let codeLang = "";
  const codeLines: string[] = [];

  for (const line of lines) {
    // 代码块
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushList();
        const code = codeLines.join("\n");
        const escaped = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        result.push(
          `<pre><code${codeLang ? ` class="language-${codeLang}"` : ""}>${escaped}</code></pre>`
        );
        codeLines.length = 0;
        codeLang = "";
        inCodeBlock = false;
      } else {
        flushList();
        codeLang = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // 分隔线
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushList();
      result.push("<hr>");
      continue;
    }

    // 标题
    const hMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      result.push(`<h${level}>${inlineMarkdownToHtml(hMatch[2])}</h${level}>`);
      continue;
    }

    // 块引用
    if (line.startsWith("> ")) {
      flushList();
      result.push(`<blockquote>${inlineMarkdownToHtml(line.slice(2))}</blockquote>`);
      continue;
    }

    // 无序列表
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (!listBuffer || listBuffer.tag !== "ul") {
        flushList();
        listBuffer = { tag: "ul", items: [] };
      }
      listBuffer.items.push(inlineMarkdownToHtml(ulMatch[1]));
      continue;
    }

    // 有序列表
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (!listBuffer || listBuffer.tag !== "ol") {
        flushList();
        listBuffer = { tag: "ol", items: [] };
      }
      listBuffer.items.push(inlineMarkdownToHtml(olMatch[2]));
      continue;
    }

    // 普通文本行
    flushList();
    if (line.trim() === "") {
      result.push("");
    } else {
      result.push(inlineMarkdownToHtml(line));
    }
  }
  flushList();

  // 按双空行合并为段落
  const paragraphs: string[] = [];
  let currentPara: string[] = [];
  for (const segment of result) {
    if (segment === "") {
      if (currentPara.length > 0) {
        paragraphs.push(`<p>${currentPara.join("<br>")}</p>`);
        currentPara = [];
      }
    } else {
      currentPara.push(segment);
    }
  }
  if (currentPara.length > 0) {
    paragraphs.push(`<p>${currentPara.join("<br>")}</p>`);
  }

  return paragraphs.join("\n") || "<p></p>";
}

// 行内 Markdown 转 HTML
// 输入: text 含行内 Markdown 的文本
// 输出: HTML 字符串
export function inlineMarkdownToHtml(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>");
}

// HTML 转 Markdown
// 输入: html HTML 字符串
// 输出: Markdown 文本
export function htmlToMarkdown(html: string): string {
  if (!html) return "";

  let md = html
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');

  // 标题
  md = md.replace(/<h1>(.+?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2>(.+?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3>(.+?)<\/h3>/gi, "### $1\n\n");

  // 引用
  md = md.replace(/<blockquote>\s*(.+?)\s*<\/blockquote>/gis, (_, content) => {
    return (
      content
        .split(/\n/)
        .map((l: string) => `> ${l.trim()}`)
        .join("\n") + "\n\n"
    );
  });

  // 无序列表
  md = md.replace(/<ul>\s*(.+?)\s*<\/ul>/gis, (_, items) => {
    const lis = items.match(/<li>(.+?)<\/li>/gis);
    return lis
      ? lis.map((li: string) => `- ${li.replace(/<\/?li>/gi, "")}`).join("\n") + "\n\n"
      : "";
  });

  // 有序列表
  md = md.replace(/<ol>\s*(.+?)\s*<\/ol>/gis, (_, items) => {
    const lis = items.match(/<li>(.+?)<\/li>/gis);
    return lis
      ? lis
          .map((li: string, i: number) => `${i + 1}. ${li.replace(/<\/?li>/gi, "")}`)
          .join("\n") + "\n\n"
      : "";
  });

  // 代码块
  md = md.replace(
    /<pre><code(?: class="language-(\w+)")?>(.+?)<\/code><\/pre>/gis,
    (_, lang, code) => `\`\`\`${lang || ""}\n${code}\n\`\`\`\n\n`
  );

  // 分隔线
  md = md.replace(/<hr\s*\/?>/gi, "---\n\n");

  // 行内格式
  md = md.replace(/<strong><em>(.+?)<\/em><\/strong>/gi, "***$1***");
  md = md.replace(/<em><strong>(.+?)<\/strong><\/em>/gi, "***$1***");
  md = md.replace(/<strong>(.+?)<\/strong>/gi, "**$1**");
  md = md.replace(/<em>(.+?)<\/em>/gi, "*$1*");
  md = md.replace(/<code>(.+?)<\/code>/gi, "`$1`");
  md = md.replace(/<s>(.+?)<\/s>/gi, "~~$1~~");
  md = md.replace(/<del>(.+?)<\/del>/gi, "~~$1~~");

  // 链接与图片
  md = md.replace(/<a\s+href="(.+?)">(.+?)<\/a>/gi, "[$2]($1)");
  md = md.replace(/<img\s+src="(.+?)"\s+alt="(.*?)"\s*\/?>/gi, "![$2]($1)");

  // 段落
  md = md.replace(/<p>(.+?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");

  // 清理残留标签
  md = md.replace(/<[^>]+>/g, "");

  // 压缩多余空行
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

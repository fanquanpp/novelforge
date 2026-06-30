// 项目模板与目录结构定义模块
//
// 功能概述：
// 定义 NovelForge 支持的小说文体类型及其对应的目录结构与预设文件。
// 模板按文体体裁分类（短篇/日记/对话/长篇分卷/同世界观系列/剧本/诗歌等），
// 题材（玄幻/科幻/言情等）作为次级可选项存储在 ProjectMeta.genre 中。
//
// 模块职责：
// 1. 定义文体类型枚举（ProjectType）
// 2. 定义通用目录与预设文件
// 3. 定义各文体类型的专属目录与预设文件
// 4. 定义各文体类型的初始正文文件
// 5. 生成项目元数据（含题材字段）

use serde::{Deserialize, Serialize};

// ===== 模板变量系统 =====
// 模板内支持 {{项目名}} {{作者名}} {{当前日期}} {{当前时间}} {{文体类型}} {{题材}} {{项目描述}}
// 等占位符，在创建项目时由 render_template 统一替换，作者开箱即用

/// 模板变量集合
pub struct TemplateVars {
    pub project_name: String,
    pub author: String,
    pub date: String,
    pub time: String,
    pub project_type_label: String,
    pub genre: String,
    pub description: String,
}

/**
 * 渲染模板：将模板字符串中的 {{变量}} 占位符替换为实际值
 * 输入: content 模板字符串, vars 变量集合
 * 输出: 替换后的字符串
 * 流程: 逐个替换预定义的变量占位符
 */
pub fn render_template(content: &str, vars: &TemplateVars) -> String {
    content
        .replace("{{项目名}}", &vars.project_name)
        .replace("{{作者名}}", &vars.author)
        .replace("{{当前日期}}", &vars.date)
        .replace("{{当前时间}}", &vars.time)
        .replace("{{文体类型}}", &vars.project_type_label)
        .replace("{{题材}}", &vars.genre)
        .replace("{{项目描述}}", &vars.description)
}

/// 获取文体类型的中文显示名（用于模板变量）
pub fn project_type_label(project_type: &ProjectType) -> &'static str {
    match project_type {
        ProjectType::ShortStory => "短篇小说",
        ProjectType::Diary => "日记体",
        ProjectType::Dialogue => "对话体",
        ProjectType::MultiVolume => "长篇分卷",
        ProjectType::SharedWorld => "同世界观系列",
        ProjectType::Screenplay => "剧本式",
        ProjectType::Poetry => "诗歌体",
        ProjectType::Standard => "标准长篇",
    }
}

/// 小说项目文体类型枚举（按文体体裁分类）
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProjectType {
    /// 短篇小说
    ShortStory,
    /// 日记体
    Diary,
    /// 对话体
    Dialogue,
    /// 长篇分卷
    MultiVolume,
    /// 同世界观系列
    SharedWorld,
    /// 剧本式
    Screenplay,
    /// 诗歌体
    Poetry,
    /// 标准长篇（通用）
    Standard,
}

impl ProjectType {
    /// 从字符串解析项目类型（兼容旧版题材类型）
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "short_story" => ProjectType::ShortStory,
            "diary" => ProjectType::Diary,
            "dialogue" => ProjectType::Dialogue,
            "multi_volume" => ProjectType::MultiVolume,
            "shared_world" => ProjectType::SharedWorld,
            "screenplay" => ProjectType::Screenplay,
            "poetry" => ProjectType::Poetry,
            // 旧版兼容映射
            "essay" => ProjectType::ShortStory,
            "script" => ProjectType::Screenplay,
            "epic" | "wuxia" | "scifi" | "mystery" | "romance" => ProjectType::Standard,
            _ => ProjectType::Standard,
        }
    }
}

/// 项目元数据结构
/// 存储在项目根目录的 .novelforge/project.json 中
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMeta {
    /// 项目名称
    pub name: String,
    /// 项目文体类型
    #[serde(rename = "type")]
    pub project_type: String,
    /// 题材（可选，如玄幻/科幻/言情等）
    #[serde(rename = "genre", default, skip_serializing_if = "String::is_empty")]
    pub genre: String,
    /// 创建时间(ISO 8601)
    pub created_at: String,
    /// 最后修改时间(ISO 8601)
    pub updated_at: String,
    /// 项目版本
    pub version: String,
    /// 作者
    pub author: String,
    /// 项目描述
    pub description: String,
    /// 总字数
    pub word_count: u64,
}

/// 通用目录列表（所有文体类型共享）
pub fn common_directories() -> Vec<&'static str> {
    vec![
        "角色",        // 角色设计
        "世界观",      // 世界观设定
        "名词",        // 专有名词库
        "时间线",      // 时间线与思维导图
        "正文",        // 正文内容
        "大纲",        // 大纲与构思
        "素材",        // 参考资料
        ".novelforge", // 应用元数据目录
    ]
}

/// 通用预设文件
pub fn common_files() -> Vec<(&'static str, &'static str)> {
    vec![
        // ── 角色设定（专业级 6 字段主角模板）──
        (
            "角色/主角设定.txt",
            r#"主角设定

【基础信息】
姓名：
年龄：
性别：
身份/职业：

【外貌】
体型：
面容：
穿着风格：
标志性特征（疤痕/纹身/饰品）：

【性格】
核心特质：
优点：
缺点：
口头禅/习惯动作：

【背景】
出身来历：
关键经历：
性格成因：

【动机与目标】
内在动机（想要什么）：
外在目标（要做什么）：
核心冲突（什么阻碍）：

【人物关系】
与___的关系：___

【成长弧光】
起点状态：
转折契机：
终点蜕变：
"#,
        ),
        // ── 配角设定（精简 4 字段模板）──
        (
            "角色/配角设定.txt",
            r#"配角设定

【基础信息】
姓名：
身份：
与主角关系：

【外貌】
简要描述：

【性格】
核心特质：
说话风格：

【功能】
在故事中的作用：
"#,
        ),
        // ── 角色关系表（关系矩阵）──
        (
            "角色/角色关系表.txt",
            r#"角色关系表

角色A | 角色B | 关系类型 | 关系简述
--- | --- | --- | ---
| | |
| | |

关系类型参考：亲属 / 朋友 / 敌对 / 师徒 / 恋人 / 主仆 / 同盟 / 竞争
"#,
        ),
        // ── 世界观设定（6 维度专业模板）──
        (
            "世界观/世界观设定.txt",
            r#"世界观设定

【地理环境】
主要地域：
气候特征：
重要地标：

【历史背景】
时代划分：
关键历史事件：
当前局势：

【社会结构】
政治体制：
阶层划分：
经济形态：

【文化体系】
信仰宗教：
语言文字：
风俗习惯：

【力量体系】
力量来源：
等级划分：
限制与代价：

【势力阵营】
主要势力：
势力关系：
"#,
        ),
        // ── 名词模板（专有名词库）──
        (
            "名词/名词模板.txt",
            r#"专有名词

【名词】
释义：
使用场景：
相关条目：
"#,
        ),
        // ── 总体大纲（增强版，含项目名变量）──
        (
            "大纲/总体大纲.txt",
            r#"{{项目名}} 总体大纲

【一句话梗概】
[用一句话概括故事核心]

【主题立意】
[故事想表达什么]

【主要冲突】
核心矛盾：
主角 vs 对立面：

【人物动机】
主角内在动机：
主角外在目标：
对立面目标：

【情节结构】
起（开端）：
承（发展）：
转（高潮）：
合（结局）：

【结局走向】
预期结局：
主题升华：
"#,
        ),
        // ── 章节大纲模板（三级大纲）──
        (
            "大纲/章节大纲模板.txt",
            r#"章节大纲

第___章 ___

【本章梗概】
[一句话概括]

【出场人物】

【场景】
地点：
时间：

【情节要点】
1.
2.
3.

【伏笔/回收】
埋设：
回收：

【字数目标】
预计：___ 字
"#,
        ),
        // ── 人物弧线（成长曲线追踪）──
        (
            "大纲/人物弧线.txt",
            r#"人物弧线

角色名 | 起点 | 转折 | 终点
--- | --- | --- | ---
| | |

弧线说明：
- 起点：角色初始状态（信念/处境）
- 转折：改变契机的关键事件
- 终点：角色最终蜕变
"#,
        ),
        // ── 时间线（表格模板）──
        (
            "时间线/时间线.txt",
            r#"时间线

时间节点 | 事件 | 涉及角色 | 章节位置
--- | --- | --- | ---
| | |

说明：
- 时间节点可用"第一章"/"三年前"/"赤焰历1024年"等任意格式
- 按故事内时间顺序排列
"#,
        ),
        ("素材/.gitkeep", ""),
    ]
}

/// 获取特定文体的专属目录
pub fn type_specific_directories(project_type: &ProjectType) -> Vec<&'static str> {
    match project_type {
        ProjectType::ShortStory => vec![
            "灵感笔记",   // 灵感记录
            "人物速写",   // 角色速写
        ],
        ProjectType::Diary => vec![
            "日记存档",   // 日记归档
            "心理轨迹",   // 心理变化追踪
            "时间标注",   // 时间线标注
        ],
        ProjectType::Dialogue => vec![
            "角色声线",   // 角色语言风格
            "对话场景",   // 对话场景设计
            "台词存档",   // 经典台词
        ],
        ProjectType::MultiVolume => vec![
            "卷宗",           // 分卷管理
            "章节存档",       // 废弃章节
            "伏笔记录",       // 伏笔追踪
            "人物关系图",     // 人物关系
            "分卷大纲",       // 各卷大纲
        ],
        ProjectType::SharedWorld => vec![
            "系列规划",     // 系列总体规划
            "世界观总览",   // 共享世界观
            "时间线总览",   // 系列时间线
            "人物档案库",   // 跨作品人物
            "系列伏笔",     // 跨作品伏笔
        ],
        ProjectType::Screenplay => vec![
            "场景设定",   // 场景布景
            "分幕大纲",   // 幕次结构
            "道具清单",   // 道具管理
            "音效提示",   // 音效配乐
        ],
        ProjectType::Poetry => vec![
            "诗稿存档",   // 诗歌归档
            "韵律笔记",   // 韵律研究
            "意象集",     // 意象收集
        ],
        ProjectType::Standard => vec![
            "卷宗",         // 分卷管理
            "章节存档",     // 废弃章节
            "伏笔记录",     // 伏笔追踪
            "人物关系图",   // 人物关系
        ],
    }
}

/// 获取特定文体的专属预设文件
pub fn type_specific_files(project_type: &ProjectType) -> Vec<(&'static str, String)> {
    match project_type {
        ProjectType::ShortStory => vec![
            (
                "灵感笔记/灵感本.txt",
                "灵感本\n\n\
                 随时记录闪现的灵感与片段\n\n\
                 [灵感1]\n\n\
                 [灵感2]\n\n".to_string(),
            ),
            (
                "人物速写/人物模板.txt",
                "人物速写模板\n\n\
                 姓名:\n年龄:\n性别:\n\n\
                 性格关键词:\n外貌特征:\n核心动机:\n\n\
                 一句话概括:\n".to_string(),
            ),
        ],
        ProjectType::Diary => vec![
            (
                "日记存档/日记模板.txt",
                "日记模板\n\n\
                 日期:\n天气:\n心情:\n\n\
                 正文:\n\n".to_string(),
            ),
            (
                "心理轨迹/心理变化.txt",
                "心理变化追踪\n\n\
                 阶段 / 日期 / 心理状态 / 关键事件 / 变化原因\n\n\
                 初期 / / / / \n\
                 转折 / / / / \n\
                 后期 / / / / \n".to_string(),
            ),
        ],
        ProjectType::Dialogue => vec![
            (
                "角色声线/声线设定.txt",
                "角色声线设定\n\n\
                 角色名:\n语言风格:\n常用词汇:\n语气特征:\n口头禅:\n\n\
                 对话示例:\n\n".to_string(),
            ),
            (
                "对话场景/场景模板.txt",
                "对话场景模板\n\n\
                 场景:\n参与人物:\n核心冲突:\n氛围:\n\n\
                 对话:\n\n".to_string(),
            ),
        ],
        ProjectType::MultiVolume => vec![
            (
                "卷宗/分卷规划.txt",
                "分卷规划\n\n\
                 第一卷\n核心主线:\n预计字数:\n关键事件:\n\n\
                 第二卷\n核心主线:\n预计字数:\n关键事件:\n\n\
                 第三卷\n核心主线:\n预计字数:\n关键事件:\n".to_string(),
            ),
            (
                "伏笔记录/伏笔追踪.txt",
                "伏笔追踪表\n\n\
                 编号 / 伏笔内容 / 埋设卷章 / 揭示卷章 / 状态\n\
                 F001 / / / / 待埋设\n\
                 F002 / / / / 待埋设\n".to_string(),
            ),
            (
                "分卷大纲/卷间关联.txt",
                "卷间关联\n\n\
                 卷与卷之间的主线衔接、角色发展、伏笔传承\n\n\
                 第一卷 → 第二卷:\n承接内容:\n悬念留白:\n\n\
                 第二卷 → 第三卷:\n承接内容:\n悬念留白:\n".to_string(),
            ),
        ],
        ProjectType::SharedWorld => vec![
            (
                "系列规划/系列总览.txt",
                "系列总览\n\n\
                 系列名:\n已完成作品:\n规划作品:\n\n\
                 核心世界观:\n系列主线:\n\n\
                 各部关系:\n时间线:\n角色传承:\n".to_string(),
            ),
            (
                "世界观总览/世界观设定.txt",
                "世界观设定\n\n\
                 世界规则:\n地理环境:\n社会结构:\n历史背景:\n力量体系:\n\n\
                 贯穿设定:\n".to_string(),
            ),
            (
                "时间线总览/系列时间线.txt",
                "系列时间线\n\n\
                 作品 / 时间节点 / 关键事件 / 影响\n\n\
                 [作品1] / / / \n\
                 [作品2] / / / \n".to_string(),
            ),
            (
                "系列伏笔/跨作品伏笔.txt",
                "跨作品伏笔追踪\n\n\
                 编号 / 伏笔内容 / 埋设作品 / 揭示作品 / 状态\n\
                 X001 / / / / 待埋设\n\
                 X002 / / / / 待埋设\n".to_string(),
            ),
        ],
        ProjectType::Screenplay => vec![
            (
                "场景设定/场景列表.txt",
                "场景列表\n\n\
                 场景编号 / 场景名 / 地点 / 时间 / 出场人物\n\
                 S001 / / / / \n\
                 S002 / / / / \n".to_string(),
            ),
            (
                "分幕大纲/幕次结构.txt",
                "幕次结构\n\n\
                 第一幕\n场景:\n出场人物:\n核心冲突:\n结尾悬念:\n\n\
                 第二幕\n场景:\n出场人物:\n核心冲突:\n结尾悬念:\n".to_string(),
            ),
            (
                "道具清单/道具表.txt",
                "道具表\n\n\
                 编号 / 道具名 / 描述 / 出现场景 / 重要性\n\
                 P001 / / / / \n\
                 P002 / / / / \n".to_string(),
            ),
            (
                "角色/角色名册.txt",
                "角色名册\n\n\
                 此文件用于剧本台词人名预设，每行一个角色名\n\n\
                 主角\n配角A\n配角B\n".to_string(),
            ),
        ],
        ProjectType::Poetry => vec![
            (
                "诗稿存档/诗稿模板.txt",
                "诗稿模板\n\n\
                 标题:\n\n\
                 正文:\n\n\
                 创作手记:\n意象:\n韵律:\n".to_string(),
            ),
            (
                "韵律笔记/韵律记录.txt",
                "韵律记录\n\n\
                 诗体:\n韵脚:\n节奏:\n\n\
                 参考:\n".to_string(),
            ),
            (
                "意象集/意象库.txt",
                "意象库\n\n\
                 核心意象:\n反复出现的意象 / 象征意义 / 出现位置\n\n\
                 [意象1] / / \n\
                 [意象2] / / \n".to_string(),
            ),
        ],
        ProjectType::Standard => vec![
            (
                "伏笔记录/伏笔追踪.txt",
                "伏笔追踪表\n\n\
                 编号 / 伏笔内容 / 埋设章节 / 揭示章节 / 状态\n\
                 F001 / / / / 待埋设\n".to_string(),
            ),
            (
                "卷宗/分卷规划.txt",
                "分卷规划\n\n\
                 第一卷\n核心主线:\n预计字数:\n关键事件:\n".to_string(),
            ),
        ],
    }
}

/// 获取特定文体的初始正文文件（文件名, 内容）
/// 所有类型均不自动创建正文文件，由用户自行创建第一个 txt
pub fn initial_manuscript_file(_project_type: &ProjectType) -> Option<(&'static str, &'static str)> {
    None
}

/// 生成项目元数据
pub fn create_project_meta(
    name: &str,
    project_type: &ProjectType,
    genre: &str,
    author: &str,
    description: &str,
) -> ProjectMeta {
    let now = chrono_now_iso();
    ProjectMeta {
        name: name.to_string(),
        project_type: format!("{:?}", project_type).to_lowercase(),
        genre: genre.to_string(),
        created_at: now.clone(),
        updated_at: now,
        version: "1.0.0".to_string(),
        author: author.to_string(),
        description: description.to_string(),
        word_count: 0,
    }
}

fn chrono_now_iso() -> String {
    use chrono::Local;
    Local::now().to_rfc3339()
}

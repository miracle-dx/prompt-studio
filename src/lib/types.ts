// ========================================
// Prompt Studio 核心类型定义
// ========================================

// Prompt 主体
export interface Prompt {
  id: string;
  title: string;           // 标题
  content: string;         // Prompt 内容
  folderId: string | null; // 所属文件夹
  tags: string[];          // 标签
  createdAt: number;       // 创建时间戳
  updatedAt: number;       // 更新时间戳
  version: number;         // 版本号
  isFavorite: boolean;     // 是否收藏
  lastUsedAt: number;      // 最后使用时间
}

// 文件夹
export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

// Prompt 版本历史记录
export interface PromptVersion {
  id: string;
  promptId: string;
  content: string;
  createdAt: number;
  version: number;
}

// 应用设置
export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  autoSave: boolean;
}

// 使用历史记录
export interface HistoryEntry {
  promptId: string;
  usedAt: number;
}

// 全局应用状态
export interface AppState {
  // 数据
  prompts: Prompt[];
  folders: Folder[];
  settings: AppSettings;
  history: HistoryEntry[];
  
  // UI 状态
  activePromptId: string | null;
  editingPrompt: Prompt | null;  // 临时编辑状态（不持久化）
  searchQuery: string;
  selectedFolderId: string | null;
  isEditorDirty: boolean;  // 是否有未保存的修改
  activeView: 'library' | 'favorites' | 'history' | 'settings';  // 当前视图
  
  // CRUD 操作
  createPrompt: (folderId?: string | null) => Prompt;
  updatePrompt: (id: string, updates: Partial<Prompt>) => void;
  savePrompt: (id: string) => void;
  deletePrompt: (id: string) => void;
  duplicatePrompt: (id: string) => Prompt;
  toggleFavorite: (id: string) => void;
  
  // 文件夹操作
  createFolder: (name: string) => Folder;
  updateFolder: (id: string, updates: string | Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  
  // 历史记录操作
  addToHistory: (promptId: string) => void;
  clearHistory: () => void;
  
  // 设置操作
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // UI 操作
  setActivePrompt: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFolder: (id: string | null) => void;
  setActiveView: (view: 'library' | 'favorites' | 'history' | 'settings') => void;
  
  // 持久化
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

// ========================================
// 工具函数
// ========================================

// 生成唯一 ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 格式化时间
export function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

// 创建默认 Prompt
export function createDefaultPrompt(folderId?: string | null): Prompt {
  const now = Date.now();
  return {
    id: generateId(),
    title: '未命名 Prompt',
    content: '',
    folderId: folderId || null,
    tags: [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    isFavorite: false,
    lastUsedAt: now,
  };
}

// 默认文件夹
export const defaultFolders: Folder[] = [
  { id: 'work', name: '工作', createdAt: Date.now() },
  { id: 'personal', name: '个人', createdAt: Date.now() },
  { id: 'learning', name: '学习', createdAt: Date.now() },
];

// 默认示例数据
export const defaultPrompts: Prompt[] = [
  {
    id: 'prompt-1',
    title: '代码审查专家',
    content: `你是一位资深的代码审查专家，拥有 10 年以上的软件开发经验。

请审查以下代码，按照以下维度进行分析：

1. 代码质量与规范
2. 潜在问题与 Bug
3. 安全风险
4. 改进建议

代码：
{{code}}

请给出专业且有建设性的审查意见。`,
    folderId: 'work',
    tags: ['开发', '代码审查'],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000,
    version: 3,
    isFavorite: true,
    lastUsedAt: Date.now() - 3600000,
  },
  {
    id: 'prompt-2',
    title: '英文翻译官',
    content: `你是一位专业的中英文翻译专家。

请将以下内容翻译成{{target_language}}：

{{content}}

要求：
1. 保持原文的语气和风格
2. 专业术语准确
3. 符合目标语言的表达习惯`,
    folderId: 'work',
    tags: ['翻译', '写作'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 7200000,
    version: 2,
    isFavorite: false,
    lastUsedAt: Date.now() - 7200000,
  },
  {
    id: 'prompt-3',
    title: '产品需求文档助手',
    content: `你是一位经验丰富的产品经理。

请帮我完善以下产品需求：
{{requirement}}

请输出：
1. 用户痛点分析
2. 核心功能列表
3. 用户故事
4. 验收标准`,
    folderId: 'work',
    tags: ['产品', '需求'],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000,
    version: 1,
    isFavorite: false,
    lastUsedAt: Date.now() - 86400000,
  },
];

// ========================================
// 📦 模板超市 - 内置行业标准模板
// ========================================
export interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  content: string;
}

export const promptTemplates: Template[] = [
  {
    id: 'tpl-code-expert',
    title: '代码专家',
    description: '高质量代码生成，包含注释、测试、边界处理',
    icon: '👨‍💻',
    category: '开发',
    content: `你是一位{{语言}}技术专家，拥有10年以上开发经验。

请帮我完成以下任务：
{{任务描述}}

要求：
1. 代码结构清晰，遵循最佳实践
2. 添加必要的注释解释核心逻辑
3. 考虑边界情况和错误处理
4. 如适用，提供单元测试示例
5. 性能优化建议（如有）`,
  },
  {
    id: 'tpl-prd',
    title: '产品需求文档',
    description: '专业PRD生成器，用户故事+验收标准',
    icon: '📋',
    category: '产品',
    content: `你是一位资深产品经理。

产品背景：{{产品背景}}
需求描述：{{需求描述}}

请输出完整的PRD：

## 一、用户痛点分析
- 痛点1
- 痛点2

## 二、核心功能列表
| 功能 | 优先级 | 描述 |
|------|--------|------|
|      |        |      |

## 三、用户故事
作为{{用户角色}}，我需要{{功能}}，以便于{{价值}}。

## 四、验收标准
- Given（前置条件）
- When（用户操作）
- Then（预期结果）`,
  },
  {
    id: 'tpl-copywriting',
    title: '营销文案',
    description: 'AIDA模型，痛点+解决方案+号召',
    icon: '✍️',
    category: '营销',
    content: `你是一位爆款文案大师，精通AIDA模型。

产品：{{产品名称}}
特点：{{核心卖点}}
目标用户：{{目标人群}}

请生成营销文案：

## 【标题】
（吸引注意，制造好奇）

## 【痛点唤醒】
（直击用户痛点，建立共鸣）

## 【解决方案】
（产品如何解决痛点，提供价值）

## 【信任背书】
（数据/案例/评价消除顾虑）

## 【行动号召】
（明确下一步，制造紧迫感）`,
  },
  {
    id: 'tpl-email',
    title: '商务邮件',
    description: '专业得体的中英文邮件模板',
    icon: '📧',
    category: '办公',
    content: `你是一位跨国企业的专业商务沟通专家。

邮件目的：{{邮件目的}}
收件人：{{收件人身份}}
关键信息：{{核心内容}}

请生成{{语言}}邮件：

---
**主题：{{邮件主题}}**

{{称呼}}，

{{正文第一段：礼貌开场，说明来意}}

{{正文第二段：阐述关键信息，条理清晰}}

{{正文第三段：明确下一步行动或期待}}

此致
{{署名}}`,
  },
  {
    id: 'tpl-data-analysis',
    title: '数据分析报告',
    description: '结构化分析框架，发现+洞察+建议',
    icon: '📊',
    category: '数据',
    content: `你是一位拥有10年经验的数据分析师。

数据背景：{{数据背景}}
分析目标：{{分析目标}}

请输出专业分析报告：

## 📌 核心发现
（3-5个最关键的数据洞察）

## 📈 数据解读
| 指标 | 当前值 | 环比 | 解读 |
|------|--------|------|------|
|      |        |      |      |

## ⚠️ 问题识别
（异常波动、潜在风险分析）

## 💡 行动建议
（基于数据的可落地建议，按优先级排序）

## 🔮 趋势预测
（基于历史数据的未来判断）`,
  },
  {
    id: 'tpl-interview',
    title: '面试评估模板',
    description: '结构化面试评分和反馈',
    icon: '🎯',
    category: 'HR',
    content: `你是一位资深技术面试官。

候选人：{{姓名}}
岗位：{{应聘岗位}}
面试重点：{{考察维度}}

请完成面试评估：

## 整体评价
## 技术能力评分（1-10分）
- 基础知识：
- 问题解决：
- 代码质量：
- 系统设计：

## 软技能评分（1-10分）
- 沟通表达：
- 逻辑思维：
- 学习能力：
- 团队协作：

## 优势总结
## 待改进点
## 录用建议：✅强烈推荐 / ⚠️待定 / ❌不推荐`,
  },
  {
    id: 'tpl-paper-sum',
    title: '论文精读笔记',
    description: 'AI学术论文阅读辅助模板',
    icon: '📄',
    category: '学习',
    content: `你是一位耐心的学术导师，帮我精读论文。

论文标题：{{论文标题}}
研究领域：{{研究领域}}

请按以下框架输出：

## 🎯 核心贡献
（论文的3个最重要创新点）

## 🛠️ 方法概述
（用最通俗的语言解释核心方法）

## 📊 实验结果
（关键数据对比，效果提升幅度）

## ❓ 我有疑问
（可能存在的局限或未解释清楚的地方）

## 💡 启发应用
（对我的研究/工作有什么可借鉴的）`,
  },
  {
    id: 'tpl-translate',
    title: '专业翻译助手',
    description: '保留语境的本地化翻译',
    icon: '🌍',
    category: '语言',
    content: `你是一位专业翻译，精通{{源语言}}到{{目标语言}}的本地化翻译。

翻译目标：{{翻译内容类型}}
风格要求：{{风格要求 - 正式/口语/技术/文学}}

原文：
{{待翻译内容}}

---

译文：
{{翻译结果}}

备注：
（文化差异说明、专业术语解释等）`,
  },
  {
    id: 'tpl-bug-report',
    title: 'Bug 报告模板',
    description: '标准缺陷报告，复现步骤+预期实际',
    icon: '🐛',
    category: '开发',
    content: `你是一位严谨的测试工程师。

Bug 标题：{{一句话描述}}
严重程度：🔴阻断 / 🟡严重 / 🟡一般 / ⚪轻微
优先级：P0 / P1 / P2

## 环境信息
- 系统：{{操作系统}}
- 版本：{{软件版本}}
- 设备：{{设备型号}}

## 复现步骤
1.
2.
3.

## 实际结果
（发生了什么问题）

## 预期结果
（应该发生什么）

## 截图/日志
（附件链接）

## 临时规避方案
（如果有的话）`,
  },
  {
    id: 'tpl-meeting',
    title: '会议纪要',
    description: '结构化会议记录，决议+行动项',
    icon: '📝',
    category: '办公',
    content: `你是一位高效的会议纪要专员。

会议主题：{{会议主题}}
时间：{{会议时间}}
参会人：{{参会人员}}

## 📋 会议概要
（一句话总结会议核心成果）

## ✅ 已达成决议
1.
2.
3.

## 🎯 行动项
| 任务 | 负责人 | 截止日期 | 状态 |
|------|--------|----------|------|
|      |        |          |      |

## 📌 待跟进事项
（悬而未决，需要下次讨论的问题）

## 💬 其他备注`,
  },
];

// 按类别分组模板
export function getTemplatesByCategory(): Record<string, Template[]> {
  return promptTemplates.reduce((acc, tpl) => {
    if (!acc[tpl.category]) acc[tpl.category] = [];
    acc[tpl.category].push(tpl);
    return acc;
  }, {} as Record<string, Template[]>);
}

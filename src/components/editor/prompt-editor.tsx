"use client";

import { FileText, Plus, Tag, Clock, Save, Eye, Edit3, Columns, Trash2, Sparkles, Zap } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/ui/modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function PromptEditor() {
  const {
    folders,
    activePromptId,
    editingPrompt,
    updatePrompt,
    savePrompt,
    deletePrompt,
    createPrompt,
    isEditorDirty,
  } = useAppStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const [saveToastMessage, setSaveToastMessage] = useState("");
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('split');

  const activePrompt = editingPrompt;

  // 变量值状态
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // 提取变量（支持空格：{{ 变量名 }}）
  const VARIABLE_REGEX = /\{\{\s*([^{}]+?)\s*\}\}/g;
  const variables = activePrompt?.content 
    ? [...new Set([...activePrompt.content.matchAll(VARIABLE_REGEX)].map(m => m[1]))]
    : [];

  // 变量渲染后的内容
  const renderedContent = activePrompt?.content
    ? activePrompt.content.replace(VARIABLE_REGEX, (_, name) => variableValues[name] || `{{${name}}}`)
    : '';

  // ============ 🧪 Prompt 智能质检 ============
  const analyzePromptQuality = (content: string) => {
    const checks = [];
    
    // 1. 角色定义检测
    const hasRole = /你是|作为|扮演|扮演一个|role|system/i.test(content);
    checks.push({
      name: "角色定义",
      passed: hasRole,
      icon: "🎭",
      tip: hasRole ? "已设置明确角色" : "建议添加角色定位，例如「你是一位资深前端工程师」",
      weight: 3
    });

    // 2. 输出格式检测
    const hasFormat = /JSON|json|Markdown|markdown|代码|列表|表格|格式|output|format/i.test(content);
    checks.push({
      name: "输出格式",
      passed: hasFormat,
      icon: "📋",
      tip: hasFormat ? "已指定输出格式" : "建议明确输出格式（JSON/Markdown/代码块等）",
      weight: 2
    });

    // 3. 边界条件检测
    const hasBoundary = /不要|请勿|避免|禁止|不要忘记|注意|必须|应该|only|just/i.test(content);
    checks.push({
      name: "边界约束",
      passed: hasBoundary,
      icon: "🚧",
      tip: hasBoundary ? "已设置边界条件" : "建议添加约束（如「不要使用专业术语」「控制在300字以内」）",
      weight: 2
    });

    // 4. 示例检测
    const hasExample = /例如|比如|示例|example|举例|如下|像这样/i.test(content);
    checks.push({
      name: "示例说明",
      passed: hasExample,
      icon: "📝",
      tip: hasExample ? "已包含示例" : "复杂任务建议添加示例，效果提升 30%+",
      weight: 1
    });

    // 5. 反模式检测
    const antiPatterns = [
      { pattern: /详细回答|详细解释|详细说明/i, tip: "「详细回答」太模糊，建议具体说明「分5点回答」「代码+注释」" },
      { pattern: /尽可能|尽量/i, tip: "「尽可能」没有意义，建议用具体约束替换" },
      { pattern: /专业的?回答/i, tip: "「专业回答」太主观，建议说明「引用学术文献」「用工程术语」" },
    ];
    
    for (const ap of antiPatterns) {
      if (ap.pattern.test(content)) {
        checks.push({
          name: "反模式警告",
          passed: false,
          icon: "⚠️",
          tip: ap.tip,
          weight: 2
        });
        break;
      }
    }

    // 计算总分
    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const earnedWeight = checks.filter(c => c.passed).reduce((sum, c) => sum + c.weight, 0);
    const score = Math.round((earnedWeight / totalWeight) * 100);

    return { checks, score };
  };

  const [showQualityPanel, setShowQualityPanel] = useState(false);
  const qualityAnalysis = activePrompt?.content ? analyzePromptQuality(activePrompt.content) : null;

  // ============ 🤖 模型推荐器 ============
  const recommendModel = (content: string) => {
    const recommendations = [
      {
        name: "Claude 3.5 Sonnet",
        icon: "🟣",
        reason: /代码|编程|函数|class|function|def |代码审查|重构/i.test(content),
        cost: "¥0.015/1K tokens",
        strength: "代码质量最佳"
      },
      {
        name: "GPT-4o",
        icon: "🟢",
        reason: /创意|文案|写作|故事|小说|营销|广告|品牌/i.test(content),
        cost: "¥0.025/1K tokens",
        strength: "创意表达最佳"
      },
      {
        name: "Gemini 1.5 Pro",
        icon: "🔵",
        reason: /长文本|摘要|总结|文档|PDF|分析|研究|数据/i.test(content),
        cost: "¥0.012/1K tokens",
        strength: "长上下文处理最佳"
      },
      {
        name: "DeepSeek V3",
        icon: "🟠",
        reason: /数学|推理|逻辑|证明|计算|算法/i.test(content),
        cost: "¥0.007/1K tokens",
        strength: "数学推理最佳"
      }
    ];

    const matched = recommendations.find(r => r.reason);
    return matched || {
      name: "Claude 3.5 Sonnet",
      icon: "🟣",
      reason: true,
      cost: "¥0.015/1K tokens",
      strength: "通用场景首选"
    };
  };

  const modelRec = activePrompt?.content ? recommendModel(activePrompt.content) : null;

  // Ctrl+S 快捷键保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s" && activePromptId) {
        e.preventDefault();
        if (isEditorDirty) {
          savePrompt(activePromptId);
          
          // 只有不含变量的纯文本 Prompt 才自动复制
          if (variables.length === 0 && editingPrompt?.content) {
            navigator.clipboard.writeText(editingPrompt.content);
            setSaveToastMessage("已保存并复制到剪贴板");
          } else {
            setSaveToastMessage("已保存");
          }
          
          setSaveToastVisible(true);
          setTimeout(() => setSaveToastVisible(false), 2000);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePromptId, isEditorDirty, savePrompt, editingPrompt]);

  const handleSave = () => {
    if (activePromptId) {
      savePrompt(activePromptId);
      
      // 只有不含变量的纯文本 Prompt 才自动复制
      if (variables.length === 0 && editingPrompt?.content) {
        navigator.clipboard.writeText(editingPrompt.content);
        setSaveToastVisible(true);
        setSaveToastMessage("已保存并复制到剪贴板");
      } else {
        setSaveToastVisible(true);
        setSaveToastMessage("已保存");
      }
      
      setTimeout(() => setSaveToastVisible(false), 2000);
    }
  };

  const handleCreatePrompt = () => {
    createPrompt(null);
  };

  const handleConfirmDelete = () => {
    if (activePromptId) {
      deletePrompt(activePromptId);
    }
  };

  const handleDeleteClick = () => {
    // 判断是否是新建未保存的 prompt（version 为 1 且 未修改过）
    const isNewUnmodified = activePrompt && activePrompt.version === 1 && !isEditorDirty;
    if (isNewUnmodified) {
      deletePrompt(activePromptId!);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  // 切换 Prompt 时清空变量值
  useEffect(() => {
    setVariableValues({});
  }, [activePromptId]);

  return (
    <div className="flex h-full bg-white dark:bg-gray-950 relative">
      {/* 保存成功提示 */}
      {saveToastVisible && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{saveToastMessage}</span>
        </div>
      )}
      {/* 编辑器区域 - 全屏 */}
      <div className="flex-1 flex flex-col">
        {!activePrompt ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              选择一个 Prompt
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              从左侧 Prompt 库中选择一个开始编辑，或者创建一个新的 Prompt
            </p>
            <button
              onClick={handleCreatePrompt}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建新 Prompt
            </button>
          </div>
        ) : (
          <>
            {/* 编辑器头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={activePrompt.title}
                  onChange={(e) =>
                    updatePrompt(activePrompt.id, { title: e.target.value })
                  }
                  className="text-xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0"
                  placeholder="Prompt 标题"
                />
                {isEditorDirty && (
                  <span className="flex items-center gap-1 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                    <Save className="w-3 h-3" />
                    已修改
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* 视图切换按钮 */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      viewMode === 'edit'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    编辑
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      viewMode === 'split'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Columns className="w-3 h-3" />
                    分栏
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    预览
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQualityPanel(!showQualityPanel)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      showQualityPanel
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    智能质检
                    {qualityAnalysis && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        qualityAnalysis.score >= 80 ? 'bg-green-500 text-white' :
                        qualityAnalysis.score >= 60 ? 'bg-amber-500 text-white' :
                        'bg-red-500 text-white'
                      }`}>
                        {qualityAnalysis.score}分
                      </span>
                    )}
                  </button>
                  {variables.length > 0 && (
                    <button
                      onClick={() => {
                        if (variables.every(v => variableValues[v])) {
                          navigator.clipboard.writeText(renderedContent);
                          setSaveToastMessage("已复制到剪贴板");
                          setSaveToastVisible(true);
                          setTimeout(() => setSaveToastVisible(false), 2000);
                        }
                      }}
                      disabled={!variables.every(v => variableValues[v])}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        variables.every(v => variableValues[v])
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      复制使用
                    </button>
                  )}
                  {isEditorDirty ? (
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                  ) : activePrompt && activePrompt.version > 1 ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-green-500 bg-green-50 dark:bg-green-900/20">
                      <Save className="w-4 h-4" />
                      已保存
                    </span>
                  ) : null}
                </div>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>

            {/* 编辑器内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                {/* 元信息 */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Tag className="w-4 h-4" />
                    <select
                      value={activePrompt.folderId || ""}
                      onChange={(e) =>
                        updatePrompt(activePrompt.id, { folderId: e.target.value || null })
                      }
                      className="bg-transparent border-none outline-none cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 text-gray-500 dark:text-gray-400"
                    >
                      <option value="">未分类</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {activePrompt.version > 1 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>最后更新：{formatTime(activePrompt.updatedAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>v{activePrompt.version}</span>
                  </div>
                </div>

                {/* 内容区域 - 根据视图模式切换 */}
                <div className={`${viewMode === 'split' ? 'grid grid-cols-2 gap-6' : 'flex'}`}>
                  {/* 编辑区域 */}
                  {(viewMode === 'edit' || viewMode === 'split') && (
                    <div className={viewMode === 'edit' ? 'w-full' : 'border-r border-gray-200 dark:border-gray-700 pr-6'}>
                      <div className="mb-3 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        编辑
                      </div>
                      <textarea
                        value={activePrompt.content}
                        onChange={(e) =>
                          updatePrompt(activePrompt.id, { content: e.target.value })
                        }
                        className="w-full min-h-[500px] bg-transparent text-gray-900 dark:text-white text-base leading-relaxed resize-none outline-none focus:ring-0 border-none font-mono"
                        placeholder="在这里输入 Prompt 内容...&#10;使用 {{变量名}} 定义可填充变量"
                        spellCheck={false}
                      />
                    </div>
                  )}

                  {/* 预览区域 */}
                  {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className={viewMode === 'preview' ? 'w-full' : 'pl-6'}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          预览
                        </span>
                        {variables.length > 0 && (
                          <button
                            onClick={() => navigator.clipboard.writeText(renderedContent)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            复制填充后内容
                          </button>
                        )}
                      </div>
                      {/* 变量填充面板 */}
                      {variables.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v12m6-6H6" />
                            </svg>
                            检测到 {variables.length} 个变量
                          </div>
                          <div className="space-y-2">
                            {variables.map((name) => (
                              <div key={name} className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 w-24 truncate" title={name}>
                                  {name}
                                </span>
                                <input
                                  type="text"
                                  value={variableValues[name] || ''}
                                  onChange={(e) => setVariableValues(prev => ({ ...prev, [name]: e.target.value }))}
                                  placeholder={`输入${name}...`}
                                  className="flex-1 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="min-h-[500px] prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            text: ({ children }) => {
                              const text = String(children);
                              const parts = text.split(/(\{\{\s*[^{}]+?\s*\}\})/g);
                              return parts.map((part, i) => {
                                const match = part.match(/\{\{\s*([^{}]+?)\s*\}\}/);
                                if (match) {
                                  const varName = match[1];
                                  const hasValue = variableValues[varName];
                                  return (
                                    <span
                                      key={i}
                                      className={`px-1 rounded font-mono text-sm ${
                                        hasValue
                                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                      }`}
                                      title={hasValue ? variableValues[varName] : varName}
                                    >
                                      {hasValue ? variableValues[varName] : part}
                                    </span>
                                  );
                                }
                                return part;
                              });
                            }
                          }}
                        >
                          {activePrompt.content || '*暂无内容...\n\n提示：使用 `{{变量名}}` 语法定义可填充的变量，例如：\n\n```\n你是一位{{职业}}专家，请帮我{{任务}}\n```*'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ============ 🧪 智能质检面板 ============ */}
              {showQualityPanel && qualityAnalysis && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-900/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                      qualityAnalysis.score >= 80 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      qualityAnalysis.score >= 60 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {qualityAnalysis.score}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Prompt 质量评分</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {qualityAnalysis.score >= 80 ? '👍 很棒！你的 Prompt 质量很高' :
                         qualityAnalysis.score >= 60 ? '🤔 不错，还有优化空间' :
                         '💡 建议按照以下提示优化'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {qualityAnalysis.checks.map((check, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          check.passed
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{check.icon}</span>
                          <span className={`text-sm font-medium ${
                            check.passed ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
                          }`}>
                            {check.name}
                          </span>
                          <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                            check.passed
                              ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
                              : 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300'
                          }`}>
                            {check.passed ? '✓ 已满足' : '✗ 建议'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {check.tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============ 🤖 模型推荐卡片 ============ */}
              {modelRec && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xl shadow-sm">
                      {modelRec.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{modelRec.name}</span>
                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                          推荐
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {modelRec.strength} · {modelRec.cost}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                      <Zap className="w-3 h-3" />
                      <span>智能匹配</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="删除 Prompt"
        message={`确定要删除「${activePrompt?.title || ''}」吗？此操作无法撤销。`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  );
}

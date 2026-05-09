"use client";

import { FileText, Plus, Tag, Clock, Save, Eye, Edit3, Columns, Trash2, Sparkles, Wrench } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
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
      weight: 3,
      fixSuggestion: "在 Prompt 开头添加角色定义，例如：\n\n你是一位资深[领域]专家，拥有10年经验...",
    });

    // 2. 输出格式检测
    const hasFormat = /JSON|json|Markdown|markdown|代码|列表|表格|格式|output|format/i.test(content);
    checks.push({
      name: "输出格式",
      passed: hasFormat,
      icon: "📋",
      tip: hasFormat ? "已指定输出格式" : "建议明确输出格式（JSON/Markdown/代码块等）",
      weight: 2,
      fixSuggestion: "在 Prompt 末尾添加输出格式要求，例如：\n\n请按以下 Markdown 格式输出：\n- 要点1\n- 要点2",
    });

    // 3. 边界条件检测
    const hasBoundary = /不要|请勿|避免|禁止|不要忘记|注意|必须|应该|only|just/i.test(content);
    checks.push({
      name: "边界约束",
      passed: hasBoundary,
      icon: "🚧",
      tip: hasBoundary ? "已设置边界条件" : "建议添加约束（如「不要使用专业术语」「控制在300字以内」）",
      weight: 2,
      fixSuggestion: "添加明确的约束条件，例如：\n\n注意事项：\n1. 不要使用专业术语\n2. 回答控制在300字以内\n3. 用中文回复",
    });

    // 4. 示例检测
    const hasExample = /例如|比如|示例|example|举例|如下|像这样/i.test(content);
    checks.push({
      name: "示例说明",
      passed: hasExample,
      icon: "📝",
      tip: hasExample ? "已包含示例" : "复杂任务建议添加示例，效果提升 30%+",
      weight: 1,
      fixSuggestion: "添加示例说明，例如：\n\n示例输入：用户问题\n示例输出：期望的回答格式",
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
          weight: 2,
          fixSuggestion: ap.tip + "\n\n建议：将模糊表述替换为具体要求。",
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
                    onClick={() => setShowQualityPanel(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50`}
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
              <div className="max-w-5xl lg:max-w-6xl 2xl:max-w-7xl 3xl:max-w-[90rem] mx-auto">
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

            </div>
          </>
        )}
      </div>

      {/* ============ 🧪 智能质检弹窗 ============ */}
      <Modal
        isOpen={showQualityPanel && qualityAnalysis !== null}
        onClose={() => setShowQualityPanel(false)}
        title="✨ Prompt 智能质检"
        size="xl"
      >
        {qualityAnalysis && (
          <>
            {/* 分数展示 */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                qualityAnalysis.score >= 80 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                qualityAnalysis.score >= 60 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {qualityAnalysis.score}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-lg">质量评分</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {qualityAnalysis.score >= 80 ? '👍 很棒！你的 Prompt 质量很高' :
                   qualityAnalysis.score >= 60 ? '🤔 不错，还有优化空间' :
                   '💡 建议按照以下提示优化'}
                </p>
              </div>
            </div>

            {/* 检测项列表 */}
            <div className="space-y-3">
              {qualityAnalysis.checks.map((check, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    check.passed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-xl mt-0.5">{check.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${
                            check.passed ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
                          }`}>
                            {check.name}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            check.passed
                              ? 'bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300'
                              : 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300'
                          }`}>
                            {check.passed ? '✓ 已满足' : '✗ 建议优化'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {check.tip}
                        </p>
                        {!check.passed && (
                          <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-700">
                            <div className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">
                              <Wrench className="w-3 h-3" />
                              修复建议
                            </div>
                            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded">
                              {check.fixSuggestion}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                    {!check.passed && activePrompt && (
                      <button
                        onClick={() => {
                          const newContent = activePrompt.content + '\n\n' + check.fixSuggestion.split('例如：\n')[1] || check.fixSuggestion;
                          updatePrompt(activePrompt.id, { content: newContent });
                        }}
                        className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <Wrench className="w-3 h-3" />
                        一键修复
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 底部提示 */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 提示：点击「一键修复」会将优化建议追加到 Prompt 末尾，你可以根据实际需要调整位置。
              </p>
            </div>
          </>
        )}
      </Modal>

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

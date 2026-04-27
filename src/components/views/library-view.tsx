"use client";

import { FileText, Plus, Star, Trash2, Tag, Clock, Save } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/modal";

export function LibraryView() {
  const {
    prompts,
    folders,
    activePromptId,
    setActivePrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    createPrompt,
    isEditorDirty,
  } = useAppStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const activePrompt = prompts.find((p) => p.id === activePromptId);

  const handleCreatePrompt = () => {
    createPrompt(null);
  };

  const handleDeleteClick = (promptId: string) => {
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (promptToDelete) {
      deletePrompt(promptToDelete);
      setPromptToDelete(null);
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

  // 获取文件夹名称
  const getFolderName = (folderId: string | null) => {
    if (!folderId) return "未分类";
    const folder = folders.find((f) => f.id === folderId);
    return folder?.name || "未分类";
  };

  return (
    <div className="flex h-full">
      {/* Prompt 列表 */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* 列表头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            所有 Prompt
          </span>
          <button
            onClick={handleCreatePrompt}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            title="新建 Prompt"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt 列表 */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {prompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                还没有 Prompt
              </p>
              <button
                onClick={handleCreatePrompt}
                className="mt-3 text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                创建第一个
              </button>
            </div>
          ) : (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                  activePromptId === prompt.id
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                }`}
                onClick={() => setActivePrompt(prompt.id)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {prompt.title}
                    </span>
                    {prompt.isFavorite && (
                      <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" fill="currentColor" />
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title={prompt.isFavorite ? "取消收藏" : "收藏"}
                    >
                      <Star className={`w-3.5 h-3.5 ${prompt.isFavorite ? "text-yellow-500" : "text-gray-400"}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(prompt.id);
                      }}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                  {prompt.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(prompt.updatedAt)}
                  </span>
                  <span>{getFolderName(prompt.folderId)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-950">
        {!activePrompt ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              选择一个 Prompt
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
              从左侧列表选择一个 Prompt 开始编辑，或者创建一个新的 Prompt
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
                <button
                  onClick={() => toggleFavorite(activePrompt.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activePrompt.isFavorite
                      ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <Star
                    className="w-4 h-4"
                    fill={activePrompt.isFavorite ? "currentColor" : "none"}
                  />
                  {activePrompt.isFavorite ? "已收藏" : "收藏"}
                </button>
              </div>
            </div>

            {/* 编辑器内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* 元信息 */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Tag className="w-4 h-4" />
                    <span>{getFolderName(activePrompt.folderId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>最后更新：{formatTime(activePrompt.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>v{activePrompt.version}</span>
                  </div>
                </div>

                {/* 内容编辑 */}
                <textarea
                  value={activePrompt.content}
                  onChange={(e) =>
                    updatePrompt(activePrompt.id, { content: e.target.value })
                  }
                  className="w-full min-h-[500px] bg-transparent text-gray-900 dark:text-white text-base leading-relaxed resize-none outline-none focus:ring-0 border-none"
                  placeholder="在这里输入 Prompt 内容..."
                  spellCheck={false}
                />
              </div>
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
        message={`确定要删除「${prompts.find((p) => p.id === promptToDelete)?.title || ''}」吗？此操作无法撤销。`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  );
}

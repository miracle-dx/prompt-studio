"use client";

import { Star, FileText, Trash2, BookmarkPlus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatTime } from "@/lib/types";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/modal";

export function FavoritesView() {
  const { prompts, toggleFavorite, deletePrompt, setActivePrompt, activePromptId, addToHistory } =
    useAppStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null);

  const favoritePrompts = prompts.filter((p) => p.isFavorite).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleDeleteClick = (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPromptToDelete(promptId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (promptToDelete) {
      deletePrompt(promptToDelete);
      setPromptToDelete(null);
    }
  };

  const handleSelectPrompt = (id: string) => {
    setActivePrompt(id);
    addToHistory(id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
          <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            收藏夹
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            共 {favoritePrompts.length} 个收藏的 Prompt
          </p>
        </div>
      </div>

      {/* Prompt 列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {favoritePrompts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <BookmarkPlus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              还没有收藏的 Prompt
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              在 Prompt 库中点击收藏按钮，将常用的 Prompt 添加到这里
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {favoritePrompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`group relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                  activePromptId === prompt.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                }`}
                onClick={() => handleSelectPrompt(prompt.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                      {prompt.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt.id);
                      }}
                      className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="取消收藏"
                    >
                      <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(prompt.id, e)}
                      className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                  {prompt.content}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{formatTime(prompt.updatedAt)}</span>
                  <span>v{prompt.version}</span>
                </div>
              </div>
            ))}
          </div>
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

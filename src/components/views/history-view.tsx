"use client";

import { Clock, FileText, Trash2, RotateCcw } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/modal";

export function HistoryView() {
  const { history, clearHistory, setActivePrompt, prompts, addToHistory } =
    useAppStore();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const formatHistoryTime = (timestamp: number) => {
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

  const handleSelectPrompt = (promptId: string) => {
    setActivePrompt(promptId);
    addToHistory(promptId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 页面标题 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              历史记录
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              最近使用过的 {history.length} 个 Prompt
            </p>
          </div>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => setClearDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空历史
          </button>
        )}
      </div>

      {/* 历史列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <RotateCcw className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              暂无使用记录
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              打开并使用 Prompt 后，会自动记录在这里
            </p>
          </div>
        ) : (
          <div className="max-w-3xl lg:max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl mx-auto space-y-2">
            {history.map((entry) => {
              const prompt = prompts.find((p) => p.id === entry.promptId);
              return (
                <div
                  key={entry.promptId}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200 cursor-pointer hover:shadow-sm"
                  onClick={() => prompt && handleSelectPrompt(entry.promptId)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {prompt?.title || '已删除的 Prompt'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatHistoryTime(entry.usedAt)}
                    </p>
                  </div>
                  {prompt?.isFavorite && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs">
                        已收藏
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 清空确认弹窗 */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={clearHistory}
        title="清空历史记录"
        message="确定要清空所有使用历史记录吗？此操作无法撤销，但不会删除已保存的 Prompt。"
        confirmText="清空"
        variant="danger"
      />
    </div>
  );
}

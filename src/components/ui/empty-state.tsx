"use client";

import { FilePlus, Sparkles } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = "还没有 Prompt",
  description = "创建你的第一个 Prompt，开始 AI 创作之旅",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 flex items-center justify-center">
          <FilePlus className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 flex items-center justify-center animate-pulse">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-100">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-sm">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary gap-2">
          <Sparkles className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}

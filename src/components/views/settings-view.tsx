"use client";

import { Settings, Sun, Moon, Type, Save, RotateCcw, Database } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/modal";

export function SettingsView() {
  const { settings, updateSettings, resetSettings, prompts, folders, history } =
    useAppStore();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);

  const handleClearAllData = () => {
    // 清除所有数据
    localStorage.removeItem('prompt-studio-storage');
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            设置
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            自定义应用的行为和外观
          </p>
        </div>
      </div>

      {/* 设置内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 外观设置 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              外观
            </h3>

            {/* 主题切换 */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {settings.theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Sun className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    主题模式
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    选择浅色或深色主题
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    settings.theme === 'light'
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  浅色
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    settings.theme === 'dark'
                      ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  深色
                </button>
              </div>
            </div>

            {/* 字体大小 */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Type className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    编辑器字体大小
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    调整 Prompt 编辑器的字体大小
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-center">
                  {settings.fontSize}px
                </span>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) =>
                    updateSettings({ fontSize: parseInt(e.target.value) })
                  }
                  className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 保存设置 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              保存
            </h3>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Save className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    自动保存
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    修改时自动保存 Prompt
                  </div>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ autoSave: !settings.autoSave })}
                className={`relative w-12 h-7 rounded-full transition-all ${
                  settings.autoSave
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                    settings.autoSave ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 数据统计 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              数据统计
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {prompts.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Prompt
                </div>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {folders.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  文件夹
                </div>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {history.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  历史记录
                </div>
              </div>
            </div>
          </div>

          {/* 危险操作 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              危险操作
            </h3>

            {/* 重置设置 */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    重置设置
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    将所有设置恢复为默认值
                  </div>
                </div>
              </div>
              <button
                onClick={() => setResetDialogOpen(true)}
                className="px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
              >
                重置
              </button>
            </div>

            {/* 清除所有数据 */}
            <div className="flex items-center justify-between py-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    清除所有数据
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    删除所有 Prompt、文件夹和设置
                  </div>
                </div>
              </div>
              <button
                onClick={() => setClearDataDialogOpen(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                清除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 重置设置确认弹窗 */}
      <ConfirmDialog
        isOpen={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={() => {
          resetSettings();
          setResetDialogOpen(false);
        }}
        title="重置设置"
        message="确定要将所有设置恢复为默认值吗？此操作不会删除您的 Prompt 数据。"
        confirmText="重置"
        variant="danger"
      />

      {/* 清除数据确认弹窗 */}
      <ConfirmDialog
        isOpen={clearDataDialogOpen}
        onClose={() => setClearDataDialogOpen(false)}
        onConfirm={handleClearAllData}
        title="清除所有数据"
        message="确定要删除所有数据吗？包括所有 Prompt、文件夹和设置。此操作无法撤销！"
        confirmText="清除所有"
        variant="danger"
      />
    </div>
  );
}

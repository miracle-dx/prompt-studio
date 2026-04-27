"use client";

import { Save, Share2, Download, Bell, User, Moon, Sun, Copy, Play } from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 初始化时从 html 标签读取状态
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-5 flex-shrink-0 bg-white dark:bg-gray-900">
      {/* 左侧：标题信息 */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-semibold text-base text-gray-900 dark:text-white">
            代码审查专家
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>上次保存: 刚刚</span>
            <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500" />
            <span>v2.1</span>
          </div>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {/* 暗黑模式切换 */}
        <button
          onClick={toggleDarkMode}
          className="w-9 h-9 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
          title={isDarkMode ? "切换亮色模式" : "切换暗色模式"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <button className="w-9 h-9 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150">
          <Bell className="w-4 h-4" />
        </button>

        <button className="h-9 px-3 flex items-center gap-2 rounded-md text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150">
          <Share2 className="w-4 h-4" />
          分享
        </button>

        <button className="h-9 px-3 flex items-center gap-2 rounded-md text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150">
          <Download className="w-4 h-4" />
          导出
        </button>

        <button className="h-9 px-3 flex items-center gap-2 rounded-md text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150">
          <Copy className="w-4 h-4" />
          复制
        </button>

        <button className="h-9 px-4 flex items-center gap-2 rounded-md text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-150 shadow-sm hover:shadow">
          <Play className="w-4 h-4" />
          运行测试
        </button>

        <button className="h-9 px-4 flex items-center gap-2 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-150 shadow-sm hover:shadow ml-2">
          <Save className="w-4 h-4" />
          保存
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ml-2 cursor-pointer hover:scale-105 transition-transform shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
}

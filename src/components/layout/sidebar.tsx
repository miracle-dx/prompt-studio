"use client";

import {
  Sparkles,
  ChevronRight,
  Pencil,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { promptTemplates, getTemplatesByCategory } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/modal";

// 关键词高亮工具函数
const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-0.5 rounded font-medium">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
};

export function Sidebar() {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["work"]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPromptList, setShowPromptList] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{ id: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 按类别分组的模板
  const templatesByCategory = getTemplatesByCategory();

  const {
    folders,
    prompts,
    searchQuery,
    setSearchQuery,
    activePromptId,
    setActivePrompt,
    createPrompt,
    updatePrompt,
    createFolder,
    updateFolder,
    deleteFolder,
    activeView,
    setActiveView,
  } = useAppStore();

  // Ctrl/Cmd+K 快捷键聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      }
      // Escape 清除搜索
      if (e.key === "Escape" && searchQuery && searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, setSearchQuery]);

  // 编辑时自动聚焦输入框
  useEffect(() => {
    if (editingFolderId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingFolderId]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folder)
        ? prev.filter((f) => f !== folder)
        : [...prev, folder]
    );
  };

  const handleCreatePrompt = () => {
    createPrompt(null);
  };

  const handleCreateFolder = () => {
    const newFolder = createFolder("新建文件夹");
    setExpandedFolders((prev) => [...prev, newFolder.id]);
    setEditingFolderId(newFolder.id);
    setEditingFolderName("新建文件夹");
  };

  const handleRenameFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const folder = folders.find((f) => f.id === folderId);
    if (folder) {
      setEditingFolderId(folderId);
      setEditingFolderName(folder.name);
    }
  };

  const handleSaveRename = () => {
    if (editingFolderId && editingFolderName.trim()) {
      updateFolder(editingFolderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      setEditingFolderId(null);
      setEditingFolderName("");
    }
  };

  const handleDeleteFolder = (folderId: string, folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteFolderConfirm({ id: folderId, name: folderName });
  };

  const handleConfirmDeleteFolder = () => {
    if (deleteFolderConfirm) {
      deleteFolder(deleteFolderConfirm.id);
      setDeleteFolderConfirm(null);
    }
  };

  // 获取每个文件夹下的 Prompt
  const getPromptsByFolder = (folderId: string) => {
    return prompts
      .filter((p) => p.folderId === folderId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  };


return (
  <aside className="w-[280px] lg:w-[320px] 2xl:w-[360px] 3xl:w-[400px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
    {/* Logo 区域 */}
    <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
      <span className="text-lg font-bold text-gray-900 dark:text-white">
        📝 Prompt Studio
      </span>
      <button
        onClick={() => {
          const isDark = document.documentElement.classList.contains("dark");
          if (isDark) {
            document.documentElement.classList.remove("dark");
          } else {
            document.documentElement.classList.add("dark");
          }
        }}
        className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all duration-150"
      >
        <Sun className="w-4 h-4 dark:hidden" />
        <Moon className="w-4 h-4 hidden dark:block" />
      </button>
    </div>

    {/* 搜索框 */}
    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="搜索 Prompts... ⌘K"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>
    </div>

    {/* 导航区域 */}
    <nav className="flex-1 overflow-y-auto p-3 space-y-1">
      {/* 模板库入口 */}
      <button
        onClick={() => {
          setShowTemplateLibrary(!showTemplateLibrary);
          if (!showTemplateLibrary) setShowPromptList(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left ${
          showTemplateLibrary
            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>模板超市</span>
        <span className="ml-auto text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
          {promptTemplates.length}
        </span>
      </button>

      {/* 模板库内容 */}
      {showTemplateLibrary && (
        <div className="ml-4 mt-2 space-y-2">
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category}>
              <button
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronRight className={`w-3 h-3 transition-transform ${selectedCategory === category ? "rotate-90" : ""}`} />
                <span>{category}</span>
                <span className="ml-auto text-gray-400 dark:text-gray-500">{templates.length}</span>
              </button>
              {selectedCategory === category && (
                <div className="ml-4 space-y-1 mt-1">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        const newPrompt = createPrompt(null);
                        updatePrompt(newPrompt.id, {
                          title: tpl.title,
                          content: tpl.content,
                        });
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                        selectedTemplateId === tpl.id
                          ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400"
                      }`}
                    >
                      <span>{tpl.icon}</span>
                      <div className="flex-1 truncate">
                        <div className="font-medium">{tpl.title}</div>
                        <div className="text-[10px] opacity-70 truncate">{tpl.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Prompt 库 - 顶级入口 */}
      <button
        onClick={() => {
          setShowPromptList(!showPromptList);
          if (!showPromptList) setShowTemplateLibrary(false);
          setActiveView("library");
          setSearchQuery("");
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left ${
          activeView === "library"
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>Prompt 库</span>
      </button>

      {/* 搜索结果或文件夹列表 */}
      {showPromptList && searchQuery.trim() !== "" && (
        <div className="ml-4 space-y-1 mt-1">
          {prompts
            .filter(
              (p) =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
              const aTitleMatch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
              const bTitleMatch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
              if (aTitleMatch && !bTitleMatch) return -1;
              if (!aTitleMatch && bTitleMatch) return 1;
              return b.updatedAt - a.updatedAt;
            })
            .map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => setActivePrompt(prompt.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors text-left ${
                  activePromptId === prompt.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="truncate flex-1">{highlightText(prompt.title, searchQuery)}</span>
              </button>
            ))}
          {prompts.filter(
            (p) =>
              p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              p.content.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
              没有找到匹配的 Prompt
            </div>
          )}
        </div>
      )}

      {showPromptList && searchQuery.trim() === "" && (
        <div className="ml-4 space-y-1 mt-1">
          {/* 新建文件夹按钮 */}
          <button
            onClick={handleCreateFolder}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新建文件夹</span>
          </button>

          {/* 显示所有文件夹 */}
          {folders.map((folder) => (
            <div key={folder.id} className="group">
              <div
                onClick={() => toggleFolder(folder.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors text-left cursor-pointer ${
                  expandedFolders.includes(folder.id)
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <svg
                  className={`w-3 h-3 transition-transform ${expandedFolders.includes(folder.id) ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {editingFolderId === folder.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={handleRenameKeyDown}
                    className="flex-1 bg-white dark:bg-gray-700 border border-blue-500 rounded px-1 py-0.5 text-xs outline-none text-gray-900 dark:text-white"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="truncate flex-1">{folder.name}</span>
                    <span className="text-gray-400 dark:text-gray-500 mr-1">
                      {getPromptsByFolder(folder.id).length}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => handleRenameFolder(folder.id, e)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        title="重命名"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolder(folder.id, folder.name, e)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 显示文件夹下的 Prompts */}
              {expandedFolders.includes(folder.id) && (
                <div className="ml-5 mt-1 space-y-1">
                  {getPromptsByFolder(folder.id).map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => setActivePrompt(prompt.id)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors text-left ${
                        activePromptId === prompt.id
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="truncate flex-1">{prompt.title}</span>
                    </button>
                  ))}
                  {getPromptsByFolder(folder.id).length === 0 && (
                    <div className="px-3 py-1.5 text-xs text-gray-400 italic">
                      空文件夹
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* 未分类的 Prompts */}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">未分类</span>
              <span className="text-gray-400 dark:text-gray-500 ml-auto">
                {prompts.filter((p) => !p.folderId).length}
              </span>
            </button>
            <div className="ml-2">
              {prompts
                .filter((p) => !p.folderId)
                .map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => setActivePrompt(prompt.id)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors text-left ${
                      activePromptId === prompt.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="truncate flex-1">{prompt.title}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </nav>

    {/* 底部操作区 */}
    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={handleCreatePrompt}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>新建 Prompt</span>
      </button>
    </div>

    {/* 删除文件夹确认对话框 */}
    <ConfirmDialog
      isOpen={deleteFolderConfirm !== null}
      onClose={() => setDeleteFolderConfirm(null)}
      onConfirm={handleConfirmDeleteFolder}
      title="删除文件夹"
      message={`确定要删除「${deleteFolderConfirm?.name}」吗？${
        deleteFolderConfirm && getPromptsByFolder(deleteFolderConfirm.id).length > 0
          ? `文件夹内还有 ${getPromptsByFolder(deleteFolderConfirm.id).length} 个 Prompt，删除后它们将移至未分类。`
          : ''
      }`}
      confirmText="删除"
      variant="danger"
    />
  </aside>
);
}

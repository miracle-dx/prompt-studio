// ========================================
// Prompt Studio 全局状态管理
// Powered by Zustand
// ========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppState,
  Prompt,
  Folder,
  generateId,
  createDefaultPrompt,
  defaultFolders,
  defaultPrompts,
} from './types';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ============ 已保存的数据（持久化） ============
      prompts: defaultPrompts,
      folders: defaultFolders,
      settings: {
        theme: 'dark',
        fontSize: 14,
        autoSave: false,
      },
      history: [],
      activePromptId: null,
      
      // ============ 临时编辑状态（不持久化） ============
      editingPrompt: null,
      isEditorDirty: false,
      searchQuery: '',
      selectedFolderId: null,
      activeView: 'library',
      
      // ============ Prompt CRUD ============
      createPrompt: (folderId?: string | null) => {
        const newPrompt = createDefaultPrompt(folderId);
        set((state) => ({
          prompts: [newPrompt, ...state.prompts],
          activePromptId: newPrompt.id,
          editingPrompt: { ...newPrompt },
          isEditorDirty: false,
        }));
        return newPrompt;
      },
      
      updatePrompt: (id: string, updates: Partial<Prompt>) => {
        // 只更新临时编辑状态，不修改已保存的 prompts
        set((state) => {
          if (!state.editingPrompt) return state;
          const newEditingPrompt = { ...state.editingPrompt, ...updates };
          
          // 对比原始 prompt 和编辑后的内容，只有真正有变化才标记为 dirty
          const originalPrompt = state.prompts.find((p) => p.id === id);
          let isDirty = false;
          
          if (originalPrompt) {
            // 检查关键字段是否有变化
            const keyFields = ['title', 'content', 'folderId', 'tags'] as const;
            for (const field of keyFields) {
              const origVal = originalPrompt[field];
              const newVal = newEditingPrompt[field];
              if (JSON.stringify(origVal) !== JSON.stringify(newVal)) {
                isDirty = true;
                break;
              }
            }
          }
          
          return {
            editingPrompt: newEditingPrompt,
            isEditorDirty: isDirty,
          };
        });
      },
      
      savePrompt: (id: string) => {
        // 把临时编辑合并到已保存的数据
        set((state) => {
          if (!state.editingPrompt) return state;
          return {
            ...state,
            prompts: state.prompts.map((p) =>
              p.id === id
                ? {
                    ...state.editingPrompt!,
                    updatedAt: Date.now(),
                    version: p.version + 1,
                  }
                : p
            ),
            isEditorDirty: false,
          };
        });
      },
      
      deletePrompt: (id: string) => {
        set((state) => {
          const newPrompts = state.prompts.filter((p) => p.id !== id);
          const isActiveDeleted = state.activePromptId === id;
          return {
            prompts: newPrompts,
            activePromptId: isActiveDeleted
              ? newPrompts.length > 0
                ? newPrompts[0].id
                : null
              : state.activePromptId,
            editingPrompt: isActiveDeleted ? null : state.editingPrompt,
            isEditorDirty: false,
          };
        });
      },
      
      duplicatePrompt: (id: string) => {
        const prompt = get().prompts.find((p) => p.id === id);
        if (!prompt) throw new Error('Prompt not found');
        
        const duplicated: Prompt = {
          ...prompt,
          id: generateId(),
          title: `${prompt.title} (副本)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        };
        
        set((state) => ({
          prompts: [duplicated, ...state.prompts],
          activePromptId: duplicated.id,
          editingPrompt: duplicated,
          isEditorDirty: false,
        }));
        
        return duplicated;
      },
      
      toggleFavorite: (id: string) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
          ),
          editingPrompt:
            state.editingPrompt?.id === id
              ? { ...state.editingPrompt, isFavorite: !state.editingPrompt.isFavorite }
              : state.editingPrompt,
        }));
      },
      
      movePromptToFolder: (promptId: string, folderId: string | null) => {
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === promptId ? { ...p, folderId } : p
          ),
        }));
      },
      
      // ============ 文件夹 CRUD ============
      createFolder: (name: string) => {
        const newFolder: Folder = {
          id: generateId(),
          name,
          createdAt: Date.now(),
        };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        return newFolder;
      },
      
      updateFolder: (id: string, updates: string | Partial<Folder>) => {
        const folderUpdates: Partial<Folder> = typeof updates === 'string' 
          ? { name: updates } 
          : updates;
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...folderUpdates } : f
          ),
        }));
      },
      
      deleteFolder: (id: string) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          prompts: state.prompts.map((p) =>
            p.folderId === id ? { ...p, folderId: null } : p
          ),
          selectedFolderId:
            state.selectedFolderId === id ? null : state.selectedFolderId,
        }));
      },
      
      // ============ 历史记录 ============
      addToHistory: (promptId: string) => {
        set((state) => ({
          history: [
            { promptId, usedAt: Date.now() },
            ...state.history.filter((h) => h.promptId !== promptId).slice(0, 49),
          ],
        }));
      },
      
      clearHistory: () => {
        set({ history: [] });
      },
      
      // ============ 设置 ============
      updateSettings: (updates: Partial<AppState['settings']>) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
      
      resetSettings: () => {
        set({
          settings: {
            theme: 'dark',
            fontSize: 14,
            autoSave: false,
          },
        });
      },
      
      // ============ UI 交互 ============
      setActivePrompt: (id: string | null) => {
        // 切换 Prompt 时加载已保存的版本到临时编辑状态
        const prompt = id ? get().prompts.find((p) => p.id === id) : null;
        set({
          activePromptId: id,
          editingPrompt: prompt ? { ...prompt } : null,
          isEditorDirty: false,
        });
        if (id) {
          get().addToHistory(id);
        }
      },
      
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      setSelectedFolder: (id: string | null) => {
        set({ selectedFolderId: id });
      },
      
      setActiveView: (view: 'library' | 'favorites' | 'history' | 'settings') => {
        set({ activeView: view });
      },
      
      // ============ 持久化（手动触发） ============
      saveToLocalStorage: () => {
        // Zustand persist 中间件会自动处理
      },
      
      loadFromLocalStorage: () => {
        // Zustand persist 中间件会自动处理
      },
    }),
    {
      name: 'prompt-studio-storage', // localStorage key
      version: 1,
      // 只持久化已保存的数据，不持久化临时编辑状态
      partialize: (state) => ({
        prompts: state.prompts,
        folders: state.folders,
        settings: state.settings,
        history: state.history,
        activePromptId: state.activePromptId,
      }),
      // 迁移逻辑（如果以后数据结构变了）
      migrate: (persistedState: unknown) => {
        return persistedState;
      },
      // 初始化后加载 activePrompt 的编辑状态
      onRehydrateStorage: () => (state) => {
        if (state?.activePromptId) {
          const prompt = state.prompts.find((p) => p.id === state.activePromptId);
          if (prompt) {
            state.editingPrompt = { ...prompt };
          }
        }
      },
    }
  )
);

// ========================================
// 派生数据选择器（性能优化）
// ========================================

// 获取当前激活的 Prompt（使用临时编辑状态）
export const useActivePrompt = () => {
  return useAppStore((state) => state.editingPrompt);
};

// 获取筛选后的 Prompt 列表（按搜索词和文件夹）
export const useFilteredPrompts = () => {
  return useAppStore((state) => {
    let filtered = [...state.prompts];
    
    // 按文件夹筛选
    if (state.selectedFolderId) {
      filtered = filtered.filter((p) => p.folderId === state.selectedFolderId);
    }
    
    // 按搜索词筛选
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    
    // 按更新时间排序（最新的在前）
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  });
};

// 按文件夹分组的 Prompt
export const usePromptsByFolder = (folderId: string | null) => {
  return useAppStore((state) =>
    state.prompts
      .filter((p) => p.folderId === folderId)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  );
};

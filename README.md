# 🎨 Prompt Studio

> 按照 UI/UX Pro Max 方法论构建的专业 AI 提示词工作室

## ✨ 特性

- 🎯 **专业设计系统** - 完整的 Design Tokens，蓝紫渐变色系
- 🎨 **玻璃拟态风格** - 深色主题 + 毛玻璃效果
- ⚡ **微交互设计** - 平滑过渡动画，流畅用户体验
- ♿ **无障碍支持** - WCAG AA 标准，键盘导航
- 📱 **响应式布局** - 12列网格系统，适配各种屏幕

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📁 项目结构

```
src/
├── components/
│   ├── layout/          # 布局组件
│   │   ├── sidebar.tsx  # 侧边栏导航
│   │   ├── header.tsx   # 顶部导航栏
│   │   └── workspace.tsx # 工作区容器
│   ├── editor/           # 编辑器相关
│   │   └── prompt-editor.tsx
│   └── ui/              # 基础组件
├── styles/
│   └── globals.css      # 全局样式 + Design Tokens
├── lib/
│   └── utils.ts         # 工具函数
└── app/
    ├── layout.tsx
    └── page.tsx
```

## 🎯 Design Tokens

```css
/* 配色 */
--primary-500: #6366f1   (主色)
--background: #030712    (深色背景)

/* 间距 */
--spacing-*: 4px base scale

/* 圆角 */
--radius-*: 4px → 16px

/* 动画 */
--transition-*: 150ms ~ 300ms cubic-bezier
```

## 🛠️ 技术栈

- **框架**: Next.js 15 + React 19
- **样式**: Tailwind CSS 4
- **语言**: TypeScript
- **图标**: Lucide React
- **工具**: clsx + tailwind-merge

---

*Built with ❤️ using UI/UX Pro Max methodology*

# SKILL.md - ProdDoc AI

## 项目概述
ProdDoc AI 是一个通用软件产品说明书与操作文档生成工作台。

## 技术栈
- Next.js 16 (App Router, Webpack)
- TypeScript
- Tailwind CSS v4 + shadcn/ui
- framer-motion（动画）
- lucide-react（图标）
- docx + file-saver（Word 导出）
- localStorage（本地存储）

## 项目结构
- src/app/page.tsx → Dashboard 首页
- src/app/workspace/page.tsx → 工作台
- src/app/templates/page.tsx → 模板页
- src/app/history/page.tsx → 历史记录
- src/app/settings/page.tsx → 设置页
- src/components/ → 业务组件
- src/components/ui/ → shadcn/ui 组件
- src/lib/ → 工具函数
- public/images/ → 静态资源

## 设计规范
- 主色：indigo-600
- 背景：slate-50
- 卡片：rounded-2xl + border-slate-200 + shadow-sm
- 按钮：rounded-xl
- 动画：framer-motion MotionSection + CSS 动画

## 编码规范
- 函数式组件 + hooks
- Tailwind class，不要内联 style
- 颜色走 Tailwind 配置
- 所有 UI 文本中文

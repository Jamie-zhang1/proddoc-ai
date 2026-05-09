# ProdDoc AI UI Style Guide

本文档用于固化 ProdDoc AI 当前前端视觉规范。后续新增页面、组件或局部改版时，应优先复用这里的颜色、布局、卡片和动效规则，避免页面重新变成零散组件堆砌。

## 1. 品牌色

- 主品牌色使用 `indigo-600`，用于主按钮、当前导航项、关键图标、选中态边框和流程高亮。
- 辅助品牌色使用 `violet-600`，仅用于 Dashboard 主标题渐变和少量视觉强调。
- 品牌浅底使用 `indigo-50`，用于选中卡片、状态提示、步骤条和模板启用态。
- 深色模式下不要直接使用大面积高亮品牌色背景，优先使用 `dark:bg-indigo-500/10`、`dark:border-indigo-500/20`、`dark:text-indigo-300`。

## 2. Surface / Copy / Status Tokens

项目已在 `tailwind.config.ts` 中补充设计令牌：

- `brand`：品牌主色、品牌前景、浅品牌底。
- `surface`：页面卡片背景、弱背景和边框。
- `copy`：标题、正文、辅助文字。
- `status`：成功、警告、错误状态。

实际页面中仍可直接使用 Tailwind 的 `slate`、`indigo`、`emerald`、`amber`、`rose` 工具类，但语义必须和这些 token 一致。

## 3. 字体层级

- 页面大标题：`text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100`
- 区块标题：`text-xl font-semibold`
- 卡片标题：`text-base font-medium`
- 正文：`text-sm text-slate-600 dark:text-slate-400`
- 辅助文字：`text-xs text-slate-400`

不要在紧凑卡片、表单标签、按钮中使用过大的展示字体。Dashboard Hero 可以使用更大的标题，但其他页面保持 B 端工具的扫描效率。

## 4. 卡片、圆角和阴影

标准卡片：

```tsx
className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
```

交互卡片增加：

```tsx
className="hover-lift"
```

使用原则：

- 页面级容器和主要模块使用 `rounded-2xl`。
- 插画或大型展示区可使用 `rounded-3xl`，但不应泛滥。
- 阴影以 `shadow-sm` 为主，重要展示区域可用 `shadow-soft`。
- 不要嵌套多层厚重卡片，尤其在 Workspace 中要避免视觉拥挤。

## 5. 按钮和输入框

- 主按钮：`rounded-xl bg-indigo-600 hover:bg-indigo-500`。
- 次按钮：`variant="outline"`，浅色模式为白底，深色模式为 `dark:bg-slate-900`。
- Ghost 按钮只用于低优先级操作，例如查看说明、图标按钮。
- 按钮最小高度保持 `min-h-10`，移动端不要低于 `text-sm`。
- 输入框、Select、Textarea 聚焦态统一使用 `focus-visible:ring-2 focus-visible:ring-indigo-500`。

## 6. 浅色与深色模式

浅色模式：

- 页面背景使用 `slate-50`。
- 卡片背景使用 `white`。
- 弱区域使用 `slate-50`。
- 边框使用 `slate-200`。

深色模式：

- 页面背景使用 `slate-950`，避免纯黑刺眼。
- 卡片背景使用 `slate-900`。
- 弱区域使用 `slate-950`。
- 边框使用 `slate-800`。
- 品牌选中态使用透明 indigo，不使用整块亮白或高饱和色。

检查深色模式时重点看：表单标签、Select、空状态、历史表格、Settings 状态卡片是否有足够对比度。

## 7. 页面布局规则

通用页面容器使用：

```tsx
className="page-shell"
```

其定义为 `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`。

页面间距：

- 大区块之间使用 `space-y-8` 或 `space-y-12`。
- 卡片网格使用 `gap-6`。
- 页面首屏标题区域优先使用单个大卡片，不要堆多个并列说明块。

Workspace：

- 桌面端使用三栏：左侧 `16rem`，中间自适应，右侧约 `24rem`。
- 1024px 以下自然堆叠为单列，不强制保持三栏。
- 左侧快速开始和模块选择必须保持可读，不允许文字被挤成竖排。

Templates：

- 使用 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`。
- 模板卡顶部必须有线框视觉区，启用态使用品牌左边框。

History：

- 搜索框带左侧搜索图标。
- 文档类型筛选使用 pill 样式按钮，不使用复杂筛选面板。

## 8. 动效规则

项目使用 `framer-motion` 的 `MotionSection` 为页面区块提供轻量滚动进入动画：

- 初始：`opacity: 0, y: 20`
- 进入：`opacity: 1, y: 0`
- `viewport={{ once: true }}`

卡片 hover 使用 `hover-lift`：

- `hover:-translate-y-0.5`
- `hover:shadow-md`
- 持续时间保持短，避免像营销页过度动效。

按钮 hover 可以使用轻微 `hover:scale-[1.02]`，不要用于密集表格里的小图标按钮。

## 9. 插画和图标

- Dashboard、Workspace、History、Settings 使用本地 SVG 插画，路径位于 `public/images/characters/`。
- Templates 使用线框模板视觉组件和 `template-documents.svg`。
- 不热链外部图片。
- 插画只作为理解辅助，不应遮挡表单、按钮或文档正文。
- 图标使用 `lucide-react`，重要入口图标使用品牌色圆形底。

## 10. 后续新增页面约束

新增页面必须满足：

- 使用 `AppHeader`，不要另起导航风格。
- 页面容器使用 `page-shell`。
- 主卡片使用 `rounded-2xl border border-slate-200 bg-white shadow-sm` 并补齐 dark 样式。
- 所有交互控件必须有 hover/focus 状态。
- 移动端不得出现横向滚动。
- 深色模式下不得出现白底卡片、黑色文字或不可读输入框。
- 不新增具体客户、具体行业平台或历史项目痕迹。

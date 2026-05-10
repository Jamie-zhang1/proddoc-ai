# ProdDoc AI

通用型软件产品说明书与操作文档生成工作台。

**技术栈**：Next.js 16 / TypeScript / Tailwind CSS / shadcn/ui / localStorage / IndexedDB / docx / Playwright

**核心能力**：AI 流式生成 / 提示词生成 / Mock 文档 / 模板工作流 / 批量模块管理 / 活动日志 / Word 多格式导出 / 深色模式 / 离线支持

![Dashboard](public/screenshots/dashboard.png)

## 项目简介

ProdDoc AI 面向产品经理、售前顾问、实施交付和培训人员，帮助基于产品模块信息快速生成产品说明书、操作手册、培训讲稿和售前介绍。

支持三种生成模式：
- **AI 流式生成**：配置模型服务后，通过 API Route 调用大模型逐 token 生成正文
- **提示词辅助**：生成结构化提示词，复制到常用 AI 工具继续生成
- **Mock 文档**：不依赖 API，快速生成离线初稿用于演示

## 功能特性

### 🚀 核心功能
- **批量模块管理**：手动添加、批量粘贴导入、Demo 快速填充
- **AI 流式生成**：支持 OpenAI-compatible API，逐 token 实时输出
- **模板系统**：6 种预置模板 + 自定义模板，支持从旧文档提取模板
- **Word 导出**：3 种格式（正式文档 / 简洁报告 / 带页眉页脚）+ PDF + Markdown + 批量 ZIP
- **活动日志**：自动记录所有生成、提示词、API 调用，支持筛选搜索

### 🎨 界面体验
- **响应式布局**：手机 / 平板 / 桌面自适应
- **深色模式**：完整的深色主题支持
- **骨架屏加载**：页面加载时显示 shimmer 动画
- **首次引导**：3 步 Tour 帮助新用户快速上手
- **键盘快捷键**：Ctrl+Enter / Ctrl+Shift+Enter / Ctrl+S
- **流式输出**：API 生成时逐 token 显示，实时预览

### ⚙️ 设置与配置
- **模型参数调节**：Temperature、Max Tokens、Top P
- **导出设置**：默认格式、文件名模板、元数据选项
- **数据管理**：导出/导入/清除所有数据，localStorage + IndexedDB 双存储
- **API 环境检查**：一键检测配置状态

### 🔒 安全与质量
- **Rate Limiting**：API 限流防滥用
- **输入校验**：prompt 长度、参数范围验证
- **无障碍**：ARIA 属性、焦点管理、键盘导航
- **错误边界**：区分错误类型、复制错误信息
- **单元测试**：23 个测试覆盖核心模块
- **离线支持**：Service Worker 缓存 + 离线指示器

## 页面结构

| 页面 | 路径 | 说明 |
|------|------|------|
| Dashboard | `/` | 产品介绍、快速入口、功能卡片 |
| Workspace | `/workspace` | 核心工作台：模块选择 + 文档配置 + 生成导出 |
| Templates | `/templates` | 模板浏览、搜索筛选、自定义模板解析 |
| History | `/history` | 活动日志、多类型筛选、搜索删除 |
| Settings | `/settings` | API 配置、模型参数、数据管理、快捷键 |
| Editor | `/editor` | 全文编辑器 |

## 本地运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build

# 启动生产服务
npm start
```

访问 `http://localhost:3000`

## API 配置

在项目根目录创建 `.env.local`：

```bash
AI_API_KEY=your_api_key_here
AI_BASE_URL=https://your-provider-compatible-endpoint
AI_MODEL=your-model-name
```

支持任何 OpenAI-compatible API（如 MiMo、OpenAI、Claude 等）。

配置后重启 `npm run dev`，进入 Settings 检查配置状态。

## 项目结构

```
src/
├── app/                    # 页面路由
│   ├── page.tsx           # Dashboard 首页
│   ├── workspace/         # 工作台
│   ├── templates/         # 模板页
│   ├── history/           # 历史记录
│   ├── settings/          # 设置页
│   ├── editor/            # 全文编辑器
│   └── api/               # API Routes
├── components/
│   ├── workspace/         # 工作台组件
│   │   ├── module-selector.tsx
│   │   ├── document-config.tsx
│   │   └── generation-panel.tsx
│   ├── ui/                # shadcn/ui 组件
│   ├── tour-overlay.tsx   # 首次引导
│   ├── skeleton.tsx       # 骨架屏
│   ├── progress-bar.tsx   # 进度条
│   ├── error-boundary.tsx # 错误边界
│   └── offline-indicator.tsx # 离线指示
├── lib/
│   ├── types.ts           # 类型定义
│   ├── storage.ts         # localStorage + IndexedDB 管理
│   ├── db.ts              # IndexedDB 封装
│   ├── rate-limit.ts      # API 限流
│   ├── mock-data.ts       # Demo 数据
│   ├── prompt-builder.ts  # 提示词构建
│   ├── document-generator.ts # Mock 文档生成
│   ├── export-docx.ts     # Word/PDF/Markdown 导出
│   └── image-compress.ts  # 图片压缩
├── data/
│   ├── demo-projects.json # Demo 项目数据
│   └── templates.json     # 模板定义
└── __tests__/             # 单元测试
    ├── prompt-builder.test.ts
    ├── storage.test.ts
    └── rate-limit.test.ts
```

## 部署

### PM2 生产部署

```bash
# 构建
npm run build

# PM2 启动
pm2 start node_modules/.bin/next --name proddoc -- start -p 3001 -H 0.0.0.0

# 设置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理

```nginx
server {
    listen 3000;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 自动部署

支持 Git Hook 自动部署：代码 push 后自动 build + restart，需确认后执行。

## 测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch
```

## 技术说明

- **数据存储**：localStorage（轻量配置）+ IndexedDB（截图和大文档）
- **API 安全**：Rate Limiting + 输入校验 + API Key 服务端读取
- **离线支持**：Service Worker 缓存静态资源
- **兼容性**：Windows/Linux/macOS 均可运行

## 后续规划

- 团队协作功能
- 更多 AI 模型支持
- OCR 截图自动识别
- 视觉模型分析截图

## Illustration Credits

Illustrations by Storyset. Character illustrations are stored locally as SVG assets under `public/images/characters/`.

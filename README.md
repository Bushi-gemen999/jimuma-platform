# 积木码 - 可视化编程平台

> 用积木拼出你的创意，用代码驱动你的想法

## 在线访问

**前端地址**：https://Bushi-gemen999.github.io/jimuma-platform/

**后端地址**：待部署（需要 Node.js 环境，推荐使用 Render/Railway）

## 项目结构

```
积木码/
├── frontend/          # 前端（React 18 + Vite + Ant Design + ReactFlow）
│   └── src/
│       └── pages/
│           ├── Home.jsx          # 首页/创意广场
│           ├── Login.jsx         # 登录/注册
│           ├── Register.jsx      # 注册页面
│           ├── Profile.jsx       # 个人中心
│           ├── Editor.jsx        # 可视化积木编辑器
│           └── ProjectDetail.jsx # 项目详情页
├── backend/           # 后端（Node.js + Express + LowDB）
│   ├── server.js      # Express 服务器
│   ├── db.js          # LowDB 数据库操作
│   └── routes/        # API 路由
│       ├── auth.js    # 认证（注册/登录）
│       ├── project.js # 项目 CRUD
│       ├── user.js    # 用户信息/贡献值
│       └── ai.js      # AI 生成积木
└── .env.example       # 环境变量模板
```

## 本地运行

### 前端

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

### 后端

```bash
cd backend
# 配置 .env 文件（参考 .env.example）
npm install
npm run dev
# 服务运行在 http://localhost:3001
```

## 功能特性

- ✅ 用户注册 / 登录（JWT 认证）
- ✅ 创意广场（浏览所有项目）
- ✅ 可视化积木编辑器（ReactFlow）
- ✅ AI 生成积木（通义千问）
- ✅ 纯文字创意发布
- ✅ 项目详情（Bug 修复 / 功能优化提交）
- ✅ 一键复刻（Fork）
- ✅ 贡献确认机制
- ✅ 个人中心（我的创作 / 我的贡献 / 我的收藏）
- ✅ 收藏 / 取消收藏
- ✅ 自定义积木

## 技术栈

| 角色 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite |
| UI 组件库 | Ant Design 5 |
| 可视化编辑器 | ReactFlow |
| 路由 | React Router 6 |
| HTTP 客户端 | Axios |
| 后端框架 | Node.js + Express |
| 数据库 | LowDB（JSON 文件） |
| 认证 | JWT |
| AI | 阿里云通义千问 qwen-turbo |

## 贡献值体系

| 行为 | 贡献值 |
|------|--------|
| 发布项目 | +10 |
| Bug 修复被确认 | +10 |
| 功能优化被确认 | +15 |

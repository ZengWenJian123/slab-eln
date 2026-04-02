# SLAB-ELN (MVP)

SLAB-ELN 是一个面向小型实验室的 ELN/LIMS Web 单体应用，覆盖从成分设计到样品追溯的 P0 流程。

## Tech Stack

- Next.js 15 + TypeScript + App Router
- Ant Design
- Prisma + MySQL
- NextAuth (Credentials)
- 本地/NAS 文件存储

## Quick Start

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env
```

3. 生成 Prisma Client 并迁移数据库

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. 初始化管理员与基础字典

```bash
npm run db:seed
```

5. 启动开发环境

```bash
npm run dev
```

默认管理员：

- 用户名：`admin`
- 密码：`admin123456`

## Scripts

- `npm run dev`：开发模式
- `npm run build`：构建
- `npm run start`：生产启动
- `npm run lint`：代码检查
- `npm run test`：运行单元测试

## Implemented P0 Modules

- 登录与 RBAC（ADMIN / OPERATOR / VIEWER）
- 成分设计
- 熔炼批次
- 拉丝批次
- 样品管理与样品详情追溯
- 后处理记录
- 性能测试记录
- 图片中心与文件上传
- 数据字典
- 用户管理
- 操作日志


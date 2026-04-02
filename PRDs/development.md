实验室电子记录与信息管理系统（ELN & LIMS）技术文档

版本：V1.0
适用范围：一期开发 / 本地部署 / 交付 Codex 实现
技术原则：成熟框架优先、单仓库优先、本地服务优先、低运维复杂度

1. 技术目标

本系统需要满足以下技术目标：

支持实验流程类后台系统的完整 CRUD、检索、追溯与导出
支持复杂表单、自动计算、状态流转、失败原因强校验
支持本地文件上传、样品绑定、原始数据解析和结果回写
所有核心服务本地部署，不依赖云厂商托管能力
不重复造轮子，优先采用成熟的开源框架和现成组件
代码结构清晰，方便 Codex 生成后继续人工维护
2. 总体技术路线
2.1 总体方案

本项目采用单仓库、本地服务化、前后端一体化方案：

前端：Next.js
后端：Next.js App Router + Route Handlers + Server Actions
数据库：MySQL（本地部署）
ORM：Prisma
鉴权：Auth.js
UI：shadcn/ui + Tailwind CSS
表单：React Hook Form + Zod
表格：TanStack Table
队列与后台任务：BullMQ + Redis（本地部署）
文件存储：本地文件系统
图表：Apache ECharts
CSV 解析预览：Papa Parse
上传交互：react-dropzone

Next.js 官方文档当前将 App Router 作为主路线，支持基于文件系统的路由，并结合 Server Components、Suspense、Server Functions 等能力；Route Handlers 用于在 app 目录内创建请求处理逻辑，适合本项目的前后端一体化实现。

3. 选型原则
3.1 选型原则
成熟：优先选社区广泛使用、文档完善、维护活跃的开源项目
本地可运行：必须支持在实验室服务器或开发机本地部署
与 Next.js 兼容好：减少集成成本
避免重复造轮子：认证、表单、表格、队列、图表、上传等都优先用现成方案
适合后台系统：不是官网，不以动画和展示为主
3.2 明确禁止 Codex 手搓的内容

以下能力不允许 Codex 自己造轮子，必须用成熟库：

认证与会话管理
ORM 与数据库迁移
表单状态管理与校验
数据表格
队列系统
文件拖拽上传交互
图表
CSV 解析
UI 基础组件库
日期选择、弹窗、抽屉、提示消息等基础交互
4. 技术架构
4.1 逻辑架构
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Web UI                    │
│ Next.js App Router + shadcn/ui + Tailwind + RHF + Zod     │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                    │
│  Pages / Layouts / Route Handlers / Server Actions        │
│  Auth.js / Prisma Client / Domain Services                │
└─────────────────────────────────────────────────────────────┘
                 │                    │                   │
                 ▼                    ▼                   ▼
      ┌────────────────┐   ┌──────────────────┐  ┌──────────────────┐
      │ MySQL          │   │ Local File Store │  │ Redis (local)    │
      │ business data  │   │ uploads/raw-data │  │ BullMQ backend   │
      └────────────────┘   └──────────────────┘  └──────────────────┘
                                                          │
                                                          ▼
                                              ┌──────────────────────┐
                                              │ Worker Process       │
                                              │ BullMQ Worker        │
                                              │ Python Script Runner │
                                              └──────────────────────┘
4.2 部署形态

推荐采用以下本地部署形态：

web：Next.js 应用
mysql：MySQL 服务
redis：Redis 服务
worker：BullMQ Worker + Python 脚本执行进程
uploads：本地目录挂载
说明

这仍然是一个本地部署的单系统，不是云架构，也不是微服务拆分。
增加 Redis 和 Worker 的原因只有一个：用成熟方案处理“原始数据解析任务”，避免 Codex 手写任务轮询、状态机、重试器。

BullMQ 官方文档说明它是构建在 Redis 之上的 Node.js 队列系统；其快速开始文档也明确要求本地运行 Redis，并使用 Queue / Worker 模式处理任务。

5. 推荐技术栈
5.1 前端
基础框架
next
react
react-dom
typescript

Next.js 是用于构建全栈 Web 应用的 React 框架，并自动配置底层构建工具；App Router 是当前主路径。

UI 与样式
tailwindcss
shadcn/ui
lucide-react

shadcn/ui 官方文档将其定位为一套可定制、可扩展、开源且开放源码的组件体系，并明确支持与 React/Next.js 一起使用；其组件目录已覆盖 Sidebar、Table、Dialog、Form、Select、Tabs、Sheet、Calendar 等后台常用组件。

表单
react-hook-form
zod

React Hook Form 官方文档强调其“performant, flexible and extensible”，适合复杂表单；Zod 是 TypeScript-first 的验证库，支持从简单字符串到复杂嵌套对象的 schema 定义，适合前后端统一校验。

表格
@tanstack/react-table

TanStack Table 适合实现排序、过滤、分页和复杂表格逻辑；shadcn/ui 的 Table / Data Table 文档也明确建议与 @tanstack/react-table 组合。

数据请求与前端缓存
@tanstack/react-query

TanStack Query 官方文档说明它用于获取、缓存、同步和更新服务端状态，适合本项目中的列表、详情、筛选结果和局部刷新。

文件上传交互
react-dropzone

react-dropzone 官方文档将其描述为 React 文件拖拽上传组件，适合原始数据上传页和附件上传页。

图表
echarts
echarts-for-react（React 封装）

Apache ECharts 官方文档将其描述为功能强、可交互、可定制的数据可视化图表库，适合首页看板、结果趋势和统计模块。

CSV 前端预览
papaparse

Papa Parse 官方文档支持本地 CSV 解析、流式处理、worker 线程处理和 JSON/CSV 转换，适合前端做上传前预览和导出格式处理。

5.2 后端
应用框架
Next.js App Router
Route Handlers
Server Actions

本项目不拆独立后端服务，直接用 Next.js 的全栈能力完成接口和服务端逻辑。

ORM
Prisma ORM

Prisma 官方文档说明其提供声明式 schema、类型安全开发体验和自动化迁移；并且支持 MySQL 连接器。

认证
Auth.js

Auth.js 官方文档说明其可在 Next.js 中通过 auth.ts 和 App Router Route Handler 集成，并可在 Middleware、Server Components、Route Handlers 中使用。对于本项目，建议使用 Credentials 登录方式，避免依赖第三方 OAuth 或邮件服务。

队列与后台任务
BullMQ
ioredis

BullMQ 是构建在 Redis 上的成熟 Node.js 队列系统，适合本地解析任务的排队、执行、失败重试和状态追踪。

Python 脚本调用
Node.js child_process
Python 3 本地环境
你已有的数据清洗脚本

这里不重新实现算法，直接由 Worker 调用现有 Python 脚本，读取本地原始文件，输出结构化 JSON，再回写 MySQL。

5.3 数据与基础服务
数据库
MySQL 8.x
缓存 / 队列后端
Redis 7.x
文件存储
服务器本地目录
不使用 MinIO
不使用 S3
不使用任何云对象存储
本地运维
推荐 Docker Compose
也支持直接本机安装 MySQL / Redis / Python / Node.js
6. 为什么选这套，不选别的
6.1 不选 Ant Design / MUI 作为主 UI 框架

原因：

容易把后台做成重型组件驱动项目
样式覆盖成本高
与你希望的“简洁、可控、易维护”不完全一致
结论
用 shadcn/ui 做基础组件
用 Tailwind 控制风格
组件代码进项目，可控性更高

shadcn/ui 官方文档明确说明它不是传统黑盒组件库，而是开放源码、可自定义的组件分发方式。

6.2 不选 Sequelize / TypeORM

原因：

Prisma 的类型推导、schema 和迁移体验更适合让 Codex 生成稳定代码
对 MySQL 支持清晰
Prisma Studio 也适合本地调试

Prisma 官方文档持续强调其 schema、type-safe 开发体验与迁移能力。

6.3 不手搓认证

原因：

登录、会话、路由保护属于高风险通用基础能力
必须用成熟方案
结论
统一使用 Auth.js
首版只做本地账号密码登录
用户表在 MySQL
密码 hash 存储

Auth.js 官方文档已经覆盖 Next.js 集成方式，适合直接复用。

6.4 不手搓任务系统

原因：

原始文件解析天然是异步任务
如果手写数据库轮询 + 状态推进 + 重试，很容易失控
结论
用 BullMQ + Redis
都在本地运行
Worker 单独进程执行 Python 脚本

BullMQ 的 Queue / Worker 模式正适合这个场景。

7. 项目目录结构

建议采用单仓库结构：

eln-lims/
├─ app/
│  ├─ (dashboard)/
│  │  ├─ page.tsx
│  │  ├─ samples/
│  │  ├─ alloy-designs/
│  │  ├─ arc-melting/
│  │  ├─ spinning/
│  │  ├─ post-treatments/
│  │  ├─ performance-tests/
│  │  ├─ raw-files/
│  │  ├─ templates/
│  │  ├─ dictionaries/
│  │  └─ recycle-bin/
│  ├─ api/
│  │  ├─ auth/[...nextauth]/route.ts
│  │  ├─ samples/route.ts
│  │  ├─ alloy-designs/route.ts
│  │  ├─ arc-melting/route.ts
│  │  ├─ spinning/route.ts
│  │  ├─ post-treatments/route.ts
│  │  ├─ performance-tests/route.ts
│  │  ├─ raw-files/route.ts
│  │  ├─ uploads/route.ts
│  │  └─ jobs/route.ts
│  ├─ login/page.tsx
│  └─ layout.tsx
├─ components/
│  ├─ ui/                    # shadcn/ui 组件
│  ├─ layout/
│  ├─ forms/
│  ├─ tables/
│  ├─ charts/
│  └─ business/
├─ lib/
│  ├─ auth/
│  ├─ prisma/
│  ├─ redis/
│  ├─ queue/
│  ├─ storage/
│  ├─ validators/
│  ├─ permissions/
│  ├─ constants/
│  └─ utils/
├─ services/
│  ├─ sample.service.ts
│  ├─ alloy-design.service.ts
│  ├─ arc-melting.service.ts
│  ├─ spinning.service.ts
│  ├─ post-treatment.service.ts
│  ├─ performance-test.service.ts
│  ├─ raw-file.service.ts
│  └─ job.service.ts
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ worker/
│  ├─ index.ts
│  ├─ queues/
│  ├─ processors/
│  └─ python/
├─ scripts/
│  ├─ parse_raw_data.py
│  └─ ...
├─ uploads/
│  ├─ raw-data/
│  ├─ attachments/
│  └─ qrcode/
├─ public/
├─ package.json
├─ docker-compose.yml
├─ .env
└─ README.md
8. 核心技术模块设计
8.1 认证与权限
方案
使用 Auth.js
使用 Credentials Provider
用户数据放 MySQL
会话使用 Auth.js 默认机制
角色：实验人员 / 管理员 / 负责人
不做的事情
不接入微信、Google、GitHub 登录
不接入邮件登录
不接入短信验证码
不手写 JWT 登录系统
路由保护
Middleware 做基础登录校验
页面层做角色显示控制
服务端做最终权限校验
8.2 数据访问层
方案
使用 Prisma
所有数据库访问统一通过 Prisma Client
业务层不直接写裸 SQL，除非复杂统计确有必要
所有迁移使用 Prisma Migrate
本地查看数据使用 Prisma Studio

Prisma 文档支持 MySQL 连接器，并提供 migration 工具链。

规则
Controller/Route Handler 不直接写复杂业务
复杂业务写入 services/*
Prisma 访问收敛在 service 层或 repository 风格封装中
8.3 表单与校验
方案
页面表单全部用 react-hook-form
所有 schema 全部用 zod
前后端共用 schema
Route Handler 入参也走 Zod 校验
原则
不手写零散 if/else 校验
不把表单规则散落在 UI 组件里
自动计算字段与用户输入字段分开管理

shadcn/ui 官方文档也直接提供与 React Hook Form 配合的表单模式。

8.4 表格与筛选
方案
所有列表页统一用 TanStack Table
列定义集中管理
支持：
排序
分页
搜索
列显隐
行选择
批量操作
原则
不自己手搓表格状态系统
不为每个页面写一套新的表格逻辑
8.5 文件上传与本地存储
方案
前端上传：react-dropzone
后端接收：Next.js Route Handler
存储介质：本地目录
文件索引：MySQL 表
目录约定
/uploads/raw-data/
/uploads/attachments/
/uploads/qrcode/
数据库存储

文件表只保存：

原始文件名
存储路径
MIME 类型
文件大小
哈希值（可选）
关联样品 UUID
上传人
上传时间
解析状态
规则
不使用云对象存储
不使用 MinIO，除非后续规模扩大
不把二进制文件塞进数据库 BLOB
8.6 原始数据解析与后台任务
推荐方案
上传完成后创建解析任务
使用 BullMQ 把任务写入 Redis
worker 进程消费任务
worker 调用本地 Python 脚本
脚本读取文件，输出结构化结果
worker 将结果回写 MySQL
前端读取状态并刷新
任务状态
pending
processing
success
failed
重试策略
解析失败允许重试
重试次数可配置
保留错误摘要和 stderr
为什么必须这么做

因为“原始文件解析”天然不是同步页面动作。
如果直接在请求中做完整 Python 解析，容易出现：

超时
页面阻塞
错误难追踪
状态不可观察

BullMQ 的本地 Queue / Worker 方案更稳。

8.7 图表与统计看板
方案
首页和详情页图表统一用 ECharts
不自己封装 SVG 图表引擎
不手工写 canvas 图表逻辑
适用图表
柱状图：月度新增记录
折线图：测试结果趋势
饼图：状态分布
散点图：部分性能指标对比

Apache ECharts 官方文档强调其交互性和可定制性，足够支撑后台统计看板。

8.8 CSV 预览与导出
方案
前端 CSV 预览：Papa Parse
后端导出：Node.js 生成 CSV / Excel
Excel 生成推荐：exceljs
原则
不手写 CSV 解析器
不手工处理分隔符和转义边界情况

Papa Parse 已支持本地文件解析、流式处理、worker 线程等能力。

9. 数据库实施建议
9.1 数据库
本地部署 MySQL 8.x
字符集：utf8mb4
时区统一
所有表必须有：
id
uuid
created_at
updated_at
deleted_at（软删除）
created_by
updated_by
9.2 Prisma 约束
所有表结构由 schema.prisma 管理
所有变更必须通过 migration
不允许手工改正式表结构而不回写 migration
9.3 软删除

首版默认软删除，避免误删。

10. 服务边界
10.1 Web 服务职责
页面渲染
用户登录
CRUD 接口
文件上传
任务提交
详情页数据聚合
10.2 Worker 服务职责
消费队列
调用 Python 脚本
解析文件
写入解析结果
记录失败日志
10.3 MySQL 职责
存储业务主数据
存储文件索引
存储解析结果
存储审计日志
存储字典和模板
10.4 Redis 职责
仅用于队列系统
不作为业务主存储
不承担长期数据责任
11. 本地开发与部署方案
11.1 推荐运行方式

推荐使用 Docker Compose 本地编排：

web
worker
mysql
redis
原因
最接近真实交付环境
团队机器环境一致
易于 Codex 输出标准化启动说明
11.2 本地文件挂载

必须挂载本地目录：

./uploads:/app/uploads
11.3 Python 环境
本地容器内安装 Python 3
安装你已有脚本所需依赖
Worker 中通过 child_process.spawn 调用
12. 推荐依赖清单

下面这份可以直接作为 package.json 设计依据。

12.1 前端 / 全栈
next
react
react-dom
typescript
tailwindcss
class-variance-authority
clsx
tailwind-merge
lucide-react
sonner
12.2 UI
shadcn/ui 生成的本地组件
@radix-ui/*（由 shadcn/ui 依赖）
12.3 表单与校验
react-hook-form
zod
@hookform/resolvers
12.4 表格与请求
@tanstack/react-table
@tanstack/react-query
12.5 认证
next-auth / Auth.js
bcrypt 或 bcryptjs
12.6 数据
prisma
@prisma/client
12.7 队列
bullmq
ioredis
12.8 文件 / 导出 / 工具
react-dropzone
papaparse
qrcode
exceljs
dayjs
nanoid（仅用于非主业务 UUID 场景）
mime / mime-types
12.9 图表
echarts
echarts-for-react
13. 不采用的技术

首版明确不采用：

MongoDB
MinIO
S3
Supabase
Firebase
Clerk
Auth0
第三方邮件服务
云函数
SaaS 队列服务
手写 JWT 鉴权系统
手写 ORM
手写动态表单引擎
手写表格引擎
手写图表库
14. 给 Codex 的明确技术约束

下面这段建议你直接给 Codex。

请严格按以下技术方案实现，不要擅自替换为其他体系：

一、总体要求
1. 所有服务均本地运行，不使用任何云服务
2. 不重复造轮子，优先使用成熟开源框架和组件
3. 代码必须适合长期维护，不要生成一次性脚手架垃圾代码

二、前端与全栈
1. 使用 Next.js App Router + TypeScript
2. 使用 Tailwind CSS
3. 使用 shadcn/ui 作为基础 UI 组件体系
4. 使用 lucide-react 作为图标库
5. 使用 React Hook Form + Zod 处理所有表单和校验
6. 使用 TanStack Table 处理所有表格
7. 使用 TanStack Query 处理客户端数据请求与缓存
8. 使用 react-dropzone 实现上传拖拽交互
9. 使用 ECharts 实现看板图表
10. 使用 Papa Parse 实现 CSV 预览解析

三、后端
1. 不拆独立 Java/Spring/FastAPI 后端
2. 使用 Next.js Route Handlers 和 Server Actions
3. 使用 Prisma 作为唯一 ORM
4. 使用 MySQL 作为唯一业务数据库
5. 使用 Auth.js 处理登录与会话
6. 用户登录先实现本地账号密码模式
7. 所有接口入参都必须通过 Zod 校验

四、后台任务
1. 原始数据解析必须使用 BullMQ + Redis
2. Redis 本地部署，不允许使用云 Redis
3. 单独实现 worker 进程消费任务
4. worker 调用本地 Python 脚本完成数据解析
5. 解析状态必须可追踪：pending / processing / success / failed
6. 必须支持失败重试和错误日志记录

五、文件存储
1. 所有上传文件都存储到本地目录
2. 不使用 MinIO，不使用任何对象存储云服务
3. 文件元信息和业务绑定关系存储在 MySQL 中
4. 不允许把大文件内容直接存入数据库

六、禁止事项
1. 不要手写认证系统
2. 不要手写队列系统
3. 不要手写表格系统
4. 不要手写表单状态机
5. 不要手写 CSV 解析器
6. 不要混用多个大型 UI 框架
7. 不要引入与本方案无关的云服务依赖
15. 最终落地建议

这套技术方案的核心是：

Next.js 负责全栈主应用
Prisma + MySQL 负责业务数据
Auth.js 负责认证
BullMQ + Redis 负责异步解析
本地文件系统负责上传存储
Python 脚本复用现有算法
shadcn/ui + RHF + Zod + TanStack Table 负责后台 UI 基础能力
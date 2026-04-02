下面是基于你前面 PRD、UI 设计文档和约束整理出的 **技术文档**。
我会严格按你的要求来写：

* 尽可能使用成熟框架和开源组件
* 不让 Codex 造轮子
* 所有前后端和服务都本地部署
* 不额外扩展业务功能，只做技术落地方案

---

# 实验图片记录管理系统技术文档

## 1. 文档目标

本文档用于指导 Codex 按统一技术方案实现一个适用于小型实验室的 **实验图片记录管理系统**。
系统以 Web 方式提供，围绕实验样品、实验过程记录、图片归档、性能测试记录进行建设。

本文档重点解决以下问题：

1. 采用什么技术栈
2. 系统如何分层
3. 数据库如何设计
4. 文件和图片如何存储
5. 页面与接口如何组织
6. 本地部署如何落地
7. Codex 开发时应遵守哪些实现边界

---

# 2. 项目范围

## 2.1 当前阶段目标

当前阶段仅实现以下核心能力：

* 用户登录
* 成分设计管理
* 熔炼批次管理
* 拉丝批次管理
* 样品管理
* 后处理记录管理
* 性能测试记录管理
* 图片上传、预览、检索
* 数据字典管理
* 用户管理
* 样品全链路追溯查看

## 2.2 当前阶段不做

为了避免系统复杂化，当前阶段明确不做：

* 微服务拆分
* 云存储
* 云数据库
* 云函数
* 消息中间件集群
* 工作流引擎
* 自研动态表单平台
* 自研权限框架
* 自研图片编辑器
* 实时设备接入
* AI 图像分析
* 自动脚本调度平台

---

# 3. 总体技术架构

## 3.1 架构原则

本项目采用 **单体式本地部署架构**，优先保证：

* 简单
* 稳定
* 易维护
* 易生成
* 易被 Codex 正确实现

## 3.2 总体架构图

```text
┌──────────────────────────────────────────────────────────────┐
│                        浏览器 / Web 前端                     │
│                    Next.js + Ant Design                      │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Web 应用服务（单体）                      │
│                Next.js App Router + Route Handlers           │
│                                                              │
│  包含：                                                      │
│  - 页面渲染                                                   │
│  - API 接口                                                   │
│  - 登录鉴权                                                   │
│  - 表单校验                                                   │
│  - 文件上传                                                   │
│  - 图片访问                                                   │
│  - 业务逻辑                                                   │
└──────────────────────────────────────────────────────────────┘
                 │                              │
                 │                              │
                 ▼                              ▼
┌───────────────────────────┐     ┌────────────────────────────┐
│         MySQL             │     │ 本地文件存储 / NAS 挂载目录 │
│   结构化业务数据存储       │     │ 图片/附件原始文件存储       │
└───────────────────────────┘     └────────────────────────────┘
```

---

# 4. 技术选型

---

## 4.1 前端技术栈

### 核心框架

* **Next.js**
* **TypeScript**

### UI 组件库

* **Ant Design**

### 日期处理

* **dayjs**

### 表单和数据校验

* 页面层：**Ant Design Form**
* 服务端请求校验：**Zod**

### 原因

选择以上方案的原因：

1. Next.js 成熟，适合前后端一体项目
2. TypeScript 能统一前后端数据类型
3. Ant Design 后台组件成熟，Codex 易生成
4. Ant Design 自带 Form、Table、Upload、Image、Modal、Tabs、Tag 等，避免重复造轮子
5. Zod 可用于接口入参校验，减少后端隐式错误

---

## 4.2 后端技术栈

### 核心方案

* **Next.js Route Handlers**
* **Prisma ORM**

### 原因

1. 前后端统一在一个项目中，减少部署复杂度
2. Prisma 与 MySQL 配合成熟
3. Prisma 能自动管理数据模型、迁移和类型定义
4. 不需要单独再起一个 FastAPI/Django 服务，减少本地服务数量

---

## 4.3 数据库

### 选型

* **MySQL**

### 连接信息

```env
DATABASE_URL="mysql://eln:admin123456@192.168.10.22:3306/eln"
```

### 原因

* 你已明确指定使用 MySQL
* 业务数据高度结构化
* 适合样品、批次、记录、图片元数据等关系建模
* 与 Prisma 适配成熟

---

## 4.4 文件与图片存储

### 当前阶段方案

* **本地文件系统**
* 或 **本地局域网 NAS 挂载目录**

### 建议目录结构

```text
/storage
  /images
    /2026
      /04
        /sample
        /test
        /process
  /attachments
    /2026
      /04
        /csv
        /txt
```

### 存储策略

数据库不直接存二进制文件，只保存：

* 文件路径
* 缩略图路径
* 原始文件名
* 文件大小
* MIME 类型
* 关联对象 ID

### 原因

* 简单稳定
* 本地实验室可控
* 便于备份
* 不依赖云对象存储
* 不引入 MinIO 也能满足当前需求

---

## 4.5 鉴权与登录

### 建议方案

* **NextAuth.js**（本地 Credentials 登录模式）

### 原因

* 成熟
* 社区文档完善
* 不需要手写 Session 体系
* 可以基于数据库用户表做用户名密码登录

### 当前阶段登录方式

* 用户名 + 密码
* 本地账户体系
* 角色控制：管理员 / 实验员 / 只读用户

---

# 5. 本地部署架构

## 5.1 部署原则

所有服务都在本地或内网环境运行，不依赖任何云服务。

## 5.2 部署组成

本系统本地部署只包含三类资源：

1. Web 应用服务
2. MySQL 数据库
3. 文件存储目录

## 5.3 推荐部署方式

### 方式一：直接进程部署

适合小型实验室最简方案：

* Node.js 运行 Next.js
* MySQL 使用已有远程库
* 文件存储目录挂载到本地服务器

### 方式二：Docker Compose 本地部署

适合后续规范化部署：

* app 容器：Next.js
* db：如果后续需要本地自建 MySQL，可加入
* volume：挂载 `/storage`

当前按你的条件，数据库已经存在，因此可先不容器化数据库，只容器化 Web 服务。

---

# 6. 项目目录结构建议

建议 Codex 按以下方式组织项目，不要过度抽象。

```text
project-root/
├─ app/
│  ├─ (auth)/
│  │  └─ login/
│  ├─ dashboard/
│  ├─ alloys/
│  ├─ arc-batches/
│  ├─ spinning-batches/
│  ├─ samples/
│  ├─ post-treatments/
│  ├─ tests/
│  ├─ images/
│  ├─ dictionary/
│  ├─ users/
│  └─ api/
│     ├─ auth/
│     ├─ alloys/
│     ├─ arc-batches/
│     ├─ spinning-batches/
│     ├─ samples/
│     ├─ post-treatments/
│     ├─ tests/
│     ├─ images/
│     ├─ dictionary/
│     └─ users/
├─ components/
│  ├─ layout/
│  ├─ common/
│  ├─ forms/
│  ├─ tables/
│  └─ images/
├─ lib/
│  ├─ prisma.ts
│  ├─ auth.ts
│  ├─ db/
│  ├─ validators/
│  ├─ utils/
│  └─ constants/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ public/
├─ storage/           # 本地开发时可用，生产建议挂载外部目录
├─ styles/
├─ types/
├─ package.json
└─ .env
```

---

# 7. 分层设计

为了让 Codex 易实现，同时保持可维护性，建议采用轻量分层。

## 7.1 分层结构

### 表现层

* Next.js 页面
* Ant Design UI 组件
* 页面表单、列表、详情

### 接口层

* Route Handlers
* 接收请求、参数校验、权限校验、返回响应

### 业务层

* 业务规则处理
* 失败原因校验
* 自动计算逻辑
* 显示别名生成
* 文件元数据写入

### 数据访问层

* Prisma ORM
* 对 MySQL 进行 CRUD

---

## 7.2 不建议的做法

Codex 不要做以下过度设计：

* 不要做 Repository + Service + Domain + Factory 多层套娃
* 不要做 CQRS
* 不要引入 EventBus
* 不要做自定义 ORM 包装层
* 不要做过度的泛型 CRUD 框架

---

# 8. 数据模型设计

下面是技术层面的核心表设计。

---

## 8.1 users

用于用户登录和权限控制。

### 字段建议

* id
* uuid
* username
* password_hash
* real_name
* role
* status
* created_at
* updated_at

### role 枚举

* ADMIN
* OPERATOR
* VIEWER

---

## 8.2 alloy_designs

成分设计表。

### 字段建议

* id
* uuid
* code
* composition_json
* total_percent
* remark
* created_by
* created_at
* updated_at

### 说明

`composition_json` 保存元素及其原子百分比，例如：

```json
[
  { "element": "Co", "percent": 40 },
  { "element": "Fe", "percent": 30 },
  { "element": "Si", "percent": 10 },
  { "element": "B", "percent": 20 }
]
```

---

## 8.3 arc_melting_batches

熔炼批次表。

### 字段建议

* id
* uuid
* batch_no
* alloy_design_id
* melting_date
* target_weight
* ingot_weight
* melting_point
* loss_rate
* status
* failure_reason_id
* remark
* created_by
* created_at
* updated_at

---

## 8.4 spinning_batches

拉丝批次表。

### 字段建议

* id
* uuid
* batch_no
* alloy_design_id
* arc_batch_id
* spinning_date
* glass_tube_diameter
* feed_weight
* spinning_temperature
* winding_speed_rpm
* cooling_water_temp
* negative_pressure_kpa
* coated_wire_diameter_um
* bare_wire_diameter_um
* glass_etch_time
* glass_thickness_um
* need_magnetic_test
* status
* failure_reason_id
* remark
* created_by
* created_at
* updated_at

---

## 8.5 samples

样品表，是追溯核心表。

### 字段建议

* id
* uuid
* sample_no
* display_name
* alloy_design_id
* arc_batch_id
* spinning_batch_id
* state
* bare_wire_diameter_um
* coated_wire_diameter_um
* is_welded_2cm
* sample_index
* remark
* created_by
* created_at
* updated_at

### state 枚举

* GC
* GR

---

## 8.6 post_treatment_records

后处理记录表。

### 字段建议

* id
* uuid
* sample_id
* treatment_type
* treatment_params_json
* status
* failure_reason_id
* remark
* created_by
* treated_at
* created_at
* updated_at

### 说明

后处理参数不建议拆成很多稀疏列，当前阶段可使用：

* 固定公共字段
* 可变参数 JSON

例如：

```json
{
  "current_type": "DC",
  "current_density": 12.5,
  "current_ma": 20.1,
  "duration_min": 10,
  "duty_cycle": 50,
  "frequency_hz": 1000
}
```

这样能减少表结构频繁调整，但不是在做动态表单引擎，只是技术上的参数收纳。

---

## 8.7 test_records

性能测试记录表。

### 字段建议

* id
* uuid
* record_no
* sample_id
* test_date
* operator_id
* instrument_id
* test_condition
* key_results
* raw_file_attachment_id
* status
* failure_reason_id
* remark
* created_at
* updated_at

---

## 8.8 image_assets

图片资源表。

### 字段建议

* id
* uuid
* file_name
* original_name
* storage_path
* thumbnail_path
* file_size
* mime_type
* category
* stage
* related_type
* related_id
* sample_id
* test_record_id
* tags_json
* remark
* captured_at
* uploaded_by
* created_at
* updated_at

### related_type 建议值

* SAMPLE
* ARC_BATCH
* SPINNING_BATCH
* TEST_RECORD

### 说明

这样不需要为每种图片关联单独建很多表。

---

## 8.9 attachments

附件表，用于 CSV/TXT 等原始文件。

### 字段建议

* id
* uuid
* file_name
* original_name
* storage_path
* file_size
* mime_type
* related_type
* related_id
* uploaded_by
* created_at

---

## 8.10 dictionary_items

数据字典表。

### 字段建议

* id
* uuid
* dict_type
* dict_label
* dict_value
* sort_order
* status
* created_at
* updated_at

### dict_type 示例

* FAILURE_REASON
* USER_NAME
* INSTRUMENT
* IMAGE_CATEGORY
* SAMPLE_STATE
* POST_TREATMENT_TYPE
* TEST_TYPE

---

## 8.11 operation_logs

操作日志表。

### 字段建议

* id
* uuid
* module
* operation_type
* related_type
* related_id
* operator_id
* content
* created_at

---

# 9. Prisma 建模原则

## 9.1 原则

* 所有表使用 `id` 作为主键
* `uuid` 作为业务唯一标识
* 外键关系明确
* 创建时间、更新时间统一管理
* JSON 字段只用于参数类和标签类结构，不滥用

## 9.2 建议统一字段

每张核心业务表至少包含：

* id
* uuid
* created_at
* updated_at

## 9.3 索引建议

重点加索引字段：

### samples

* display_name
* sample_no
* alloy_design_id
* arc_batch_id
* spinning_batch_id

### image_assets

* sample_id
* category
* stage
* captured_at
* uploaded_by

### test_records

* sample_id
* test_date

### arc_melting_batches

* batch_no
* melting_date

### spinning_batches

* batch_no
* spinning_date

---

# 10. 页面与接口设计

---

## 10.1 页面路由

```text
/login
/dashboard
/alloys
/alloys/new
/arc-batches
/arc-batches/new
/spinning-batches
/spinning-batches/new
/samples
/samples/new
/samples/[id]
/post-treatments
/post-treatments/new
/tests
/tests/new
/images
/dictionary
/users
```

---

## 10.2 API 路由建议

```text
/api/auth/login
/api/auth/logout
/api/auth/session

/api/alloys
/api/alloys/[id]

/api/arc-batches
/api/arc-batches/[id]

/api/spinning-batches
/api/spinning-batches/[id]

/api/samples
/api/samples/[id]

/api/post-treatments
/api/post-treatments/[id]

/api/tests
/api/tests/[id]

/api/images
/api/images/upload
/api/images/[id]

/api/dictionary
/api/dictionary/[id]

/api/users
/api/users/[id]
```

---

## 10.3 API 风格要求

* 使用 REST 风格
* 列表查询支持 query 参数
* 新建使用 POST
* 编辑使用 PUT / PATCH
* 删除使用 DELETE
* 返回统一 JSON 结构

### 返回格式建议

```json
{
  "success": true,
  "message": "ok",
  "data": {}
}
```

错误时：

```json
{
  "success": false,
  "message": "参数错误",
  "errors": {
    "field": "xxx"
  }
}
```

---

# 11. 前端页面实现规范

## 11.1 页面统一结构

每个页面统一采用：

1. 页面标题区
2. 操作按钮区
3. 筛选区
4. 内容区
5. 分页区

## 11.2 列表页统一组件

使用：

* `Card`
* `Form`
* `Input`
* `Select`
* `DatePicker`
* `Button`
* `Table`
* `Pagination`

## 11.3 表单页统一组件

使用：

* `Form`
* `Input`
* `InputNumber`
* `Select`
* `Radio`
* `DatePicker`
* `Upload`
* `Card`
* `Button`

## 11.4 图片页统一组件

使用：

* `Upload`
* `Image`
* `Image.PreviewGroup`
* `Card`
* `Tag`

---

# 12. 文件上传设计

## 12.1 上传流程

1. 前端选择文件
2. 调用 `/api/images/upload` 或 `/api/attachments/upload`
3. 服务端校验文件类型和大小
4. 保存到本地目录
5. 将元数据写入数据库
6. 返回文件记录 ID 与访问地址

## 12.2 图片限制

建议限制：

* jpg
* jpeg
* png
* webp

## 12.3 附件限制

建议支持：

* csv
* txt

## 12.4 文件命名规则

为防止重名，建议统一命名：

```text
{uuid}_{timestamp}.{ext}
```

例如：

```text
3f9c2b1d_1712041200.jpg
```

## 12.5 缩略图策略

当前阶段建议：

* 上传原图后立即生成缩略图
* 使用成熟库处理，不自己实现图片算法

建议库：

* **sharp**

---

# 13. 业务规则实现要求

---

## 13.1 失败原因强制校验

以下模块在状态为失败时，必须填写失败原因：

* 熔炼批次
* 拉丝批次
* 后处理记录
* 性能测试记录

这个规则必须同时在：

* 前端表单层
* 后端接口层
  都校验一次。

---

## 13.2 成分比例校验

成分设计中元素原子分数总和必须等于 100。

校验方式：

* 前端实时汇总校验
* 后端再次校验，避免绕过前端提交

---

## 13.3 自动计算字段

以下字段由系统自动计算：

### 熔炼损耗率

```text
(target_weight - ingot_weight) / target_weight * 100%
```

### 玻璃层厚度

```text
(coated_wire_diameter_um - bare_wire_diameter_um) / 2
```

### 电流大小

```text
current_density * π * (bare_wire_diameter / 2)^2
```

### 拉伸力

```text
(weight * 9.8) / cross_section_area
```

这些字段应：

* 前端展示即时结果
* 后端最终重新计算后入库
* 不依赖前端直接传值作为真值

---

## 13.4 显示别名生成

显示别名由系统根据已选字段自动生成。
前端可预览，后端保存前再次生成。

---

# 14. 权限设计

## 14.1 角色

* ADMIN
* OPERATOR
* VIEWER

## 14.2 权限矩阵

### ADMIN

* 所有页面可见
* 所有数据可增删改查
* 可管理字典与用户

### OPERATOR

* 可查看全部业务数据
* 可新增、编辑实验记录和图片
* 不可管理用户

### VIEWER

* 仅查看和检索
* 不可新增、编辑、删除

## 14.3 前后端权限控制

权限控制不能只放前端，必须：

* 前端控制按钮可见性
* 后端接口控制实际操作权限

---

# 15. 日志与审计

## 15.1 操作日志范围

建议记录以下操作：

* 新建
* 编辑
* 删除
* 上传图片
* 上传附件
* 修改字典
* 修改用户

## 15.2 日志内容

包括：

* 操作人
* 模块
* 操作类型
* 关联对象
* 时间
* 变更摘要

---

# 16. 本地环境配置

## 16.1 基础依赖

* Node.js 20+
* npm 或 pnpm
* MySQL 客户端访问权限
* 本地可写文件目录

## 16.2 环境变量建议

```env
NODE_ENV=development

DATABASE_URL="mysql://eln:admin123456@192.168.10.22:3306/eln"

NEXTAUTH_SECRET="replace-with-local-secret"
NEXTAUTH_URL="http://localhost:3000"

UPLOAD_DIR="./storage"
MAX_FILE_SIZE=10485760
```

---

# 17. 推荐开源依赖清单

以下都是成熟组件，Codex 优先直接使用，不要自研。

## 17.1 Web 框架

* next
* react
* react-dom
* typescript

## 17.2 UI

* antd
* @ant-design/icons

## 17.3 数据与校验

* prisma
* @prisma/client
* zod

## 17.4 鉴权

* next-auth

## 17.5 日期

* dayjs

## 17.6 文件处理

* sharp
* form-data 相关生态按 Next.js 标准方式处理

## 17.7 密码处理

* bcryptjs

## 17.8 工具库

* uuid
* lodash-es

---

# 18. Codex 开发约束

这是最关键的一部分，直接限制 Codex 的实现边界。

## 18.1 必须遵守

* 使用 Next.js + TypeScript + Ant Design + Prisma + MySQL
* 使用成熟开源组件
* 使用本地文件存储
* 所有核心实体有 uuid
* 所有失败状态必须校验失败原因
* 所有自动计算字段后端重新计算
* 所有上传文件元数据必须入库

## 18.2 禁止事项

* 不要引入微服务
* 不要引入 Redis、Kafka、MQ、Celery
* 不要引入 MongoDB
* 不要实现动态表单引擎
* 不要实现自定义状态管理框架
* 不要造表格、上传、图片预览轮子
* 不要做复杂插件化架构
* 不要做过度抽象的 service/repository/domain 多层框架

## 18.3 代码风格要求

* 目录清晰
* 组件拆分适中
* 不做无意义封装
* 表单、表格、详情页复用通用组件
* API 层统一错误返回格式
* 数据库访问统一走 Prisma

---

# 19. 开发顺序建议

---

## 第一阶段

1. 项目初始化
2. Prisma schema 建立
3. 用户登录
4. 基础布局
5. 数据字典
6. 成分设计
7. 熔炼批次
8. 拉丝批次
9. 样品管理

## 第二阶段

10. 后处理记录
11. 性能测试记录
12. 图片上传与图片中心
13. 样品详情页追溯整合

## 第三阶段

14. 操作日志
15. 列表筛选优化
16. 文件下载与预览完善
17. 本地部署打包

---

# 20. MVP 交付标准

系统达到以下标准即可认为首版可用：

* 能登录
* 能管理成分、熔炼、拉丝、样品
* 能录入后处理与测试记录
* 能上传图片并关联样品/记录
* 能查看样品详情和图片
* 能按条件查询
* 能进行基础权限控制
* 能在本地部署运行

---

# 21. 最终推荐方案总结

本项目最终技术路线如下：

## 前端

* Next.js
* TypeScript
* Ant Design
* dayjs

## 后端

* Next.js Route Handlers
* Prisma
* Zod

## 数据库

* MySQL

## 文件存储

* 本地文件系统 

## 鉴权

* NextAuth.js（Credentials 模式）

## 图片处理

* sharp

## 部署

* 本地服务器
* 不使用云服务
* 单体应用部署

---

如果你愿意，我下一步可以直接接着给你输出两份最实用的开发材料之一：

1. **Prisma Schema 初稿**
2. **给 Codex 的开发任务拆解清单（按页面、接口、数据表拆分）**

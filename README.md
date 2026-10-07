# 承岳律师案件管理系统

```bash
cp .env.example .env
docker compose config --quiet
docker compose up -d --build
```

承岳律师案件管理系统（`cylawcase`）是面向律师事务所的案件、客户、文档、费用与审计日志一体化管理平台。

默认演示账号：

```text
admin@cylawcase.local / Password123!
```

## 功能列表

- 客户管理：新建客户、编辑信息、客户检索、查看客户历史案件。
- 案件管理：案件编号、类型、状态、受理/结案日期、客户、主办律师与协办律师全链路管理。
- 文档归档：按案件上传、查看、下载、删除文档，支持文件类型筛选和标题搜索。
- 费用中心：创建账单、状态流转、本月应收/已收/待收汇总。
- 用户与认证：JWT 登录，bcrypt 密码加密，用户/律师信息贯穿案件分配。
- RBAC 权限：数据库 roles/permissions/user_roles/role_permissions，后端 `Roles()` + `role.guard.ts`，前端 router 守卫 + `v-permission` 兼容层。
- 操作日志：数据库 `audit_logs`，后端 `audit-log.interceptor.ts`，前端审计日志页面。

## 访问地址

| 服务 | 地址 |
| --- | --- |
| 前端 | http://localhost:28031 |
| 后端健康检查 | http://localhost:29069/api/health |
| PostgreSQL | localhost:38102 |

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 18、TypeScript、Vite、Ant Design、Zustand、Axios |
| 后端 | Express、TypeScript、Prisma、JWT、bcrypt、zod、multer |
| 数据库 | PostgreSQL 16 |
| 部署 | Docker Compose、Nginx 多阶段构建 |

## 目录结构

```text
.
├── docker-compose.yml
├── .env
├── .env.example
├── database/
│   └── init.sql
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── common/enums/
│       ├── config/
│       ├── controllers/
│       ├── models/
│       ├── middlewares/
│       ├── routes/
│       ├── services/
│       └── utils/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── api/
        ├── components/common/
        ├── directives/
        ├── hooks/
        ├── pages/
        ├── router/
        ├── stores/
        ├── types/
        └── utils/
```

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `COMPOSE_PROJECT_NAME` | Compose 项目前缀 | `cylawcase` |
| `DB_NAME` | 数据库名 | `lawcase` |
| `DB_USER` | 数据库用户 | `lawcase` |
| `DB_PASSWORD` | 数据库密码 | `lawcase_pwd` |
| `DB_ROOT_PASSWORD` | 预留 root 密码配置 | `root_pwd` |
| `JWT_SECRET` | JWT 签名密钥，生产环境必须替换 | `change_me_to_a_long_random_string` |
| `FRONTEND_PORT` | 前端端口 | `28031` |
| `BACKEND_PORT` | 后端端口 | `29069` |
| `DB_PORT` | PostgreSQL 映射端口 | `38102` |

## Docker 部署说明

1. 执行 `cp .env.example .env`，按需修改数据库密码和 `JWT_SECRET`。
2. 执行 `docker compose config --quiet` 校验 Compose 语法。
3. 执行 `docker compose up -d --build` 启动服务。
4. 后端容器启动时会执行 `prisma db push` 和 `seed`，初始化 RBAC、演示用户、客户、案件、文档和账单。
5. 前端 Nginx 将 `/api/` 反向代理到 `http://backend:29069/`，并通过 `try_files` 支持 SPA 路由。

## 本地开发

后端：

```bash
cd backend
npm install
cp ../.env.example ../.env
export DATABASE_URL="postgresql://lawcase:lawcase_pwd@localhost:38102/lawcase"
npm run prisma:generate
npm run dev
```

前端：

```bash
cd frontend
npm install
npm run dev
```

本地开发时 Vite 会把 `/api` 和 `/uploads` 代理到 `http://localhost:29069`。

## 共享枚举出现位置

`CaseStatus`：

- 后端 Prisma：`backend/prisma/schema.prisma`
- 后端枚举：`backend/src/common/enums/case-status.enum.ts`
- 后端 DTO/控制器：`backend/src/controllers/case.controller.ts`
- 后端业务服务：`backend/src/services/case.service.ts`
- 前端枚举类型：`frontend/src/types/enums.ts`
- 前端状态展示：`frontend/src/components/common/StatusBadge.tsx`
- 前端案件列表：`frontend/src/pages/CasesPage.tsx`
- 前端案件详情：`frontend/src/pages/CaseDetailPage.tsx`

`BillingType`：

- 后端 Prisma：`backend/prisma/schema.prisma`
- 后端枚举：`backend/src/common/enums/billing-type.enum.ts`
- 后端 DTO/控制器：`backend/src/controllers/billing.controller.ts`
- 后端业务服务：`backend/src/services/billing.service.ts`
- 前端枚举类型：`frontend/src/types/enums.ts`
- 前端账单卡片：`frontend/src/components/common/BillingCard.tsx`
- 前端费用中心：`frontend/src/pages/BillingPage.tsx`

## License

MIT

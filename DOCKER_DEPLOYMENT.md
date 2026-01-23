# Docker 部署指南

## 开发环境（当前配置）

当前的 docker-compose.yml 配置为**开发环境**，支持热重载。

### 特性
- ✅ 源代码通过卷挂载，修改代码后自动重启
- ✅ 无需重新构建镜像
- ✅ 支持实时调试
- ✅ 使用 `pnpm run start:dev` 启动

### 快速开始

#### 1. 配置邮件服务

在 `docker-compose.yml` 中修改邮件授权码：

```yaml
nodemailer_auth_pass: your_email_auth_code  # 替换为你的 QQ 邮箱授权码
```

#### 2. 启动所有服务

```bash
# 首次启动（会构建镜像）
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 查看所有服务状态
docker-compose ps
```

#### 3. 开发流程

```bash
# 修改 src 目录下的代码，保存后会自动重启
# 无需任何额外操作！

# 如果修改了 package.json（添加了新依赖）
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d

# 如果只是修改了环境变量
docker-compose restart backend
```

## 常用命令

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（会清空数据库数据）
docker-compose down -v

# 重启某个服务
docker-compose restart backend

# 查看某个服务的日志
docker-compose logs -f mysql

# 进入容器
docker-compose exec backend sh
docker-compose exec mysql bash

# 重新构建镜像
docker-compose build --no-cache backend
```

## 服务说明

### MySQL
- 端口: 3306
- 数据库: meeting_room_booking_system
- 用户名: meeting_user
- 密码: meeting_password
- Root 密码: root_password
- 数据持久化: mysql_data 卷

### Redis
- 端口: 6379
- 数据库: 0
- 数据持久化: redis_data 卷

### Backend（开发环境）
- 端口: 3000
- 模式: 开发模式（热重载）
- 源代码: 通过卷挂载，修改实时生效
- 依赖: MySQL 和 Redis 必须健康运行后才会启动

## 访问应用

- 后端 API: http://localhost:3000
- API 文档: http://localhost:3000/api-doc
- MySQL: localhost:3306
- Redis: localhost:6379

---

## 生产环境部署

如果需要部署到生产环境，请使用 `Dockerfile`（而非 `Dockerfile.dev`）：

### 1. 修改 docker-compose.yml

```yaml
backend:
  build:
    context: .
    dockerfile: Dockerfile  # 改为使用生产环境 Dockerfile
  environment:
    NODE_ENV: production
    jwt_secret: your_strong_jwt_secret_here  # 使用强密码
    # ... 其他配置
  restart: always  # 改为 always
  # 移除 volumes 配置（不挂载源代码）
```

### 2. 生产环境注意事项

1. **修改默认密码**: 修改 MySQL root 密码、用户密码和 JWT 密钥
2. **配置 CORS**: 将 `cors_origin` 改为你的前端域名
3. **使用环境变量文件**: 创建 `.env` 文件存储敏感信息
4. **配置邮件服务**: 使用真实的邮件服务器配置
5. **数据备份**: 定期备份 MySQL 和 Redis 数据卷
6. **日志管理**: 配置日志收集和监控
7. **关闭 TypeORM synchronize**: 在生产环境应该使用 migration

## 故障排查

### 后端无法连接数据库
```bash
# 检查 MySQL 是否健康
docker-compose ps mysql

# 查看 MySQL 日志
docker-compose logs mysql
```

### 后端无法连接 Redis
```bash
# 检查 Redis 是否健康
docker-compose ps redis

# 测试 Redis 连接
docker-compose exec redis redis-cli ping
```

### 查看后端错误日志
```bash
docker-compose logs -f backend
```

# 本地开发指南

## 开发环境架构

- **MySQL & Redis**: 运行在 Docker 容器中
- **NestJS 后端**: 运行在本地（支持完整的 IDE 功能）

## 快速开始

### 1. 启动 Docker 服务（MySQL 和 Redis）

```bash
# 方式一：使用 npm 脚本（推荐）
pnpm run dev:services

# 方式二：直接使用 docker-compose
docker-compose -f docker-compose.services.yml up -d
```

脚本会自动：
- ✅ 检查 Docker 是否安装和运行
- ✅ 检查镜像是否存在，不存在则自动下载
- ✅ 启动 MySQL 和 Redis 容器
- ✅ 等待服务健康检查通过

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

编辑 `src/.env` 文件，修改邮箱授权码：

```env
nodemailer_auth_pass=your_email_auth_code  # 替换为你的 QQ 邮箱授权码
```

### 4. 启动开发服务器

```bash
pnpm run start:dev
```

### 5. 访问应用

- API: http://localhost:3000
- API 文档: http://localhost:3000/api-doc

## 完整开发流程

```bash
# 第一次启动
pnpm run dev:services    # 启动 Docker 服务
pnpm install             # 安装依赖
pnpm run start:dev       # 启动开发服务器

# 日常开发
# 1. 确保 Docker 服务运行中
# 2. 直接运行 pnpm run start:dev
# 3. 修改代码，自动热重载
```

## 常用命令

### Docker 服务管理

```bash
# 查看服务状态
docker-compose -f docker-compose.services.yml ps

# 查看日志
docker-compose -f docker-compose.services.yml logs -f

# 停止服务
docker-compose -f docker-compose.services.yml down

# 停止并删除数据（慎用！会清空数据库）
docker-compose -f docker-compose.services.yml down -v

# 重启服务
docker-compose -f docker-compose.services.yml restart
```

### 数据库连接

```bash
# 连接到 MySQL
docker exec -it meeting_room_mysql mysql -u meeting_user -p
# 密码: meeting_password

# 连接到 Redis
docker exec -it meeting_room_redis redis-cli
```

## 服务信息

### MySQL
- 地址: localhost:3306
- 数据库: meeting_room_booking_system
- 用户名: meeting_user
- 密码: meeting_password
- Root 密码: root_password

### Redis
- 地址: localhost:6379
- 数据库: 0

## 故障排查

### Docker 服务未启动

```bash
# 检查 Docker Desktop 是否运行
docker ps

# 如果未运行，启动 Docker Desktop
```

### 端口被占用

```bash
# 检查端口占用（Windows）
netstat -ano | findstr :3306
netstat -ano | findstr :6379

# 停止占用端口的进程或修改 docker-compose.services.yml 中的端口映射
```

### 数据库连接失败

```bash
# 检查容器是否健康
docker ps

# 查看 MySQL 日志
docker logs meeting_room_mysql

# 重启 MySQL 容器
docker restart meeting_room_mysql
```

## 优势

✅ **完整的 IDE 支持** - 本地有 node_modules，类型提示和代码补全正常
✅ **快速热重载** - 代码修改立即生效
✅ **环境一致性** - 数据库和缓存版本固定
✅ **灵活调试** - 可以使用 VSCode 调试器
✅ **资源占用低** - 只运行必要的 Docker 容器

## 生产环境部署

生产环境部署请参考 `DOCKER_DEPLOYMENT.md` 文档。

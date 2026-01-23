# Build stage
FROM node:20-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 1. 拷贝 package.json 和 pnpm-lock.yaml
# 注意：这里必须包含 pnpm-lock.yaml，否则 frozen-lockfile 会报错
COPY package.json pnpm-lock.yaml ./

# 2. 安装全部依赖（包含开发依赖以供 build 使用）
# --frozen-lockfile 相当于 npm ci，确保锁定版本
RUN pnpm install --frozen-lockfile

# 拷贝源代码
COPY . .

# 编译
RUN pnpm run build

# Production stage
FROM node:20-alpine

# 生产环境同样需要安装 pnpm
RUN npm install -g pnpm

WORKDIR /app

# 3. 只拷贝运行必需的文件
COPY package.json pnpm-lock.yaml ./

# 4. 只安装生产环境依赖，并清理缓存
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# 从 builder 阶段拷贝编译后的 dist
COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main"]
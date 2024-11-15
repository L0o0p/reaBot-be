# 使用多平台 Node.js 官方镜像作为基础镜像
FROM --platform=linux/arm64 node:22 AS builder

# 设置工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 yarn.lock 文件（或者 package-lock.json）
COPY package.json ./

# 安装项目依赖
RUN yarn install --frozen-lockfile

# 复制项目文件到工作目录
COPY . .

# 构建项目
RUN yarn build

# 生产环境
FROM --platform=linux/amd64 node:22

WORKDIR /usr/src/app

# 复制构建产物和 package.json 到新的镜像
COPY --from=builder /usr/src/app/dist ./dist
COPY package.json ./

# 只安装运行时所需的依赖
RUN yarn install --production

# 暴露端口
EXPOSE 3000

# 设置环境变量（确保你的应用使用环境变量连接到数据库）
ENV NODE_ENV=production

# 启动应用
CMD ["node", "dist/main"]
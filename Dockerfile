# 1. 依存関係のインストールステージ
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# 2. ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 3. 実行ステージ
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# ビルド成果物と node_modules をすべてコピー
COPY --from=builder /app ./

EXPOSE 3000

# Next.js を通常起動
CMD ["npm", "run", "start"]

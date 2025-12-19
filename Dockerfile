# 1. 依存関係のインストールステージ
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# プロジェクトファイルをコピーして依存関係をインストール
COPY package.json package-lock.json ./
RUN npm ci

# 2. ビルドステージ
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数をビルド時に注入（必要に応じて）
# ENV NEXT_PUBLIC_SUPABASE_URL=...
# ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=...

RUN npm run build

# 3. 実行ステージ
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Render等のホスティング環境では実行時にポートが動的に割り当てられることがありますが、
# デフォルトとして3000を設定します。
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 実行に必要な最小限のファイルをビルドステージからコピー
COPY --from=builder /app/public ./public

# standaloneモードで生成されたファイルをコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# サーバーの起動
CMD ["node", "server.js"]
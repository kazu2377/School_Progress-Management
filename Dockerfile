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

# セキュリティ：非rootユーザーを作成
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 実行に必要な最小限のファイルをビルドステージからコピー（所有権も設定）
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# standaloneモードで生成されたファイルをコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 非rootユーザーに切り替え
USER nextjs

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000

# メタデータ
LABEL org.opencontainers.image.title="School Progress Management"
LABEL org.opencontainers.image.description="職業訓練校進捗管理システム"

# サーバーの起動
CMD ["node", "server.js"]
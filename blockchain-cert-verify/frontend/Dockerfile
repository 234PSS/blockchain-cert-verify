FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_RPC_URL=http://127.0.0.1:7545
ENV NEXT_PUBLIC_CONTRACT_ADDRESS=0xAaDFCf881B0f342B7DF079ee62C52a5238eDBDe1
ENV NEXT_PUBLIC_CHAIN_ID=1337
ENV NEXT_PUBLIC_API_URL=http://backend:3000/api

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production

CMD ["node", "server.js"]

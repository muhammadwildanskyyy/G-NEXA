# --- STAGE 1: BASE (Pondasi) ---
FROM oven/bun:1-alpine AS base
WORKDIR /app

# --- STAGE 2: DEVELOPMENT ---
FROM base AS development
COPY package.json bun.lockb* ./
# Install semua dependencies (termasuk devDependencies)
RUN bun install
COPY . .
# Generate Prisma Client agar codingan laptop terbaca
RUN bunx prisma generate
# HAPUS 'prisma db push' dari sini. Lakukan di docker-compose command.
CMD ["bun", "run", "dev"]

# --- STAGE 3: BUILDER (Siapkan Dependencies Prod) ---
FROM base AS builder
COPY package.json bun.lockb* ./
COPY prisma ./prisma
# 1. Install SEMUA deps dulu untuk bisa menjalankan 'prisma generate'
RUN bun install --frozen-lockfile
# 2. Generate Prisma Client (Wajib ada sebelum masuk production)
RUN bunx prisma generate
# 3. Hapus folder node_modules dan install ulang HANYA production deps
# (Agar image akhir kecil & bersih)
RUN rm -rf node_modules && bun install --production --frozen-lockfile

# --- STAGE 4: PRODUCTION (Siap Live Server) ---
FROM oven/bun:1-alpine AS production
WORKDIR /app

# Copy node_modules (yang sudah bersih) dan Prisma Client dari stage builder
COPY --from=builder /app/node_modules ./node_modules
# Copy source code aplikasi
COPY . .

# Set user ke non-root demi keamanan
USER bun

# Command start
CMD ["bun", "src/server.ts"]
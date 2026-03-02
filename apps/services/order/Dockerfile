# ==========================================
# STAGE 1: BASE
# ==========================================
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

# ==========================================
# STAGE 2: DEVELOPMENT
# ==========================================
FROM base AS development
# Install semua dependencies
RUN npm install -g @nestjs/cli
RUN npm install
# Generate Prisma agar type-safe
RUN npx prisma generate
# Copy semua source code
COPY . .
# Command untuk Hot-Reload NestJS
CMD ["npm", "run", "start:dev"]

# ==========================================
# STAGE 3: BUILDER
# ==========================================
FROM development AS builder
RUN npm run build

# ==========================================
# STAGE 4: PRODUCTION
# ==========================================
FROM base AS production
# Install HANYA dependencies production
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy hasil build JS dari stage builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
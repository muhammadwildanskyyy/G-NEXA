# --- STAGE 1: BASE (Pondasi) ---
FROM golang:1.25-alpine AS base
WORKDIR /app
# Install git untuk download modul
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download

# --- STAGE 2: DEVELOPMENT (Untuk Laptop/Coding) ---
FROM base AS development
RUN go install github.com/air-verse/air@v1.61.0
COPY . .
CMD ["air"]

# --- STAGE 3: BUILDER (Compile Binary) ---
FROM base AS builder
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /product-app .

# --- STAGE 4: PRODUCTION (Siap Live Server) ---
FROM alpine:latest AS production
WORKDIR /root/

# [TAMBAHAN WAJIB] Install sertifikat SSL & Timezone
RUN apk --no-cache add ca-certificates tzdata

# Copy binary dari stage builder
COPY --from=builder /product-app .
COPY --from=development /app/files ./files

# Jalankan binary
CMD ["./product-app"]
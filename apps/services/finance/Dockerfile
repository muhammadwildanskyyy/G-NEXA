# --- STAGE 1: BASE (Pondasi) ---
FROM golang:1.25-alpine AS base
WORKDIR /app
# Install git untuk download modul
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download

# --- STAGE 2: DEVELOPMENT (Untuk Laptop/Coding) ---
FROM base AS development
# Install Air untuk fitur Hot-Reloading
RUN go install github.com/air-verse/air@v1.61.0
COPY . .
# Jalankan Air
CMD ["air"]

# --- STAGE 3: BUILDER (Compile Binary) ---
FROM base AS builder
COPY . .
# CGO_ENABLED=0 wajib agar binary bisa jalan di Alpine murni
RUN CGO_ENABLED=0 GOOS=linux go build -o /finance-app ./main.go

# --- STAGE 4: PRODUCTION (Siap Live Server) ---
FROM alpine:latest AS production
WORKDIR /root/

# [TAMBAHAN WAJIB] Install sertifikat SSL & Timezone
RUN apk --no-cache add ca-certificates tzdata

# Copy config folder so Viper can read the .env file
COPY --from=builder /app/files/config ./files/config

# Copy binary dari stage builder
COPY --from=builder /finance-app .


# Jalankan binary
CMD ["./finance-app"]
<div align="center">
  <h1>🚀 G-NEXA</h1>
  <p><b>Enterprise-Scale B2B E-Commerce Microservices Architecture</b></p>
</div>

---

## 📖 Project Overview

**G-NEXA** is an *Engineering Portfolio* project that implements an *enterprise-scale Microservices* architecture for a Business-to-Business (B2B) e-commerce platform. This project is specifically designed as an experimental playground and deep-learning space for distributed system engineering, inter-service communication, and cross-domain execution using *Message Brokers*.

By adopting a **Polyglot Architecture** and **Domain-Driven Design (DDD)**, G-NEXA breaks down a traditional monolithic system into independent, loosely coupled service entities, where each service operates like a specialized industrial machine complementing the others.

## ✨ Key Features & Characteristics

- **Polyglot Microservices**: Utilizing the best tools for specific jobs (Golang for high performance & concurrency, NestJS for complex e-commerce business logic, Express.js for agility).
- **Hybrid Communication**: Blending *Synchronous* communication (via **gRPC**) for low-latency internal service requests, and *Asynchronous* communication (via **Apache Kafka**) for reliable cross-domain transactions.
- **Saga Pattern & Distributed Transactions**: Handling highly complex cross-service transaction logic (e.g., multi-store checkout processes) with compensation mechanisms and race condition prevention through database isolation levels (*Pessimistic Locking*).
- **Database per Service**: Preventing the database coupling typical in monolithic architectures by utilizing *Polyglot Persistence* (PostgreSQL & MongoDB) and absolute storage isolation.
- **API Gateway (The Edge)**: Centralized security, SSL termination, and intelligent routing using the **Kong API Gateway**.

---

## 🛠️ Tech Stack

G-NEXA divides computational responsibilities precisely using various modern technologies:

### Backend Services
- **User Service**: Express.js
- **Product Service**: Golang & Gin Gonic
- **Order Service**: NestJS
- **Finance Service**: Golang & Gin Gonic
- **Media Service**: Golang & Go Fiber

### Frontend & Presentation
- **Storefront (B2B Client)**: React.js & Next.js
- **Dashboard Seller/Admin**: Vue.js & Nuxt.js

### Infrastructure, Database & Messaging
- **API Gateway**: Kong
- **Message Broker**: Apache Kafka (Event-Driven Backbone)
- **Sync Communication**: gRPC (Protocol Buffers)
- **Relational Database**: PostgreSQL (User, Order, Finance, Media)
- **NoSQL Database**: MongoDB (Product Service)
- **Caching**: Redis
- **Containerization**: Docker & Docker Compose

---

## ⚙️ System Prerequisites

Because this system is fully configured and runs inside containers, local environment installation is extremely efficient. You only need:

1. **Docker & Docker Compose**: To build and run all service containers, databases, Kong, and Apache Kafka.
2. **Task (Taskfile)**: Used as a modern alternative to Makefile to simplify executing complex scripts into neat commands. [Task Installation Guide](https://taskfile.dev/installation/).

---

## 🚀 Installation & Running the Application

### 1. Clone the Repository
```bash
git clone https://github.com/muhammadwildanskyyy/G-NEXA.git
cd G-NEXA
```

### 2. Global Environment Setup
Copy the `.env.example` file (or create one if it doesn't exist) into `.env` in the *root* directory. This project comes with built-in local credential configurations for the global databases.

```bash
cp .env.example .env
```

**Example of root `.env`:**
```ini
# Postgres config
POSTGRES_USER=posgres_admin
POSTGRES_PASSWORD=g-nexa-posgres-auth

# Mongo config
MONGO_INITDB_ROOT_USERNAME=mongo_admin
MONGO_INITDB_ROOT_PASSWORD=g-nexa-mongo-auth
```

---

## 🔑 Service-Specific Environment Variables

In a microservice architecture, each service operates independently and requires its own `.env` configuration file to define its database connections, ports, brokers, and third-party API keys. 

You must create an `.env` file inside each respective service directory (e.g., `apps/services/users/.env`). Below are examples of what each service needs:

### 1. User Service (`apps/services/users/.env`)
```ini
NODE_ENV=development
PORT=8081
GRPC_PORT=50052
DATABASE_URL=postgres://posgres_admin:g-nexa-posgres-auth@postgres:5432/user_db
SECRET=your_jwt_secret_key
KAFKA_BROKER=kafka:29092
REDIS_HOST=redis
REDIS_PORT=6379

# SMTP Configuration
EMAIL_SMTP_HOST=smtp.zoho.com
EMAIL_SMTP_USER=your_email@zohomail.com
EMAIL_SMTP_PASS=your_app_password
EMAIL_SMTP_PORT=465
```

### 2. Product Service (`apps/services/product/.env`)
```ini
PORT=8082
GRPC_PORT=50053
MONGO_URI=mongodb://mongo_admin:g-nexa-mongo-auth@mongo:27017/product_db?authSource=admin
KAFKA_BROKER=kafka:29092
REDIS_HOST=redis
REDIS_PORT=6379
```

### 3. Order Service (`apps/services/order/.env`)
```ini
PORT=8083
GRPC_PORT=50054
DATABASE_URL=postgres://posgres_admin:g-nexa-posgres-auth@postgres:5432/order_db
KAFKA_BROKER=kafka:29092
REDIS_HOST=redis
REDIS_PORT=6379
```

### 4. Finance Service (`apps/services/finance/.env`)
```ini
PORT=8084
GRPC_PORT=50055
DATABASE_URL=postgres://posgres_admin:g-nexa-posgres-auth@postgres:5432/finance_db
KAFKA_BROKER=kafka:29092
XENDIT_API_KEY=xnd_development_your_key_here
REDIS_HOST=redis
REDIS_PORT=6379
```

### 5. Media Service (`apps/services/media/.env`)
```ini
PORT=8085
GRPC_PORT=50056
DATABASE_URL=postgres://posgres_admin:g-nexa-posgres-auth@postgres:5432/media_db
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

---

### 3. Running the Entire System (via Docker)

G-NEXA is automated through the **Taskfile** utility. The entire orchestration—from database integration, Kafka broker, Kong API Gateway, to the microservice applications—becomes active with a single command.

**Run in Development Mode (Hot Reloading)**:
```bash
task dev:up
```

**Run in Production Mode (Optimized Build / Production Docker Compose)**:
```bash
task prod:up
```

### 4. Container Management Commands (Task Utilities)

Some useful `task` commands during development:

| Command | Description |
| :--- | :--- |
| `task dev:down` | Shuts down all *services* in the *development* environment |
| `task prod:down`| Shuts down all *services* in the *production* environment |
| `task logs:services` | Displays specific logs from application services (hides DB/Kafka logs) |
| `task db:up` | Only starts the *Database* services (PostgreSQL & MongoDB) |
| `task db:reset` | **DANGER:** Performs a *purge* / deletion & *reset* of all *database* data |
| `task shell s=<service_name>` | Enters the *container shell* interactively. Example: `task shell s=g-nexa-user-service` |

---

## 📚 Further Documentation Exploration

To technically dissect the architectural decisions, solutions for *race conditions*, the implementation of *Idempotency*, and *Saga Pattern Orchestration*, full documentation is available on our **Interactive Documentation Portal**:

👉 **[Docs Portal](https://g-nexa-project-showcase.vercel.app/)**

---
<div align="center">
  <i>"Using the right tool for the right job."</i>
</div>

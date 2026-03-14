---
id: high-level-architecture
title: High-Level Architecture
sidebar_label: Topologi & Arsitektur
description: Visualisasi aliran data, batasan domain, dan topologi jaringan dari ekosistem microservices GNEXA.
---

# High-Level Architecture (Topologi)

Sebuah sistem terdistribusi berskala besar harus memiliki batasan (*boundaries*) yang jelas antara titik masuk pengguna, lapisan komputasi, tulang punggung antrean pesan, dan ruang penyimpanan. 

Halaman ini memvisualisasikan bagaimana aliran data (*data flow*) bergerak dari *client* hingga ke *database* paling dalam, serta bagaimana setiap layanan G-NEXA saling berinteraksi secara sinkronus maupun asinkronus.

---

## Visualisasi Topologi Sistem

Berikut adalah diagram *High-Level Architecture* dari G-NEXA. Diagram ini membagi sistem ke dalam 5 lapisan utama: *Presentation, Edge/Gateway, Compute (Microservices), Event-Backbone,* dan *Persistence*.

```mermaid
flowchart TD
    %% Definisi Warna (Styling)
    classDef client fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef gateway fill:#ff9900,stroke:#333,stroke-width:2px,color:#fff;
    classDef service fill:#4285F4,stroke:#333,stroke-width:2px,color:#fff;
    classDef broker fill:#0F9D58,stroke:#333,stroke-width:2px,color:#fff;
    classDef db fill:#DB4437,stroke:#333,stroke-width:2px,color:#fff;
    classDef external fill:#673AB7,stroke:#333,stroke-width:2px,color:#fff;
    classDef domain fill:none,stroke:#ccc,stroke-width:2px,stroke-dasharray: 5 5;

    %% --- 1. PRESENTATION LAYER ---
    WEB[Storefront<br/>Next.js]:::client
    DASH[Dashboard<br/>Nuxt.js]:::client

    %% --- 2. EDGE LAYER ---
    KONG[Kong API Gateway]:::gateway

    WEB -->|REST| KONG
    DASH -->|REST| KONG

    %% --- 3. MICROSERVICES & PERSISTENCE (DOMAIN DRIVEN) ---
    
    subgraph D1 ["User Domain"]
        direction TB
        US[User Service<br/>Express.js]:::service
        DB_US[(PostgreSQL<br/>User)]:::db
        US --- DB_US
    end
    
    subgraph D2 ["Product Domain"]
        direction TB
        PS[Product Service<br/>Node.js]:::service
        DB_PS[(Mongo & Redis<br/>Product)]:::db
        PS --- DB_PS
    end

    subgraph D3 ["Order Domain"]
        direction TB
        OS[Order Service<br/>NestJS]:::service
        DB_OS[(PostgreSQL<br/>Order)]:::db
        OS --- DB_OS
    end

    subgraph D4 ["Finance Domain"]
        direction TB
        FS[Finance Service<br/>Golang]:::service
        DB_FS[(PostgreSQL<br/>Ledger)]:::db
        FS --- DB_FS
    end
    
    subgraph D5 ["Media Domain"]
        direction TB
        MS[Media Service<br/>Node.js]:::service
        DB_MS[(PostgreSQL<br/>Media)]:::db
        MS --- DB_MS
    end

    %% Terapkan style garis putus-putus untuk kotak domain
    class D1,D2,D3,D4,D5 domain;

    %% Routing dari Gateway ke masing-masing Service
    KONG -->|Route| US
    KONG -->|Route| PS
    KONG -->|Route| OS
    KONG -->|Route| FS
    KONG -->|Route| MS

    %% Force Vertical Stacking (Garis jangkar tak kasat mata)
    DB_US ~~~ PS
    DB_PS ~~~ OS
    DB_OS ~~~ FS
    DB_FS ~~~ MS

    %% --- 4. EVENT & SYNC BACKBONE ---
    GRPC([gRPC<br/>Service Mesh]):::broker
    KAFKA([Apache Kafka<br/>Event Bus]):::broker

    %% Force Vertical untuk Backbone
    DB_MS ~~~ GRPC
    GRPC ~~~ KAFKA

    %% Koneksi ke Backbone
    US & PS & OS & FS <.->|gRPC| GRPC
    US & PS & OS & FS -.->|Pub/Sub| KAFKA

    %% --- 5. EXTERNAL PROVIDERS ---
    XENDIT[Xendit Payment]:::external
    CLOUD[Cloudinary Storage]:::external

    %% Force Vertical untuk Eksternal
    KAFKA ~~~ XENDIT
    XENDIT ~~~ CLOUD

    %% Koneksi Eksternal
    FS <-->|Webhook| XENDIT
    MS <-->|Upload API| CLOUD
```
## Anatomi Aliran Data

Untuk memahami topologi di atas, kita perlu membedah peran spesifik dari setiap lapisan saat menangani lalu lintas transaksi yang padat:

### 1. The Edge: Kong API Gateway
Kong bertindak sebagai satpam dan resepsionis tunggal. Tidak ada satupun perangkat dari luar (*browser*, aplikasi *mobile*, atau entitas tidak dikenal) yang bisa menyentuh *microservices* G-NEXA secara langsung. Kong menangani:
* **SSL Termination & Routing:** Mengarahkan rute eksternal seperti `/api/orders` ke *Order Service* dan `/api/products` ke *Product Service* di jaringan internal.
* **Rate Limiting:** Melindungi layanan dari serangan DDoS dan *spam request*.
* **Authentication Check:** Memverifikasi integritas JWT (JSON Web Token) di garis depan sebelum meneruskan *request* ke layanan komputasi.

### 2. Komunikasi Internal (The Network)
Saat *request* sudah masuk ke dalam *Compute Layer*, layanan memiliki dua jalur komunikasi utama:
* **Synchronous (gRPC):** Digunakan murni untuk kebutuhan validasi data instan antar-layanan (*read-heavy inter-service communication*). Contohnya, saat *Product Service* perlu memastikan keabsahan ID Toko ke *User Service* sebelum mengizinkan penambahan katalog baru, gRPC memfasilitasi ini dengan latensi nyaris nol.
* **Asynchronous (Kafka):** Digunakan untuk mengeksekusi alur bisnis utama (*write/mutation operations*) yang melintasi berbagai domain. Contohnya, proses *checkout* multi-toko tidak dilakukan dengan serangkaian panggilan HTTP yang rentan gagal (*cascading failure*). Alih-alih, *Order Service* mempublikasikan *event* ke Kafka, lalu *Finance Service* dan layanan lainnya akan mengonsumsi *event* tersebut secara mandiri untuk memotong saldo atau memanipulasi stok inventaris.

### 3. Isolasi Data (Database per Service)
Prinsip utama dalam arsitektur ini adalah melarang keras penggunaan basis data bersama (*shared database*).
* Tidak ada *Foreign Key* fisik di tingkat *database* yang menghubungkan tabel `Orders` dengan `Users`. Relasi tersebut dikelola di tingkat aplikasi.
* *Finance Service* mengelola buku besar transaksinya (*ledger*) di dalam PostgreSQL yang terisolasi ketat, sementara *Product Service* menyimpan puluhan ribu struktur metadata dinamisnya secara fleksibel di MongoDB.
* Isolasi absolut ini menjamin *fault isolation*: Jika *database Product Service* mengalami lonjakan beban beban pencarian dan melambat, performa mutasi *Finance Service* dan orkestrasi *Order Service* tidak akan terpengaruh sama sekali.

---

:::info Membedah Pilar Pembentuk
Dengan selesainya bab Gambaran Besar (Hulu) ini, Anda telah memahami fondasi teori, visi, tumpukan teknologi, dan topologi G-NEXA. Selanjutnya, kita akan turun satu level untuk membedah kode dan anatomi dari masing-masing layanan. 

Lanjutkan ke **[Pilar Pembentuk: User Service (Express.js)](/docs/components/user-service)**.
:::

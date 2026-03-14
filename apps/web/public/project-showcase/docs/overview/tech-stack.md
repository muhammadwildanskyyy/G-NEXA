---
id: tech-stack
title: Keputusan Tech Stack
sidebar_label: Tech Stack
description: Pemetaan dan alasan rasional di balik pemilihan teknologi (polyglot) yang menggerakkan ekosistem GNEXA.
---

# Senjata Arsitektur: Keputusan Tech Stack

Membangun arsitektur *microservices* berskala *enterprise* menuntut pergeseran pola pikir dari "mencari satu bahasa atau kerangka kerja terbaik untuk semua hal" menjadi **"menggunakan alat yang paling tepat untuk pekerjaan yang spesifik"** (*the right tool for the right job*).

GNEXA mengadopsi prinsip **Polyglot Architecture**, memadukan berbagai bahasa pemrograman, protokol komunikasi, dan infrastruktur data. Halaman ini membedah daftar teknologi (*Tech Stack*) yang menyusun tulang punggung sistem ini beserta alasan teknis di baliknya.

---

## 1. Backend Services (Mesin Penggerak)

Lapis *backend* membagi tanggung jawab komputasi ke dalam ekosistem *Node.js* dan *Golang* untuk memaksimalkan efisiensi di setiap domain. Penggunaan **TypeScript** diterapkan secara luas pada layanan berbasis Node.js untuk menjaga *type-safety*.

* **Golang (Gin Gonic & Go Fiber):** Pilar utama untuk **Finance Service** dan **Media Service**. Golang dipilih karena efisiensi memori dan performa *concurrency* (Goroutines) yang luar biasa. Kombinasi *framework* Gin Gonic yang minimalis dan **Go Fiber**—yang dibangun di atas `fasthttp` untuk latensi ultra-rendah—memastikan layanan ini mampu memproses kalkulasi finansial dan aliran mutasi dengan kecepatan maksimum.
* **Express.js:** Digunakan sebagai fondasi untuk **User Service** (termasuk manajemen toko) dan **Product Service**. Sifatnya yang *un-opinionated*, ringan, dan gesit menjadikannya pilihan sempurna untuk melayani *traffic* autentikasi dan rute API yang membutuhkan respon instan tanpa *overhead* kerangka kerja yang berat.
* **NestJS:** Menggerakkan **Order Service**. Domain transaksi *e-commerce* memiliki *business logic* yang sangat rumit. NestJS, dengan arsitekturnya yang *opinionated* dan dukungan *Dependency Injection* bawaan, memastikan basis kode tetap bersih, modular, dan mudah di-*maintain* saat kerumitan meningkat.

## 2. Frontend & Presentation Layer (Antarmuka)

G-NEXA memisahkan antarmuka berdasarkan aktor yang menggunakannya dengan pendekatan *polyglot frontend*, yang keseluruhannya ditenagai oleh ekosistem modern **JavaScript/TypeScript**.

* **React.js & Next.js:** Digunakan untuk membangun etalase utama (*Storefront*) yang berhadapan langsung dengan pembeli. Next.js memberikan keunggulan mutlak dalam hal *Server-Side Rendering* (SSR) dan optimasi SEO untuk mendongkrak visibilitas katalog **Product Service**.
* **Vue.js & Nuxt.js:** Didedikasikan untuk *Dashboard Seller* dan area Admin. Ekosistem Vue menawarkan reaktivitas yang mulus dan *developer experience* (DX) yang cepat, sangat ideal untuk membangun antarmuka dasbor yang penuh form, matriks, dan manipulasi data kompleks.

## 3. Protokol Komunikasi & Jaringan (Urat Nadi)

Karena layanan-layanan tidak tergabung dalam satu monolit, GNEXA menggunakan tiga mode komunikasi yang berbeda, disesuaikan dengan kebutuhan latensi dan konsistensi:

* **HTTP/REST (External Communication):** Protokol standar yang menjembatani komunikasi dunia luar (klien/frontend) dengan **Kong API Gateway**. Kong bertindak sebagai pintu gerbang tunggal yang menangani *rate limiting*, sekuriti, dan *routing* HTTP ke layanan yang tepat.
* **gRPC (Synchronous Internal Communication):** Digunakan untuk komunikasi langsung antar-layanan (*inter-service*) yang mewajibkan respon instan. Memanfaatkan *Protocol Buffers* (Protobuf), gRPC mengirimkan *payload* data dalam format biner yang sangat padat dan cepat, jauh lebih efisien dibandingkan JSON/REST konvensional.
* **Apache Kafka (Asynchronous Event-Driven Backbone):** Bintang utama dari arsitektur terdistribusi ini. Untuk proses lintas-domain yang panjang (seperti *checkout* atau *rollback* stok), Kafka bertindak sebagai *Message Broker*. Komunikasi asinkronus ini memastikan *Saga Pattern* berjalan mulus dan sistem tetap tangguh (*fault-tolerant*) meski ada satu layanan yang sedang sibuk atau *down*.

## 4. Database & ORM (Brankas Data)

Menerapkan pola *Database per Service*, G-NEXA menggunakan pendekatan *Polyglot Persistence*, memisahkan data transaksional, dokumen, dan *cache*.

* **PostgreSQL:** Basis data relasional utama untuk data kritikal (Keuangan dan Pesanan). Menjamin kepatuhan ACID dan mendukung *Pessimistic Locking* secara presisi.
* **MongoDB:** Basis data NoSQL (*document-based*) yang fleksibel, ideal untuk **Product Service** yang skema datanya (seperti metadata dan varian produk) selalu dinamis.
* **Redis:** Bertindak sebagai lapisan *in-memory cache* berkecepatan tinggi, mengurangi beban *query* ke database utama dan berfungsi sebagai penyimpan kunci *idempotency* untuk transaksi gerbang pembayaran.
* **GORM:** Bertindak sebagai ORM andalan di ekosistem Golang. GORM memfasilitasi interaksi dengan PostgreSQL secara efisien dan memainkan peran krusial dalam mengeksekusi *Pessimistic Locking* (`SELECT ... FOR UPDATE`) untuk mencegah *race conditions* pada transaksi keuangan.
* **Prisma:** ORM modern dan *type-safe* yang digunakan pada layanan berbasis TypeScript (Node.js) untuk mempercepat interaksi dengan *database* sekaligus meminimalisir kesalahan kueri tingkat aplikasi.

## 5. Integrasi Pihak Ketiga (Ekstensi)

Untuk fungsi terisolasi yang lebih optimal di-*outsource* ke penyedia layanan khusus:

* **Xendit:** *Payment Gateway* yang kuat dan andal untuk memproses pembayaran dan menyalurkan aliran dana secara otomatis.
* **Cloudinary:** Diintegrasikan dengan **Media Service** untuk penyimpanan abstrak, kompresi, dan optimasi pengiriman aset visual secara global (gambar produk, avatar pengguna) tanpa membebani server lokal.

## 6. DevOps & Engineering Tools (Fondasi Kerja)

Standardisasi lingkungan pengembangan dan manajemen proyek kelas *enterprise*:

* **Docker:** Mengisolasi setiap *service*, *database*, dan *broker* ke dalam *container*, menjamin konsistensi absolut antara lingkungan pengembangan (*local*) dan produksi.
* **Taskfile:** Alternatif modern dari GNU Make. Mengotomatisasi ratusan perintah kompleks (seperti *build*, eksekusi *docker-compose*, atau migrasi DB) ke dalam eksekusi tugas yang rapi dan terpusat.
* **Git & Jira:** Manajemen versi (*version control*) dan pelacakan *Agile workflow*. Memastikan seluruh siklus pengembangan terpantau secara profesional.

---

:::info Tahap Selanjutnya: Menggabungkan Kepingan Puzzle
Setelah mengetahui fungsi dari setiap senjata di atas dan bagaimana lapisan komunikasinya (HTTP, gRPC, Kafka) dibagi, mari kita lihat bagaimana semuanya berinteraksi secara *real-time* di dalam jaringan. Lanjut ke bagian **[High-Level Architecture (Topologi)](/docs/overview/high-level-architecture)**.
:::
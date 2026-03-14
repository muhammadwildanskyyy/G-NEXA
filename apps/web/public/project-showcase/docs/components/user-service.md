---
id: user-service
title: User Service (Express.js)
sidebar_label: User & Store Service
description: Membedah lapisan autentikasi, manajemen identitas, dan logika multi-tenant (Store Management) menggunakan Express.js.
---

# User Service & Store Management

Selamat datang di Pilar Pembentuk pertama GNEXA. **User Service** adalah "Gerbang Utama" sekaligus "Buku Registrasi" dari seluruh ekosistem ini. 

Dibangun di atas ekosistem **Node.js** menggunakan kerangka kerja **Express.js** dan bahasa **TypeScript**, layanan ini dirancang untuk menjadi sangat gesit (*highly performant*) dan ringan, mengingat setiap entitas dalam sistem (Pembeli, Penjual, maupun layanan internal lainnya) pada akhirnya akan bergantung pada data identitas yang dikeluarkan oleh layanan ini.

---

## 1. Batasan Domain (Domain Boundaries)

Sesuai dengan prinsip *Domain-Driven Design* (DDD), User Service secara ketat hanya mengurus entitas yang berkaitan dengan identitas dan kepemilikan. Layanan ini **tidak tahu menahu** soal keranjang belanja, saldo dompet, atau katalog produk. 

Tanggung jawab utamanya meliputi:
* **Identity & Access Management (IAM):** Menangani proses Registrasi, *Login*, penerbitan token, dan *Role-Based Access Control* (RBAC).
* **Profile Management:** Mengelola metadata pengguna (nama, kontak, alamat pengiriman utama).
* **Store Management (Multi-Seller Engine):** Ini adalah jantung dari model *multi-seller* GNEXA. Layanan ini mengelola entitas `Store` (Toko), memetakan relasi *One-to-One* atau *One-to-Many* antara entitas `User` (sebagai pemilik) dengan entitas `Store` (sebagai entitas bisnis).

## 2. Mengapa Express.js?

Dalam arsitektur *microservices*, autentikasi adalah rute yang paling sering dipanggil (*high-throughput*). Hampir setiap interaksi membutuhkan validasi sesi.

* **Minimalis dan Cepat:** Berbeda dengan *framework* teropini yang berat, sifat Express.js yang *un-opinionated* dan minimalis menghilangkan *overhead* yang tidak perlu. Ini membuat waktu respons API (latensi) untuk otorisasi menjadi sangat rendah.
* **Middleware Pipeline yang Kuat:** Express sangat unggul dalam manipulasi *request* melalui *middleware*. Logika RBAC (seperti memastikan *request* hanya bisa diakses oleh `[USER_ROLE.SELLER]`) dapat disematkan dengan sangat bersih sebelum *request* menyentuh *Controller* utama.

## 3. Integrasi Autentikasi (JWT & API Gateway)

User Service tidak bekerja sendirian dalam mengamankan aplikasi. Ia berkolaborasi erat dengan **Kong API Gateway**.

1. **Penerbitan (Issuance):** Saat pengguna berhasil *login*, User Service memverifikasi *hash password* dan menerbitkan **JSON Web Token (JWT)** yang berisi *payload* ringan (seperti `user_id`, `store_id`, dan `role`).
2. **Delegasi Validasi:** Untuk mengurangi beban komputasi di User Service, Kong API Gateway dikonfigurasi untuk memvalidasi *signature* JWT secara mandiri di garis depan (*Edge Layer*). 
3. Jika *signature* valid, Kong meneruskan *request* tersebut ke layanan tujuan (misal: *Order Service*) dengan menyisipkan `user_id` di dalam *header* HTTP (`X-User-Id`). Dengan cara ini, layanan di belakang layar tidak perlu lagi memvalidasi token secara manual.

## 4. Persistensi Data (Prisma & PostgreSQL)

Untuk berinteraksi dengan basis data relasional **PostgreSQL**, User Service menggunakan **Prisma ORM**. 

Keputusan menggunakan Prisma sangat krusial di ekosistem TypeScript karena:
* **Type-Safety End-to-End:** Skema *database* diterjemahkan secara otomatis menjadi tipe data TypeScript. Ini secara drastis mengurangi *runtime errors* akibat kesalahan kueri atau perubahan nama kolom.
* **Manajemen Relasi User-Store:** Prisma memudahkan kueri relasional yang kompleks (seperti memuat profil *User* beserta data *Store* yang dimilikinya) tanpa harus menulis *raw SQL JOIN* yang rentan terhadap *SQL Injection*.

## 5. Komunikasi Antar-Layanan (Inter-service Communication)

Sebagai penjaga identitas, User Service sering "ditanya" oleh layanan lain. Untuk melayani ini tanpa mengunci performa sistem, layanan ini membuka dua jalur komunikasi:

### A. Synchronous via gRPC
Digunakan saat layanan lain membutuhkan jawaban instan.
* **Kasus Penggunaan:** Saat seorang *Seller* mencoba menambahkan produk baru, **Product Service** akan melakukan panggilan gRPC ke User Service untuk memvalidasi: *"Apakah Store ID '123' ini benar-benar ada dan berstatus aktif?"*
* **Alasan:** gRPC mengirimkan data dalam format biner (Protobuf), membuatnya jauh lebih cepat dibandingkan memanggil rute REST API internal.

### B. Asynchronous via Kafka
Digunakan untuk memberitahu seluruh ekosistem tentang perubahan status identitas tanpa harus memblokir alur kerja utama pengguna (*fire-and-forget*).

* **Kasus Penggunaan (Verifikasi Pengguna):** Saat seorang pengguna baru berhasil memvalidasi akun mereka (misalnya melalui klik tautan verifikasi email), User Service akan mengubah status pengguna tersebut menjadi aktif di *database*. Pada milidetik yang sama, layanan ini mempublikasikan *event* `user.activated` ke jaringan **Apache Kafka**.
* **Reaksi Lintas-Layanan:** **Finance Service**—sebagai layanan independen yang mendengarkan topik Kafka tersebut—akan menangkap *event* ini. Tanpa disadari oleh pengguna, Finance Service bereaksi secara asinkronus dengan membuatkan entitas dompet digital (*wallet*) untuk `user_id` tersebut di dalam *database ledger*-nya. 

Proses asinkronus ini menjamin bahwa respons API untuk "Verifikasi Sukses" bisa dikembalikan ke *frontend* dengan sangat cepat, sementara inisialisasi *wallet* yang memakan waktu komputasi diselesaikan dengan aman di latar belakang.

---

:::info Tahap Selanjutnya: Orkestrasi Katalog & Transaksi
Sekarang kita telah memahami bagaimana pengguna dan entitas toko dikelola di pintu depan. Mari kita bergerak lebih dalam untuk melihat bagaimana barang-barang dari berbagai toko tersebut dikelola dan dibeli.

Lanjutkan ke **[Product Service (Node.js & MongoDB)](/docs/components/product-service)**.
:::
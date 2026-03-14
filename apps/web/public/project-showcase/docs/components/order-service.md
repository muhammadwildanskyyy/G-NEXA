---
id: order-service
title: Order Service (NestJS)
sidebar_label: Order & Checkout
description: Membedah mesin orkestrasi transaksi, logika Parent/Child Invoice, dan implementasi Saga Choreography.
---

# Order Service: Mesin Orkestrasi Transaksi

Jika layanan lain bertugas menyediakan data, maka **Order Service** adalah jantung operasional tempat bertemunya niat pembeli (*User*), ketersediaan barang (*Product*), dan perputaran uang (*Finance*). 

Mengingat tingginya risiko kerugian finansial akibat *bug* pada logika transaksi, lapisan komputasi di layanan ini membutuhkan tingkat kedisiplinan kode yang jauh lebih tinggi dibandingkan layanan lainnya. Itulah mengapa GNEXA beralih dari Express.js dan mengadopsi **NestJS** untuk menggerakkan domain ini.

---

## 1. Batasan Domain (Domain Boundaries)

Order Service memiliki yurisdiksi penuh atas seluruh siklus hidup pesanan, mulai dari barang dimasukkan ke keranjang hingga pesanan selesai. Tanggung jawab utamanya meliputi:

* **Cart Management:** Mengelola sesi keranjang belanja pengguna sebelum *checkout*.
* **Checkout Orchestration:** Memvalidasi ketersediaan barang (via gRPC ke Product Service) dan menghitung total harga secara absolut.
* **Order Splitting (Multi-Seller):** Memecah satu sesi *checkout* menjadi beberapa pesanan independen berdasarkan entitas Toko (*Store*).
* **State Machine:** Mengelola transisi status pesanan secara ketat (misal: `PENDING` `PAID` `SHIPPED` `COMPLETED` atau `CANCELLED`).

## 2. Pergeseran Paradigma: Mengapa NestJS?

Sementara User dan Product Service menggunakan Express.js yang *un-opinionated* dan bebas, Order Service membutuhkan struktur yang sangat kaku. NestJS menawarkan arsitektur tingkat *enterprise* yang terinspirasi dari Angular:

* **Opinionated Structure:** NestJS memaksa *engineer* untuk memisahkan *Controllers*, *Services*, dan *Modules*. Ini mencegah terjadinya *spaghetti code* saat logika bisnis transaksi semakin membengkak.
* **Dependency Injection (DI):** Ekosistem DI bawaan NestJS membuat pengujian otomatis (*Unit Testing*) menjadi sangat mudah. Memastikan kalkulasi harga, diskon, dan ongkos kirim berjalan 100% akurat adalah harga mati sebelum kode didorong ke tahap produksi.
* **TypeScript Ekstrem:** Berpadu dengan kelas-kelas DTO (*Data Transfer Object*), NestJS memvalidasi *payload* JSON yang masuk dari *client* secara otomatis di tingkat *middleware*, menolak permintaan *checkout* yang cacat struktur sebelum menyentuh lapisan *database*.

## 3. Menaklukkan Kompleksitas Multi-Seller: Parent/Child Invoice

Tantangan terbesar dalam *e-commerce* berskala besar adalah menangani skenario di mana satu pembeli melakukan *checkout* yang berisi 5 barang dari 3 toko (*Seller*) yang berbeda.

Order Service GNEXA menyelesaikan ini dengan mengimplementasikan model relasi **Parent-Child Order**:

1. **Parent Order (Fokus Pembeli & Pembayaran):** Sistem menghasilkan satu ID Pesanan Utama (*Parent*) yang merepresentasikan total keseluruhan dana yang harus dibayar oleh pembeli ke *Payment Gateway* (Xendit). Pembeli hanya melihat satu tagihan.
2. **Child Orders (Fokus Penjual & Logistik):** Di bawah *Parent Order* tersebut, sistem memecahnya menjadi 3 *Child Orders* (satu untuk masing-masing toko). Setiap *Child Order* memiliki ID Pesanan, daftar barang, dan status pengirimannya sendiri. 
3. **Isolasi Kegagalan:** Jika penjual A membatalkan pesanannya karena kehabisan stok fisik, hanya *Child Order* A yang berstatus `CANCELLED` dan dananya dikembalikan (*refund*). Sementara *Child Order* B dan C tetap berjalan normal menuju proses pengiriman.

## 4. Orkestrasi Tanpa Konduktor: Saga Choreography

Setelah *Order* tersimpan di *database* PostgreSQL dengan status `PENDING`, pesanan tersebut belum aman. Stok barang harus dipotong, dan pembayaran harus dikonfirmasi.

Order Service **tidak pernah** memanggil *Finance Service* atau *Product Service* menggunakan HTTP/REST untuk melakukan hal tersebut. Menunggu respons HTTP dari berbagai layanan akan menyebabkan transaksi *timeout* dan mengunci *database*. Solusinya adalah **Event-Driven Saga Pattern (Choreography)** menggunakan Apache Kafka:

* **The Trigger (Publikasi):** Setelah memvalidasi *checkout*, Order Service mempublikasikan *event* `order.created` ke Kafka beserta *payload* lengkap pesanan.
* **Fire and Forget:** Order Service langsung memberikan respons `201 Created` ke *frontend*. Latensi menjadi sangat rendah (beberapa milidetik) karena proses asinkronus diambil alih oleh *background worker*.
* **The Reaction (Konsumsi):** Layanan lain bereaksi. *Product Service* memotong stok. *Finance Service* membuat *Invoice* di Xendit.
* **The Resolution:** Jika *Finance Service* menerima *webhook* pelunasan dari Xendit, ia akan mempublikasikan *event* `payment.success`. Order Service, yang bertindak sebagai *consumer* di topik tersebut, akan menangkap *event* ini dan secara reaktif mengubah status *Order* di *database*-nya menjadi `PAID`, memicu penjual untuk mulai mengemas barang.

Melalui *Choreography*, Order Service bertindak layaknya penari yang bergerak merespons alunan musik (*events*), bukan seorang manajer mikro yang harus menginstruksikan setiap layanan lain secara sinkronus.

---

:::info Tahap Selanjutnya: Mengamankan Arus Kas
Kita telah melihat bagaimana pesanan dibuat dan dilempar ke dalam jaringan antrean pesan. Sekarang, mari kita lihat siapa yang menangkap pesan tersebut di ujung sana.

Lanjutkan ke **[Finance Service (Golang)](/docs/components/finance-service)** untuk membedah bagaimana uang dikelola dengan presisi absolut, menolak *Race Conditions*, dan memastikan *Idempotency*.
:::
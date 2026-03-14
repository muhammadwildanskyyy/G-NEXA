---
id: finance-service
title: Finance Service (Golang)
sidebar_label: Finance & Ledger
description: Membedah brankas sistem, penanganan konkurensi dengan Golang, Pessimistic Locking, dan Webhook Idempotency.
---

# Finance Service: Brankas & Integritas Data

Selamat datang di lapisan paling kritikal dalam ekosistem G-NEXA: **Finance Service**. 

Jika layanan lain memiliki sedikit ruang untuk penundaan (*delay*) atau toleransi kesalahan pada antarmuka, layanan finansial tidak memiliki ruang untuk toleransi semacam itu. Kehilangan satu riwayat data atau salah menghitung satu sen berarti kegagalan sistem secara fatal. Oleh karena itu, Node.js ditinggalkan di domain ini, dan arsitektur komputasi beralih sepenuhnya ke **Golang (Go)**.

---

## 1. Batasan Domain (Domain Boundaries)

Sebagai "Brankas Utama", Finance Service sepenuhnya buta terhadap apa itu "Keranjang Belanja" atau "Katalog Produk". Ia hanya memahami angka, mutasi, dan aliran dana. Tanggung jawabnya meliputi:

* **Wallet Management:** Mengelola entitas dompet digital (Saldo Pembeli dan Pendapatan Penjual).
* **Ledger & Mutations:** Mencatat setiap riwayat arus kas masuk dan keluar dengan prinsip *immutable* (data lama tidak bisa diubah/dihapus, kesalahan hanya bisa diperbaiki dengan mutasi kompensasi).
* **Payment Gateway Integration:** Menjadi satu-satunya layanan yang memiliki otoritas untuk berkomunikasi dengan **Xendit** dalam hal pembuatan *Invoice* dan penerimaan *Webhook* pembayaran.
* **Fund Routing (Multi-Seller):** Menghitung dan mendistribusikan aliran dana dari satu pembayaran pembeli tunggal ke berbagai dompet penjual secara akurat (*split payment*).

## 2. Mengapa Golang? (Kecepatan & Konkurensi)

Memproses ratusan transaksi dan *webhook* per detik (*high throughput*) menuntut efisiensi komputasi tingkat tinggi.

* **Goroutines & Concurrency:** Golang diciptakan untuk konkurensi. *Goroutines* sangat ringan dibandingkan eksekusi *Thread* tradisional di Java atau proses *Event-Loop* tunggal di Node.js. Ini memungkinkan Finance Service menangani ribuan *webhook* masuk secara bersamaan tanpa lonjakan konsumsi memori yang drastis.
* **Kombinasi Gin Gonic & Go Fiber:** Memanfaatkan *framework* minimalis yang dibangun di atas `fasthttp`, waktu respons layanan ini (latensi) ditekan hingga ke level mikrodetik.
* **Type-Safety Sejati:** Sebagai bahasa *statically compiled*, Golang menangkap potensi *bug* tipe data finansial sejak tahap kompilasi (*compile-time*), bukan saat aplikasi sudah telanjur berjalan di *production*.

## 3. Menaklukkan Race Conditions: Pessimistic Locking

Ini adalah masalah klasik di sistem dompet digital: *Bagaimana jika seorang pengguna memiliki saldo Rp100.000, lalu sebuah script bot melakukan checkout pesanan A (Rp100.000) dan pesanan B (Rp100.000) pada **milidetik yang persis sama**?*

Tanpa mekanisme penguncian, sistem bisa saja membaca saldo Rp100.000 secara bersamaan untuk kedua transaksi, menyetujui keduanya, dan membuat saldo menjadi minus (-Rp100.000). Finance Service mencegah anomali ini secara absolut menggunakan **Pessimistic Locking** via ORM **GORM** di PostgreSQL:

* **SELECT ... FOR UPDATE:** Saat layanan mengeksekusi transaksi pemotongan saldo, GORM menyuntikkan klausa pengunci. 
* **Row-Level Lock:** PostgreSQL akan "menggembok" baris data dompet tersebut. Jika *request* pesanan B datang di milidetik yang sama, *database* akan memaksanya **menunggu (antre)** sampai transaksi pesanan A selesai memotong saldo dan melepaskan gemboknya (*commit/rollback*).
* Saat antrean pesanan B mendapat giliran untuk diproses, ia akan membaca bahwa saldo sudah menjadi Rp0, dan transaksi akan ditolak secara sah (Saldo Tidak Cukup). Integritas finansial tetap terjaga 100%.

## 4. Pertahanan Webhook: Idempotency Pattern

Sistem eksternal seperti Xendit sering kali menerapkan mekanisme *retry* otomatis jika mereka mendeteksi adanya sedikit gangguan jaringan (meskipun sebenarnya pembayaran sudah masuk). Akibatnya, Finance Service bisa menerima 3 *webhook* "Pembayaran Sukses" untuk satu ID Transaksi yang sama dalam jeda beberapa detik.

Jika sistem bersifat naif, saldo pengguna bisa bertambah tiga kali lipat. G-NEXA menyelesaikan ini dengan pola **Idempotency**:

1. Setiap kali *webhook* masuk, sistem mengekstrak `callback_token` atau `transaction_id` unik dari Xendit.
2. Sistem mengecek ke lapisan *cache* (**Redis**) dan *constraint unique* di PostgreSQL: *"Apakah token ini sudah pernah diproses?"*
3. Jika belum, sistem memproses penambahan saldo dan mencatat token tersebut.
4. Jika Xendit mengirim ulang *webhook* yang sama persis, Finance Service akan menyadari bahwa token tersebut sudah tercatat, dan langsung mengembalikan status `200 OK` ke Xendit **tanpa** mengeksekusi mutasi penambahan saldo lagi.
5. Hasil akhirnya: Seberapa banyak pun *webhook* ganda masuk, saldo hanya akan ditambahkan **tepat satu kali (Exactly-Once Semantics)**.

## 5. Menutup Rantai Saga (Saga Resolution)

Finance Service sering kali menjadi titik akhir (*resolution point*) dari banyak alur transaksi terdistribusi di ekosistem GNEXA:

* Saat pengguna sukses melakukan pembayaran di Xendit, Xendit menembak *webhook* ke Finance Service.
* Setelah lapisan *Idempotency* tervalidasi dan uang dicatat di *ledger*, Finance Service "berteriak" ke seluruh jaringan melalui **Apache Kafka** dengan menyiarkan *event*: `payment.success`.
* Dari titik ini, tugas Finance Service selesai.
* **Order Service** yang mendengarkan *event* tersebut akan segera mengubah status pesanan dari `PENDING` menjadi `PAID`. Sementara **Product Service** akan mengubah status stok dari *reserved* (terkunci) menjadi terpotong permanen secara asinkronus. 

Sebuah koreografi sistem yang sempurna tanpa satupun panggilan HTTP internal yang memblokir.

---

:::info Masuk ke Ranah Hilir (The Masterpiece)
Ketiga pilar utama (User, Product/Order, Finance) kini telah berdiri dengan perannya masing-masing. Di bab selanjutnya, kita akan menyelam langsung ke dalam level kode untuk melihat bagaimana solusi rekayasa terberat dieksekusi secara nyata.

Lanjutkan ke **[Media Service (Go Fiber & Cloudinary)](/docs/components/media-service)** untuk membedah bagaimana aset visual dikelola secara efisien tanpa membebani layanan transaksi.
:::
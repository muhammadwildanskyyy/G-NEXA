---
id: product-service
title: Product Service (Node.js & MongoDB)
sidebar_label: Product & Catalog
description: Membedah lapisan katalog, manajemen inventaris, dan strategi optimasi pencarian berkinerja tinggi.
---

# Product Service: Katalog & Inventaris

Jika *User Service* adalah gerbang utama, maka **Product Service** adalah etalase raksasa dari ekosistem G-NEXA. Layanan ini mengemban tugas krusial: menyajikan jutaan data barang dari berbagai toko (*multi-seller*) dengan kecepatan kilat, sekaligus menjaga keakuratan stok di tengah gempuran ribuan transaksi serentak.

Dibangun dengan ekosistem **Node.js (Express)**, layanan ini menonjolkan implementasi *Polyglot Persistence*—meninggalkan basis data relasional dan beralih sepenuhnya ke arsitektur NoSQL dan *In-Memory Cache*.

---

## 1. Batasan Domain (Domain Boundaries)

Sebagai pusat katalog, Product Service memiliki otoritas penuh atas segala hal yang bisa "dilihat dan dibeli". Tanggung jawab utamanya meliputi:

* **Catalog Management:** Mengelola entitas produk utama, deskripsi, harga, dan relasinya dengan *Store ID* milik penjual.
* **Dynamic Variants:** Menangani variasi produk yang sangat dinamis (seperti kombinasi Warna, Ukuran, atau Material) dalam satu entitas produk.
* **Inventory Tracking:** Melacak ketersediaan stok fisik secara presisi untuk setiap varian produk.
* **Category & Metadata:** Mengelompokkan produk ke dalam taksonomi kategori dan mengelola *tag* untuk kebutuhan algoritma pencarian.

## 2. Polyglot Persistence: Mengapa MongoDB?

Sebagian besar layanan G-NEXA menggunakan PostgreSQL. Namun, untuk Product Service, keputusan arsitektural jatuh pada **MongoDB** (*Document-based NoSQL*). Mengapa?

Dalam platform *e-commerce multi-seller*, atribut produk sangat tidak terduga (*dynamic schema*). Sebuah Laptop memiliki atribut RAM dan CPU, sedangkan sebuah Kaos memiliki atribut Ukuran dan Jenis Kain. 

* **Anti-Pattern di SQL:** Menggunakan tabel relasional (SQL) untuk data semacam ini akan memaksa kita menggunakan pola EAV (*Entity-Attribute-Value*) yang sangat lambat untuk di-*query*, atau kolom JSONB yang sulit diindeks secara mendalam.
* **Kekuatan NoSQL:** MongoDB menyimpan data dalam bentuk dokumen BSON (mirip JSON). Ini memungkinkan setiap produk memiliki struktur atribut yang benar-benar berbeda satu sama lain dalam satu koleksi (*collection*), memberikan fleksibilitas absolut bagi *Seller* tanpa mengorbankan performa *query* atau kerumitan migrasi skema.

## 3. Strategi Menghadapi "Read-Heavy Workload"

Karakteristik lalu lintas (*traffic*) di *e-commerce* sangat timpang: **95% adalah operasi Baca (Melihat Produk), dan 5% adalah operasi Tulis (Menambah Produk/Membeli)**. 

Jika setiap *request* pencarian produk langsung menghantam MongoDB, *database* akan kelebihan beban (*bottleneck*). Oleh karena itu, Product Service mengimplementasikan lapisan penyangga menggunakan **Redis**:

* **Cache-Aside Pattern:** Saat pengguna membuka halaman produk, sistem pertama-tama akan mencari data tersebut di dalam *RAM* Redis. Jika ada (*Cache Hit*), data langsung dikembalikan dalam hitungan sub-milidetik. Jika tidak ada (*Cache Miss*), sistem akan mengambilnya dari MongoDB, menyimpannya sementara di Redis, lalu mengembalikannya ke pengguna.
* **Cache Invalidation:** Tantangan terbesar dalam *caching* adalah data basi (*stale data*). Di G-NEXA, saat *Seller* memperbarui harga atau stok, Product Service secara proaktif akan menghapus (invalidasi) *key* Redis yang relevan, memastikan pembeli selalu melihat harga dan stok terbaru.

## 4. Orkestrasi Inventaris via Kafka (Saga Choreography)

Product Service memainkan peran penting dalam transaksi terdistribusi. Ia bertanggung jawab menahan dan memotong stok agar tidak terjadi *overselling* (barang terjual melebihi stok fisik). 

Alih-alih menunggu panggilan HTTP yang rentan *timeout* dari *Order Service*, manipulasi stok dilakukan murni melalui **Apache Kafka**:

* **Reserve Stock (Mengunci Stok):** Saat *Order Service* menyiarkan *event* `order.created`, Product Service menangkapnya dan langsung melakukan penguncian stok sementara (*reserved*) secara atomik menggunakan operator `$inc` pada MongoDB.
* **Commit Stock (Pemotongan Permanen):** Jika *Finance Service* menyiarkan *event* `payment.success`, Product Service mengubah status stok yang terkunci menjadi terpotong permanen.
* **Rollback Stock (Kompensasi):** Ini adalah bagian terpenting dari *Saga Pattern*. Jika pembayaran kedaluwarsa atau dibatalkan, *event* `order.cancelled` akan disiarkan. Product Service mendengarkan *event* ini dan secara asinkronus mengembalikan jumlah stok yang sempat terkunci kembali ke etalase, memastikan tidak ada barang yang "nyangkut".

## 5. Validasi Lintas-Domain (gRPC)

Meskipun logika bisnis utamanya berjalan secara asinkronus, ada momen di mana kepastian mutlak dibutuhkan secara instan. Product Service menyediakan *endpoint* **gRPC** untuk melayani *Order Service* secara internal:

*   **Price & Availability Check:** Saat pembeli menekan tombol "Checkout", *Order Service* menembak Product Service via gRPC untuk memastikan apakah *Product ID* yang dikirim dari *client* (*frontend*) harganya belum dimanipulasi dan stoknya benar-benar masih tersedia pada detik itu juga. Data biner Protobuf memastikan validasi ini terjadi tanpa menambah latensi yang berarti bagi pengguna.

---

:::info Tahap Selanjutnya: Mesin Orkestrasi Transaksi
Kita telah melihat bagaimana identitas dan katalog barang dikelola secara independen. Kini saatnya menyatukan keduanya di dalam ruang transaksi yang paling kompleks.

Lanjutkan ke **[Order Service (NestJS)](/docs/components/order-service)** untuk membedah bagaimana *Parent/Child Invoice* dikelola saat pembeli *checkout* dari banyak toko sekaligus.
:::
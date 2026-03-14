---
id: vision
title: Visi & Arsitektur GNEXA
sidebar_label: Visi & Arsitektur
description: Membedah filosofi, motivasi arsitektural, dan rekayasa sistem terdistribusi di balik GNEXA.
---

# Visi & Arsitektur GNEXA

Selamat datang di *Ground Zero* dari arsitektur G-NEXA. Halaman ini tidak ditujukan untuk menjadi panduan penggunaan fungsional (*user manual*), melainkan sebuah jurnal rekayasa perangkat lunak yang membedah **keputusan arsitektural** di balik sistem terdistribusi ini.

---

## Visi dan Esensi Proyek

**G-NEXA** bukanlah sebuah platform *e-commerce* komersial, melainkan sebuah **Engineering Portfolio Project** yang dirancang secara spesifik untuk mengimplementasikan arsitektur *Microservices* berskala *enterprise*. 

Proyek ini sengaja mengadopsi pendekatan **Polyglot Architecture**—memanfaatkan Golang, NestJS, dan Express.js di lapis *backend*, serta ekosistem Next/Nuxt di lapis presentasi (*frontend*)—untuk mendemonstrasikan interoperabilitas teknologi yang heterogen. Melalui penerapan *Domain-Driven Design* (DDD), G-NEXA memecah monolit menjadi entitas-entitas layanan terisolasi (*loosely coupled*). Setiap layanan beroperasi layaknya mesin industri independen yang saling melengkapi, di mana masing-masing memiliki batasan *database* sendiri dan dioptimalkan secara spesifik sesuai karakteristik beban kerjanya.

## Fokus Rekayasa Perangkat Lunak

Tujuan fundamental dari proyek eksperimental ini adalah mendemonstrasikan penyelesaian masalah level sistem (*system-level problem solving*) pada lingkungan terdistribusi, bukan sekadar menampilkan etalase belanja fungsional. 

Dengan merancang topologi komunikasi hibrida—mengkombinasikan *RESTful API* untuk rute sinkronus dan sistem antrean pesan terpusat untuk *event-driven workflow*—G-NEXA difokuskan untuk menaklukkan tiga tantangan rekayasa utama:

1. **Orkestrasi Aliran Data Terdistribusi:** Mengurai kompleksitas komunikasi lintas-layanan (*inter-service communication*) dari berbagai bahasa pemrograman yang berbeda tanpa menciptakan *bottleneck* pada jaringan.
2. **Integritas Transaksi Lintas Domain:** Menjaga keutuhan transaksi—terutama saat pembeli melakukan *checkout* dari banyak toko sekaligus (*Parent/Child Invoice*)—menggunakan mekanisme kompensasi otomatis, serta menjamin keamanan mutasi finansial dari bahaya *race conditions* melalui penguncian di level *database*.
3. **Resiliensi dan Skalabilitas (High Availability & Scalability):** Memastikan arsitektur sistem tetap tangguh (*fault-tolerant*), terhindar dari titik kegagalan tunggal (*Single Point of Failure*), dan siap untuk dilakukan *horizontal scaling* kapan saja beban melonjak.

## Anatomi Layanan Utama

Sistem ini meninggalkan pendekatan *one-size-fits-all* dan memberikan tanggung jawab spesifik pada teknologi dan domain yang paling relevan:

* **User Service :** Lapis layanan yang dirancang sangat gesit dan ringan, bertanggung jawab atas pintu masuk autentikasi, otorisasi, manajemen identitas pengguna, serta pengelolaan entitas **manajemen toko (Store Management)**.
* **Product Service:** Berperan sebagai katalog utama sistem. Layanan ini mengelola seluruh entitas barang dagangan, varian, inventaris, dan metadata produk dari berbagai toko yang beroperasi di dalam platform.
* **Order Service :** Berperan sebagai mesin utama keranjang belanja dan orkestrasi *checkout*. Memanfaatkan struktur teropini (*opinionated*) untuk menangani logika transaksi e-commerce multi-toko yang kompleks.
* **Finance Service :** Bertindak sebagai brankas utama. Penggunaan Go dipilih secara strategis karena performa *concurrency*-nya yang superior, sangat krusial untuk mengamankan mutasi dompet digital dan memproses aliran dana.
* **Media Service:** Layanan utilitas yang bertanggung jawab penuh atas pengelolaan aset digital dan pemrosesan *file* sebagai pemenuhan kebutuhan konten di seluruh aplikasi (seperti gambar produk, foto profil, dan aset visual toko).

## Topologi dan Tulang Punggung Sistem

Lalu lintas pertukaran data (*data transit*) di dalam G-NEXA dirancang agar tidak saling mengunci.

* **Gerbang Utama:** Semua permintaan masuk dari *client* dirutekan melalui **API Gateway**, yang bertindak sebagai *reverse proxy* sekaligus lapisan keamanan di garis depan.
* **Event-Driven Backbone:** Pertukaran status dan data antar-servis murni dialirkan melalui **Apache Kafka**. Kafka berfungsi sebagai urat nadi komunikasi asinkronus, mendistribusikan *events* untuk dikonsumsi oleh layanan yang berkepentingan.
* **Isolasi Data:** Menerapkan pola *Database per Service* secara ketat menggunakan PostgreSQL dan Redis (*caching*), memastikan tidak ada keterikatan data (*database coupling*) yang dapat merusak independensi masing-masing layanan.

---

:::info Tahap Selanjutnya: Keputusan Tech Stack
Setelah memahami fondasi pemikiran dan visi domain di atas, mari kita bedah lebih dalam senjata (teknologi) apa saja yang digunakan untuk menggerakkan arsitektur ini. Baca selengkapnya di bagian **[Keputusan Tech Stack](/docs/overview/tech-stack)**.
:::
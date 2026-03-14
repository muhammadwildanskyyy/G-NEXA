---
id: media-service
title: Media Service (Go Fiber)
sidebar_label: Media & Assets
description: Membedah arsitektur pengelolaan aset visual, pemrosesan aliran data (streams) dengan Golang, dan optimasi pengiriman global.
---

# Media Service: Manajemen Aset & Optimasi Visual

Dalam platform *multi-seller e-commerce* seperti G-NEXA, konten visual adalah raja. Setiap hari, ratusan penjual mengunggah foto produk, *banner* toko, dan avatar pengguna dalam berbagai resolusi dan ukuran *file*. 

Jika beban pemrosesan *file* biner ini dibebankan pada layanan utama seperti *Product Service* atau *User Service*, kinerja komputasi untuk transaksi bisnis akan terhambat parah. Oleh karena itu, **Media Service** diisolasi menjadi entitas independen. Berbeda dengan layanan utilitas pada umumnya, layanan ini dibangun menggunakan **Golang (Go Fiber)** untuk mendedikasikan dirinya murni pada operasi *Input/Output* (I/O) tingkat tinggi dengan efisiensi memori yang ekstrem.

---

## 1. Batasan Domain (Domain Boundaries)

Media Service adalah layanan utilitas yang agnostik (tidak memihak). Layanan ini tidak peduli apakah sebuah gambar adalah foto sepatu atau foto profil pengguna. Tugas utamanya adalah:

* **File Ingestion:** Menerima unggahan *file* mentah dari *client*, memvalidasi tipe *MIME* (*magic bytes detection* untuk mencegah *file* berbahaya), dan membatasi ukuran *payload*.
* **Storage Abstraction:** Menjadi jembatan antara aplikasi G-NEXA dan penyedia *Cloud Storage* pihak ketiga (dalam hal ini, **Cloudinary**).
* **Asset Optimization:** Memicu transformasi gambar secara *on-the-fly* (kompresi ukuran, konversi format ke WebP/AVIF, dan penyesuaian resolusi) sebelum disajikan ke pembeli.
* **Orphan Cleanup:** Memastikan tidak ada *file* sampah yang membebani biaya *storage* ketika entitas induknya dihapus di layanan lain.

## 2. Keputusan Arsitektur: Go Fiber & Cloudinary

Mengelola *file* gambar di *server* lokal (menyimpannya di dalam *disk* server) adalah mimpi buruk untuk skalabilitas *microservices*. G-NEXA menggunakan pendekatan *Cloud-Native* yang dipadukan dengan performa Go:

* **Goroutines & fasthttp:** Go Fiber dibangun di atas `fasthttp`, salah satu *HTTP engine* tercepat di dunia. Saat ratusan *client* mengunggah gambar bersamaan, Go cukup mengalokasikan *Goroutines* yang sangat ringan (hanya memakan beberapa Kilobyte memori per proses), memastikan layanan tidak pernah mengalami *bottleneck* I/O.
* **Cloudinary CDN:** Alih-alih menyimpan gambar secara lokal, Media Service melempar *file* tersebut ke Cloudinary. Cloudinary bertindak sebagai *Content Delivery Network* (CDN) global, memastikan gambar produk dimuat dalam hitungan milidetik oleh pembeli dari berbagai wilayah.

## 3. Mencegah OOM: Stream (`io.Reader`) vs Memori (RAM)

Kesalahan amatir yang paling sering terjadi saat membangun fitur *upload* adalah memuat seluruh *file* biner ke dalam memori aplikasi (*RAM*) menggunakan *byte slice* (`[]byte`). Jika ada 100 *user* yang mengunggah gambar 5MB secara bersamaan, *server* akan memakan 500MB RAM dalam sekejap dan berisiko mengalami *Out of Memory* (OOM) *Crash*.

Media Service di G-NEXA dirancang untuk menggunakan metode **Data Streaming** murni:

* *File multipart* yang masuk dari *client* (melalui Kong API Gateway) tidak pernah diendapkan secara utuh di dalam RAM.
* Go memanfaatkan *interface* `io.Reader`. Media Service menangkap aliran data jaringan (*network stream*) tersebut dan langsung memompanya (*pipe*) ke API Cloudinary secara *real-time*. 
* Arsitektur *pass-through* ini memastikan bahwa meskipun layanan sedang menangani unggahan *file* berukuran puluhan Megabyte, konsumsi RAM Golang tetap stabil dan nyaris datar.

## 4. Orkestrasi Asinkronus (Kafka Integration)

Meskipun berstatus sebagai layanan utilitas, Media Service terhubung kuat ke **Event-Driven Backbone (Apache Kafka)** untuk menjaga kebersihan data dan melakukan provisi aset:

### A. Provisi Aset (Reaktif)
Saat seorang pengguna baru mendaftar atau membuat toko baru, *User Service* menyiarkan *event* `store.created`.
* Media Service mendengarkan *event* ini melalui *consumer* Kafka di Golang dan secara reaktif membuatkan *struktur folder* khusus di Cloudinary untuk *Store ID* tersebut. Layanan ini juga dapat mengatur *placeholder* gambar secara asinkronus tanpa memperlambat proses pendaftaran *user*.

### B. Garbage Collection (Pembersihan File Yatim Piatu)
Kelemahan arsitektur *microservices* adalah munculnya "Data Yatim Piatu" (*Orphaned Files*). Jika seorang penjual menghapus 10 produk dari katalog, metadatanya hilang dari MongoDB, tetapi foto-fotonya sering kali masih tertinggal di Cloudinary dan menghabiskan biaya *storage* bulanan.
* Di G-NEXA, saat produk dihapus, *Product Service* menerbitkan *event* `product.deleted` ke Kafka.
* Media Service mendengarkan *event* ini, mengekstrak daftar ID aset visual dari *payload*, dan melakukan pemanggilan API penghapusan ke Cloudinary di latar belakang.
* Sinkronisasi data antara MongoDB dan Cloudinary tetap terjaga kebersihannya tanpa memperlambat respons HTTP ke penjual yang menekan tombol "Hapus".

---

:::info Masuk ke Ranah Hilir (The Masterpiece)
Seluruh pilar pembentuk G-NEXA—mulai dari gerbang identitas (Express), katalog produk (Node.js), mesin transaksi (NestJS), brankas finansial (Golang), hingga pengelola aset berkinerja tinggi (Go Fiber)—kini telah berdiri kokoh di posisinya masing-masing.

Di bab selanjutnya, kita akan menyelam langsung ke level kode dan membedah bagaimana solusi rekayasa terberat dioperasikan. Lanjutkan ke **[Hilir: Distributed Transactions (Saga Pattern)](/docs/engineering/saga-pattern)**.
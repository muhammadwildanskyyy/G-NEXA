# 🚀 GNEXA Project Commands

Dokumentasi ini berisi daftar perintah otomatis menggunakan **Taskfile** untuk mengelola lifecycle aplikasi GNEXA (Development, Production, dan Database).

## 📋 Prasyarat

Pastikan Anda sudah menginstall **Task** di komputer Anda.

- **Mac/Linux (Homebrew):** `brew install go-task/task`
- **Windows (Scoop):** `scoop install task`
- **NPM:** `npm install -g @go-task/cli`

---

## 🛠️ Cheat Sheet (Perintah Cepat)

| Perintah                       | Deskripsi                                                                     |
| :----------------------------- | :---------------------------------------------------------------------------- |
| **`task`**                     | Menampilkan status container yang sedang berjalan.                            |
| **`task dev:up`**              | Menyalakan **SEMUA** service (User, Product, Media, DB) mode **Development**. |
| **`task prod:up`**             | Menyalakan **SEMUA** service mode **Production** (Binary/Alpine).             |
| **`task restart`**             | Restart service tertentu di Dev (Contoh: task dev:restart s=user-service)     |
| **`task dev:{service-name}:`** | Menyalakan/Restart hanya salah satu service berdasarkan {service-name}        |
| **`task db:up`**               | Hanya menyalakan **Database** (Postgres & Mongo) saja.                        |
| **`task logs`**                | Melihat logs semua service secara real-time.                                  |
| **`task down`**                | Mematikan semua container.                                                    |

---

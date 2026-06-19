# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Project Name:** Smart Place Finder

## 1. Latar Belakang & Tujuan Pengembanan

**Smart Place Finder** adalah aplikasi berbasis web yang memungkinkan pengguna untuk mencatat, mengelola, dan mereview cafe yang pernah dikunjungi, serta membagikan ulasan tersebut setelah disetujui oleh admin.

Sesuai dengan ketentuan proyek, aplikasi ini dirancang untuk mendemonstrasikan integrasi aplikasi modern end-to-end. Tujuan teknis utama dari pengembangan ini adalah:

* Membangun API menggunakan GraphQL.


* Mengelola service secara terisolasi menggunakan Docker.


* Membangun antarmuka client HTML sederhana yang terhubung ke GraphQL API.


* Menyediakan dokumentasi teknis yang komprehensif, termasuk arsitektur dan ERD.


* Memenuhi Capaian Pembelajaran (CLO) terkait identifikasi kebutuhan sistem informasi (PLO01 - CLO03) dan penggunaan metode/perangkat lunak dalam proyek nyata (PLO08 - CLO03).



## 2. Arsitektur & Teknologi Sistem

Untuk mencapai nilai "High" pada rubrikasi Arsitektur & Desain Sistem, sistem akan dirancang secara modular:

* **Backend:** Node.js / Express.js
* **API Gateway:** GraphQL (dengan schema yang modular dan file resolver yang dipisah).


* **Database:** MySQL / PostgreSQL (berjalan di dalam container terpisah).


* **Frontend:** HTML Client (Vanilla JS/HTML) untuk melakukan render hasil query dan menyediakan form pengiriman mutation.


* **Infrastruktur:** Docker & Docker Compose (`docker-compose.yml` dan `Dockerfile` dengan port mapping yang terdefinisi jelas).



## 3. Kebutuhan Fungsional (Features & GraphQL Mapping)

Fitur-fitur utama yang diminta akan dikonversi menjadi skema GraphQL. Ini akan jauh melampaui syarat minimal TOR (minimal 1 Query dan 2 Mutation) untuk memastikan fungsionalitas aplikasi berjalan optimal.

| Fitur Utama | Deskripsi Sistem & Hak Akses | Kebutuhan GraphQL (Query/Mutation) |
| --- | --- | --- |
| **1. Manajemen Cafe** | Pengguna dapat melakukan CRUD pada data cafe (nama, deskripsi, alamat, foto, rating, review). | **Query:** `getCafes`, `getCafeById`<br>

<br>**Mutation:** `createCafe`, `updateCafe`, `deleteCafe` |
| **2. Manajemen Folder Favorit** | Pengguna dapat membuat folder kustom dan memasukkan referensi cafe ke dalamnya. | **Query:** `getUserFolders`<br>

<br>**Mutation:** `createFolder`, `addCafeToFolder` |
| **3. Rating & Review** | Pengguna dapat menambahkan, mengedit, atau menghapus rating & review pada entitas cafe. | **Mutation:** `addReview`, `updateReview` |
| **4. Profil Pengguna** | Pengguna dapat mengelola profil mereka (nama, bio, foto profil). | **Query:** `getProfile`<br>

<br>**Mutation:** `updateProfile` |
| **5. Personal Notes** | Pengguna dapat membuat catatan pribadi (private) pada cafe tertentu yang tidak terlihat oleh publik. | **Mutation:** `addPersonalNote`, `updatePersonalNote` |
| **6. Admin Review System** | Admin memiliki hak akses untuk meninjau cafe yang ditambahkan user (mengubah status menjadi `APPROVED` atau `REJECTED` untuk dipublish). | **Query:** `getPendingCafes`<br>

<br>**Mutation:** `updateCafePublishStatus` |

## 4. Kebutuhan Non-Fungsional & Infrastruktur

Sesuai standar rubrikasi Docker (20%) dan API (20%), sistem harus memenuhi kriteria berikut:

* **Containerization:** Aplikasi harus dapat dijalankan secara instan menggunakan script `docker-compose up --build`.


* **Stabil & Tanpa Error:** Container untuk backend dan database harus stabil tanpa error saat di-*build* maupun saat *runtime*.


* **Aksesibilitas API:** Seluruh endpoint GraphQL harus dapat diakses dan diuji dengan baik melalui GraphQL Playground atau Postman.



## 5. Rencana Kerja (Worksheet Breakdown)

Pelaksanaan proyek ini akan menggunakan iterasi mingguan yang disesuaikan dengan instruksi pengerjaan kelompok:

* **Week 1 (Inisiasi & Setup):** Menentukan tema (Smart Place Finder), membuat struktur folder (backend & client), inisiasi schema GraphQL dasar, dan membuat Dockerfile backend.


* **Week 2 (Pengembangan API):** Membangun resolver secara modular, mendefinisikan seluruh Query & Mutation sesuai tabel fitur di atas, dan menyambungkan backend ke database.


* **Week 3 (Integrasi & Frontend):** Menyusun `docker-compose.yml`, melakukan testing API di dalam environment container, dan membangun tampilan antarmuka client HTML sederhana.


* **Week 4 (Finalisasi):** Finalisasi fitur, *error handling*, dan penyusunan dokumen laporan.



## 6. Deliverables & Dokumentasi (Output)

Untuk memastikan pencapaian nilai penuh pada rubrikasi Dokumentasi (15%), hasil akhir proyek harus mencakup:

1. **Source Code Lengkap:** Terdiri dari modul backend, frontend (HTML Client), beserta file `Dockerfile` dan `docker-compose.yml`.


2. **Dokumen PDF (Sesuai TOR):**
* Diagram Arsitektur Sistem.


* ERD (Entity Relationship Diagram) / Schema Types GraphQL.


* Screenshot eksekusi Query dan Mutation.


* Screenshot antarmuka Client HTML.


* Instruksi atau panduan langkah-langkah instalasi aplikasi (README detail).
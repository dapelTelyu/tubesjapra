# Smart Place Finder ☕📍 — Microservices Edition

**Smart Place Finder** adalah aplikasi berbasis web untuk mencatat, mengelola, dan mereview cafe, dibangun dengan **arsitektur Microservices penuh** menggunakan Docker, REST API inter-service, dan GraphQL API Gateway.

---

## 🏗️ Arsitektur Microservices

```
Browser ──► API Gateway :4000 (GraphQL + SPA)
                │
       ┌────────┼──────────────────────────┐
       ▼        ▼         ▼        ▼        ▼
user-svc   cafe-svc  review-svc folder-svc note-svc
:3001      :3002      :3003      :3004      :3005
   │          │          │          │          │
db_users  db_cafes  db_reviews db_folders  db_notes
```

### Karakteristik Microservices Nyata
- ✅ **Setiap service = proses Node.js terpisah** + container Docker sendiri
- ✅ **Setiap service hanya akses database domainnya sendiri** (tidak ada cross-DB query)
- ✅ **Komunikasi antar-service via HTTP REST** (service-to-service calls)
- ✅ **API Gateway** sebagai single entry point — mengagregasi & mengorkestrasikan semua service
- ✅ **Independent codebase** — setiap service punya `package.json`, `Dockerfile`, dan `.env` sendiri
- ✅ **Independent deployment** — setiap service bisa di-rebuild tanpa mempengaruhi yang lain

---

## 🛠️ Teknologi Stack

| Layer | Teknologi |
|---|---|
| **API Gateway** | Node.js, Express.js, Apollo Server (GraphQL) |
| **Domain Services** | Node.js, Express.js (REST API) |
| **Databases** | MySQL 8.0 (5 database domain terpisah) |
| **Container** | Docker & Docker Compose |
| **Frontend** | HTML5, Vanilla JS, Tailwind CSS via CDN |
| **Auth** | JSON Web Token (JWT) — diproses oleh user-service |

---

## 📂 Struktur Proyek

```
Smart-Place-Finder/
├── services/
│   ├── api-gateway/          # GraphQL API Gateway (port 4000) — PUBLIC
│   │   ├── public/
│   │   │   └── index.html    # Frontend SPA
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── typeDefs/ # GraphQL type definitions
│   │   │   │   └── resolvers/# Resolvers yang memanggil services via HTTP
│   │   │   └── index.js      # Apollo Server + Express entrypoint
│   │   ├── .env
│   │   └── Dockerfile
│   │
│   ├── user-service/         # User domain REST API (port 3001) — INTERNAL
│   ├── cafe-service/         # Cafe domain REST API (port 3002) — INTERNAL
│   ├── review-service/       # Review domain REST API (port 3003) — INTERNAL
│   ├── folder-service/       # Folder domain REST API (port 3004) — INTERNAL
│   └── note-service/         # Note domain REST API (port 3005) — INTERNAL
│
├── db-init/
│   └── init.sql              # Inisialisasi DDL + seed data MySQL
├── docker-compose.yml        # Orkestrasi 7 containers (1 db + 6 services)
└── README.md
```

---

## 🔌 Service REST API Endpoints

### user-service (3001)
| Method | Path | Fungsi |
|---|---|---|
| `POST` | `/users/signup` | Registrasi user baru |
| `POST` | `/users/login` | Login + JWT |
| `GET` | `/users/:id` | Profil user |
| `PUT` | `/users/:id` | Update profil |

### cafe-service (3002)
| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/cafes` | List cafe APPROVED |
| `GET` | `/cafes/pending` | Antrean moderasi admin |
| `GET` | `/cafes/batch?ids=1,2` | Batch fetch (untuk folder) |
| `GET` | `/cafes/:id` | Detail cafe |
| `POST` | `/cafes` | Buat cafe baru (PENDING) |
| `PUT` | `/cafes/:id` | Update cafe |
| `PATCH` | `/cafes/:id/status` | Update publish status |
| `PATCH` | `/cafes/:id/rating` | Update avg rating (dari gateway) |
| `DELETE` | `/cafes/:id` | Hapus cafe |

### review-service (3003)
| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/reviews?cafeId=:id` | List reviews per cafe |
| `POST` | `/reviews` | Tambah review → `{ review, avgRating }` |
| `PUT` | `/reviews/:id` | Update review → `{ review, avgRating }` |
| `DELETE` | `/reviews?cafeId=:id` | Hapus reviews (cascade) |

### folder-service (3004)
| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/folders?userId=:id` | List folder user |
| `POST` | `/folders` | Buat folder |
| `GET` | `/folders/:id/cafes` | List cafe IDs di folder |
| `POST` | `/folders/:id/cafes` | Tambah cafe ke folder |
| `DELETE` | `/folders/cafe-mappings?cafeId=:id` | Hapus mappings (cascade) |

### note-service (3005)
| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/notes?userId=:id&cafeId=:id` | Get catatan |
| `POST` | `/notes` | Buat catatan |
| `PUT` | `/notes/:id` | Update catatan |
| `DELETE` | `/notes?cafeId=:id` | Hapus catatan (cascade) |

---

## ⚡ Cara Menjalankan

### Prasyarat
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (pastikan sedang berjalan)
- Port `4000` (gateway) dan `3307` (database) kosong

### Build & Run
```powershell
# Di root folder proyek
docker-compose up --build -d
```

### URL Akses
| Endpoint | URL |
|---|---|
| **Frontend SPA** | http://localhost:4000/ |
| **GraphQL Playground** | http://localhost:4000/graphql |
| **Gateway Health** | http://localhost:4000/health |
| **All Services Health** | http://localhost:4000/health/all |

### Stop
```powershell
docker-compose down -v
```

---

## 🔍 Demo Accounts

| Email | Password | Role |
|---|---|---|
| `alice@spf.com` | `password123` | User |
| `admin@spf.com` | `admin123` | Admin |

---

## 🔄 Alur Komunikasi (Cross-Service Orchestration)

Contoh `addReview` mutation:
```
Browser → Gateway /graphql (addReview)
   ├─► POST review-service:3003 /reviews  → { review, avgRating: 4.5 }
   └─► PATCH cafe-service:3002 /cafes/:id/rating  { rating: 4.5 }
```

Contoh `deleteCafe` mutation (cascade):
```
Browser → Gateway /graphql (deleteCafe)
   ├─► DELETE review-service:3003 /reviews?cafeId=X
   ├─► DELETE note-service:3005 /notes?cafeId=X
   ├─► DELETE folder-service:3004 /folders/cafe-mappings?cafeId=X
   └─► DELETE cafe-service:3002 /cafes/X
```

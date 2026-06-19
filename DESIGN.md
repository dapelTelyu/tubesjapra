> **Role & Objective:**
> Bertindaklah sebagai Expert UI/UX Designer dan Frontend Developer. Tugas Anda adalah membuat antarmuka pengguna (UI) untuk aplikasi web bernama **"Smart Place Finder"**. Antarmuka ini berupa Client HTML statis yang akan diintegrasikan dengan GraphQL API.
> **Tech Stack:**
> * HTML5 (Semantic & Accessible)
> * Tailwind CSS (Gunakan versi CDN via `<script src="https://cdn.tailwindcss.com"></script>` agar praktis tanpa proses build, karena fokus utama ada di backend/Docker).
> * Vanilla JavaScript (untuk interaksi DOM dan Fetch API ke GraphQL).
> * Font Awesome / Heroicons (via CDN untuk ikon).
> 
> 
> **Design Philosophy (Modern & Simple):**
> * **Clean & Minimalist:** Gunakan *whitespace* (padding/margin) yang lega. Hindari elemen visual yang bertumpuk atau ramai.
> * **Soft & Friendly:** Gunakan sudut melengkung (`rounded-xl` atau `rounded-2xl`) pada card dan button.
> * **Depth:** Gunakan bayangan halus (`shadow-sm` atau `shadow-md`) untuk membedakan elemen dari latar belakang.
> 
> 
> **Global Design Tokens (Tailwind Configuration):**
> Anda wajib mengikuti panduan gaya berikut untuk setiap elemen yang di-generate:
> **1. Typography:**
> * Font: 'Inter' atau sistem sans-serif default (`font-sans`).
> * Heading: Gunakan *font-weight* tebal (`font-bold` atau `font-extrabold`) dengan warna teks gelap pekat (`text-slate-900`).
> * Body/Paragraph: Gunakan warna teks yang lebih lembut (`text-slate-600` atau `text-slate-500`) untuk *readability*.
> 
> 
> **2. Color Palette:**
> * **Background:** Sangat terang/bersih. Gunakan `bg-slate-50` atau `bg-gray-50` untuk body dasar.
> * **Surface/Cards:** Putih murni (`bg-white`) agar kontras dengan background.
> * **Primary Brand:** Gunakan warna Indigo atau Blue (`bg-indigo-600`, hover: `bg-indigo-700`) untuk *Call to Action* utama (tombol Save, Add, dll).
> * **Secondary:** Abu-abu terang (`bg-slate-100`, hover: `bg-slate-200`, text: `text-slate-700`) untuk tombol batal, filter, atau folder.
> * **Status/Semantic:** >     * Success/Approved: Emerald (`text-emerald-600`, `bg-emerald-100`)
> * Pending/Review: Amber (`text-amber-600`, `bg-amber-100`)
> * Danger/Delete: Rose (`text-rose-600`, `bg-rose-100`)
> 
> 
> 
> 
> **3. UI Components Rules:**
> * **Layouting:** Gunakan CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) untuk menampilkan daftar Cafe. Gunakan Flexbox untuk navigasi dan penyelarasan elemen dalam card.
> * **Cafe Cards:** Harus berisi slot gambar (`object-cover`, rasio 16:9), Nama Cafe, Rating (icon bintang kuning `text-yellow-400`), alamat singkat (1-2 baris dengan `line-clamp`), dan tombol aksi kecil (Edit/Delete).
> * **Forms & Inputs:** Input text, textarea, dan select harus memiliki border abu-abu terang (`border-slate-300`), rounded (`rounded-lg`), dan *focus state* yang jelas (`focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`).
> * **Modals:** Gunakan desain modal dengan *overlay backdrop blur* (`backdrop-blur-sm bg-black/30`), posisikan tepat di tengah layar (`fixed inset-0 flex items-center justify-center`).
> 
> 
> **Output Requirements:**
> * Setiap kali saya meminta Anda membuat halaman (misalnya: "Buatkan halaman list cafe"), berikan kode HTML lengkap dari `<!DOCTYPE html>` hingga tag penutup, beserta script Tailwind CDN-nya.
> * Berikan tempat (komentar HTML/JS) yang jelas di bagian `<script>` untuk saya menaruh fungsi pemanggilan *GraphQL Mutation/Query*.
> * Gunakan data *dummy* (placeholder) yang realistis di dalam HTML agar saya bisa melihat tampilan akhirnya sebelum diintegrasikan dengan database.
> 
> 

---

### 💡 Tips Implementasi untuk Tugas Besar:

1. **Setup File:** Buat satu file `index.html` (sebagai dashboard utama/list cafe) dan buat UI-nya terlebih dahulu menggunakan prompt di atas.
2. **GraphQL Scripting:** Di dalam file HTML tersebut, gunakan `fetch` API biasa untuk memanggil endpoint GraphQL. Struktur dasar *fetch* Vanilla JS untuk GraphQL di client HTML Anda akan terlihat seperti ini:
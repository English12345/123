# Belajar Kata — Versi Statis (Tanpa Server)

Versi ini **tidak butuh Node.js atau server apapun**. Tinggal buka lewat browser atau upload ke GitHub Pages, langsung jalan. Cocok untuk dijual sebagai 1 akun bersama (1 username & password).

---

## 1. Cara Pakai di Komputer Sendiri

Karena browser modern tidak mengizinkan `fetch()` file JSON langsung dari `file://`, aplikasi ini perlu dibuka lewat "server lokal super ringan" — bukan Node.js, cukup 1 baris perintah bawaan sistem operasi:

**Windows / Mac / Linux (kalau Python sudah terpasang, biasanya sudah ada bawaan):**
```bash
cd english-kids-static
python3 -m http.server 8080
```
Lalu buka `http://localhost:8080` di browser.

**Alternatif termudah:** pakai ekstensi **"Live Server"** di VS Code — klik kanan `index.html` → "Open with Live Server".

> Setelah di-upload ke GitHub Pages (lihat langkah di bawah), langkah "server lokal" ini **tidak diperlukan lagi** — pengunjung tinggal buka link-nya langsung.

---

## 2. Cara Upload ke GitHub Pages (Gratis)

1. Buat repository baru di GitHub, upload seluruh isi folder `english-kids-static/` ke repo tersebut.
2. Masuk ke **Settings → Pages**.
3. Di bagian "Source", pilih branch `main` dan folder `/root`, lalu Save.
4. Tunggu 1-2 menit, GitHub akan memberi link seperti:
   `https://namauser.github.io/nama-repo/`
5. Bagikan link itu ke pembeli beserta username & password.

---

## 3. Login

Login diatur di **satu file saja**: `js/config.js`

```js
const AKUN_VALID = {
  username: "belajar",
  password: "belajar123"
};
```

Ganti nilainya sesuai keinginan Bapak/Ibu, simpan, lalu upload ulang. Karena aplikasi berjalan sepenuhnya di browser (tanpa server), login ini berfungsi sebagai **pintu masuk** (orang harus tahu username & password dulu) — bukan enkripsi tingkat bank. Ini sudah cukup untuk model "1 akun dibagikan ke pembeli", tapi bukan untuk menyimpan data rahasia/sensitif.

Setelah berhasil login, status "sudah masuk" disimpan di perangkat itu sendiri (`localStorage`) sehingga tidak perlu login ulang setiap buka aplikasi — sampai pengguna menekan tombol "Keluar".

---

## 4. Struktur Folder

```
english-kids-static/
├── index.html              ← Halaman login
├── dashboard.html          ← Daftar kelompok kata
├── flashcard.html          ← Mode belajar kartu
├── quiz.html                ← Mode kuis/recall
├── css/style.css
├── js/
│   ├── config.js            ← UBAH USERNAME/PASSWORD DI SINI
│   ├── auth.js
│   ├── shared.js
│   ├── dashboard.js
│   ├── flashcard.js
│   └── quiz.js
└── data/
    ├── manifest.json        ← DAFTAR KATEGORI YANG AKTIF
    └── categories/
        ├── warna.json
        ├── buah.json
        ├── hewan.json
        ├── hewan-laut.json
        ├── angka.json
        └── _template.json   ← Contoh untuk kategori baru
```

---

## 5. Cara Menambah Kelompok Kata Baru

Karena tanpa server, aplikasi tidak bisa otomatis "mengintip" folder sendiri. Jadi prosesnya 2 langkah kecil:

**Langkah A — Buat file kategorinya**
1. Copy `data/categories/_template.json`
2. Ganti nama file, contoh: `alat-transportasi.json`
3. Isi datanya:
```json
{
  "id": "alat-transportasi",
  "nama": "Alat Transportasi",
  "iconEmoji": "🚗",
  "warnaTema": "#2EC4B6",
  "urutan": 6,
  "kata": [
    { "en": "Car",  "id": "Mobil", "emoji": "🚗" },
    { "en": "Bus",  "id": "Bis",   "emoji": "🚌" },
    { "en": "Train","id": "Kereta","emoji": "🚆" },
    { "en": "Plane","id": "Pesawat","emoji": "✈️" }
  ]
}
```
Minimal 4 kata per kategori (supaya mode Kuis bisa jalan).

**Langkah B — Daftarkan di manifest**
Buka `data/manifest.json`, tambahkan nama file (tanpa `.json`) ke daftar `aktif`:
```json
{
  "aktif": [
    "warna",
    "buah",
    "hewan",
    "hewan-laut",
    "angka",
    "alat-transportasi"
  ]
}
```

Simpan kedua file, upload ke GitHub (atau replace di folder lokal) — menu baru langsung muncul di dashboard. Tidak perlu sentuh file HTML/JS lain sama sekali.

---

## 6. Suara Pengucapan

Aplikasi otomatis mengucapkan kata Inggris pakai suara bawaan browser (Web Speech API) — **tidak perlu upload file audio sama sekali**. Berfungsi di HP maupun laptop (Chrome, Safari, Edge semua mendukung).

Kalau nanti mau pakai gambar foto asli (bukan emoji), simpan gambar di folder baru misal `assets/images/`, lalu isi field `"gambar": "assets/images/nama-file.png"` di data kata — beri tahu saya kalau mau saya siapkan penyesuaian tampilannya.

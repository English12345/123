// ============================================================
// SERVICE WORKER — Belajar Kata
// ============================================================
// GANTI ANGKA INI SETIAP KALI KAMU UPDATE FILE (kosakata, kategori baru,
// HTML/CSS/JS). Ini "kunci" yang memberitahu HP: ada versi baru, download ulang.
const CACHE_VERSION = "v1.0.1";
const APP_CACHE = `belajar-kata-app-${CACHE_VERSION}`;
const AUDIO_CACHE = "belajar-kata-audio"; // audio tidak pernah berubah, cache terpisah & permanen

// File inti aplikasi (halaman, style, logic, dan SEMUA file kategori saat ini)
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./flashcard.html",
  "./quiz.html",
  "./manifest.json",
  "./css/style.css",
  "./js/config.js",
  "./js/shared.js",
  "./js/auth.js",
  "./js/dashboard.js",
  "./js/flashcard.js",
  "./js/quiz.js",
  "./js/sound.js",
  "./kosakata.json",
  "./data/manifest.json",
  "./data/categories/aksesoris.json",
  "./data/categories/alat-berkemah.json",
  "./data/categories/alat-kebersihan.json",
  "./data/categories/alat-musik.json",
  "./data/categories/alat-musik-tradisional.json",
  "./data/categories/alat-olahraga.json",
  "./data/categories/alat-pertukangan.json",
  "./data/categories/alat-transportasi.json",
  "./data/categories/anggota-keluarga.json",
  "./data/categories/anggota-tubuh.json",
  "./data/categories/angka.json",
  "./data/categories/bagian-mobil.json",
  "./data/categories/bagian-rumah.json",
  "./data/categories/bangun-ruang.json",
  "./data/categories/benda-langit.json",
  "./data/categories/bentang-alam.json",
  "./data/categories/bentuk.json",
  "./data/categories/buah.json",
  "./data/categories/bulan.json",
  "./data/categories/bumbu-dapur.json",
  "./data/categories/burung.json",
  "./data/categories/cuaca.json",
  "./data/categories/elektronik.json",
  "./data/categories/fenomena-alam.json",
  "./data/categories/hari.json",
  "./data/categories/hari-raya.json",
  "./data/categories/hewan.json",
  "./data/categories/hewan-laut.json",
  "./data/categories/kebun-tanaman.json",
  "./data/categories/kendaraan-konstruksi.json",
  "./data/categories/kendaraan-tradisional.json",
  "./data/categories/kerajinan-tangan.json",
  "./data/categories/mainan.json",
  "./data/categories/makanan-minuman.json",
  "./data/categories/olahraga.json",
  "./data/categories/pakaian.json",
  "./data/categories/pakaian-adat.json",
  "./data/categories/pekerjaan.json",
  "./data/categories/peralatan-bayi.json",
  "./data/categories/peralatan-dapur.json",
  "./data/categories/peralatan-kantor.json",
  "./data/categories/peralatan-mandi.json",
  "./data/categories/peralatan-medis.json",
  "./data/categories/peralatan-pantai.json",
  "./data/categories/peralatan-pertanian.json",
  "./data/categories/peralatan-renang.json",
  "./data/categories/peralatan-sekolah.json",
  "./data/categories/perasaan.json",
  "./data/categories/reptil-amfibi.json",
  "./data/categories/ruangan-rumah.json",
  "./data/categories/sayuran.json",
  "./data/categories/serangga.json",
  "./data/categories/tempat.json",
  "./data/categories/waktu-harian.json",
  "./data/categories/warna.json"
];

// Domain yang TIDAK BOLEH disentuh sama sekali oleh service worker.
// npoint.io dipakai untuk device-lock (harus selalu real-time, tidak boleh
// pernah dijawab dari cache, walau lagi offline).
const JANGAN_DICACHE = ["api.npoint.io"];

// ---------- INSTALL: download semua file inti ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) =>
      // addAll akan gagal total kalau SATU saja file 404 — pakai cara aman:
      // coba satu-satu, lewati yang gagal, supaya install tidak batal semua.
      Promise.allSettled(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn("Gagal cache:", url, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// ---------- ACTIVATE: buang cache app versi lama (audio tetap disimpan) ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_CACHE && key !== AUDIO_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------- FETCH: strategi beda per jenis file ----------
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) Jangan sentuh sama sekali request ke domain terlarang (npoint.io)
  //    atau request non-GET (POST device-lock) — biarkan browser yang urus.
  if (JANGAN_DICACHE.some((domain) => url.hostname.includes(domain))) return;
  if (req.method !== "GET") return;

  // 2) Request lintas-domain lain (misal font/CDN) — biarkan default browser.
  if (url.origin !== self.location.origin) return;

  // 3) File audio (mp3) — cache-first & permanen (isinya tidak pernah berubah,
  //    jadi begitu pernah didengar sekali, langsung tersimpan offline).
  if (url.pathname.endsWith(".mp3")) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // 4) File data JSON (kosakata, kategori, manifest) — network-first, supaya
  //    kategori/kata baru langsung kepakai kalau online; fallback ke cache
  //    kalau offline.
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(APP_CACHE).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  // 5) Sisanya (html/css/js) — cache-first biar app kebuka instan, lalu
  //    perbarui cache di belakang layar untuk kunjungan berikutnya.
  // ignoreSearch: true supaya "flashcard.html?kategori=buah" atau
  // "js/config.js?v=2" tetap ketemu cache-nya yang disimpan tanpa ekor "?..."
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const jaringan = fetch(req)
        .then((res) => {
          if (res.ok) caches.open(APP_CACHE).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || jaringan;
    })
  );
});

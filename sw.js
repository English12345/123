// ============================================================
// SERVICE WORKER — Belajar Kata
// ============================================================
// GANTI ANGKA INI SETIAP KALI KAMU UPDATE FILE (kategori baru, kata baru,
// HTML/CSS/JS). Ini "kunci" yang memberitahu HP: ada versi baru, download ulang.
const CACHE_VERSION = "v1.1.1";
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
  "./install.js",
  "./css/style.css",
  "./js/config.js",
  "./js/shared.js",
  "./js/auth.js",
  "./js/dashboard.js",
  "./js/flashcard.js",
  "./js/quiz.js",
  "./js/sound.js",
  "./data/manifest.json",
  "./data/categories/aksesoris.json",
  "./data/categories/aksesoris-lanjutan.json",
  "./data/categories/alat-berkebun.json",
  "./data/categories/alat-berkemah.json",
  "./data/categories/alat-dapur-elektronik.json",
  "./data/categories/alat-kebersihan.json",
  "./data/categories/alat-musik.json",
  "./data/categories/alat-musik-tradisional.json",
  "./data/categories/alat-olahraga.json",
  "./data/categories/alat-pertukangan.json",
  "./data/categories/alat-transportasi.json",
  "./data/categories/alat-tulis.json",
  "./data/categories/anggota-keluarga.json",
  "./data/categories/anggota-tubuh.json",
  "./data/categories/angka.json",
  "./data/categories/arah-posisi.json",
  "./data/categories/bagian-komputer.json",
  "./data/categories/bagian-mobil.json",
  "./data/categories/bagian-rumah.json",
  "./data/categories/bagian-tumbuhan.json",
  "./data/categories/bagian-wajah.json",
  "./data/categories/bahan-bangunan.json",
  "./data/categories/bahan-makanan-pokok.json",
  "./data/categories/bahan-pakaian.json",
  "./data/categories/bahasa.json",
  "./data/categories/bangun-ruang.json",
  "./data/categories/bangunan-terkenal.json",
  "./data/categories/benda-langit.json",
  "./data/categories/bentang-alam.json",
  "./data/categories/bentuk.json",
  "./data/categories/buah.json",
  "./data/categories/buah-eksotis.json",
  "./data/categories/bulan.json",
  "./data/categories/bumbu-dapur.json",
  "./data/categories/bunga.json",
  "./data/categories/burung.json",
  "./data/categories/cuaca.json",
  "./data/categories/cuaca-lanjutan.json",
  "./data/categories/dinosaurus.json",
  "./data/categories/ekspresi-wajah.json",
  "./data/categories/elektronik.json",
  "./data/categories/emosi-lanjutan.json",
  "./data/categories/fenomena-alam.json",
  "./data/categories/furnitur.json",
  "./data/categories/gawai-teknologi.json",
  "./data/categories/gaya-tari.json",
  "./data/categories/genre-musik.json",
  "./data/categories/geografi.json",
  "./data/categories/gerakan-tubuh.json",
  "./data/categories/hari.json",
  "./data/categories/hari-raya.json",
  "./data/categories/hewan.json",
  "./data/categories/hewan-air-tawar.json",
  "./data/categories/hewan-gurun.json",
  "./data/categories/hewan-hutan.json",
  "./data/categories/hewan-kutub.json",
  "./data/categories/hewan-laut.json",
  "./data/categories/istilah-cuaca-alam.json",
  "./data/categories/istilah-fotografi-seni.json",
  "./data/categories/istilah-game.json",
  "./data/categories/istilah-matematika.json",
  "./data/categories/kacang-bijian.json",
  "./data/categories/kata-kerja-belajar.json",
  "./data/categories/kata-kerja-harian.json",
  "./data/categories/kata-kerja-perasaan.json",
  "./data/categories/kata-kerja-sosial.json",
  "./data/categories/kata-kerja-tambahan.json",
  "./data/categories/kata-sifat-rasa.json",
  "./data/categories/kata-sifat-ukuran.json",
  "./data/categories/kebun-tanaman.json",
  "./data/categories/kendaraan-air-udara.json",
  "./data/categories/kendaraan-berat.json",
  "./data/categories/kendaraan-konstruksi.json",
  "./data/categories/kendaraan-tradisional.json",
  "./data/categories/kerajinan-tangan.json",
  "./data/categories/keterangan-waktu.json",
  "./data/categories/luar-angkasa-lanjutan.json",
  "./data/categories/mainan.json",
  "./data/categories/makanan-cepat-saji.json",
  "./data/categories/makanan-minuman.json",
  "./data/categories/makanan-penutup.json",
  "./data/categories/makhluk-mitos.json",
  "./data/categories/musim.json",
  "./data/categories/negara.json",
  "./data/categories/olahraga.json",
  "./data/categories/organ-tubuh.json",
  "./data/categories/pakaian.json",
  "./data/categories/pakaian-adat.json",
  "./data/categories/pakaian-lanjutan.json",
  "./data/categories/pekerjaan.json",
  "./data/categories/pekerjaan-tradisional.json",
  "./data/categories/perabotan-kamar.json",
  "./data/categories/peralatan-bayi.json",
  "./data/categories/peralatan-dapur.json",
  "./data/categories/peralatan-kantor.json",
  "./data/categories/peralatan-makan.json",
  "./data/categories/peralatan-mandi.json",
  "./data/categories/peralatan-medis.json",
  "./data/categories/peralatan-musik-tambahan.json",
  "./data/categories/peralatan-musim-dingin.json",
  "./data/categories/peralatan-pantai.json",
  "./data/categories/peralatan-pemadam.json",
  "./data/categories/peralatan-pertanian.json",
  "./data/categories/peralatan-renang.json",
  "./data/categories/peralatan-sekolah.json",
  "./data/categories/perasaan.json",
  "./data/categories/perlengkapan-hewan.json",
  "./data/categories/permainan-papan.json",
  "./data/categories/pohon.json",
  "./data/categories/pola-motif.json",
  "./data/categories/produk-susu.json",
  "./data/categories/profesi-modern.json",
  "./data/categories/reptil-amfibi.json",
  "./data/categories/ruangan-rumah.json",
  "./data/categories/sarapan.json",
  "./data/categories/satuan-ukur.json",
  "./data/categories/sayuran.json",
  "./data/categories/sayuran-lainnya.json",
  "./data/categories/serangga.json",
  "./data/categories/tempat.json",
  "./data/categories/tempat-umum.json",
  "./data/categories/waktu-harian.json",
  "./data/categories/warna.json",
  "./data/categories/warna-corak-lanjutan.json"
];

// Domain yang TIDAK BOLEH disentuh sama sekali oleh service worker.
// npoint.io dipakai untuk device-lock (harus selalu real-time, tidak boleh
// pernah dijawab dari cache, walau lagi offline).
const JANGAN_DICACHE = ["api.npoint.io"];

// File audio yang isinya TIDAK PERNAH berubah (musik latar) — sengaja
// dipisah dari CORE_ASSETS dan dicache langsung ke AUDIO_CACHE (permanen,
// tidak pernah ikut terhapus tiap CACHE_VERSION naik). Kalau ini digabung
// ke CORE_ASSETS/APP_CACHE, musik ini akan didownload ulang dari awal
// SETIAP kali ada update kode, padahal isinya sama terus.
const AUDIO_TETAP = ["./audio/musik-latar.mp3"];

// ---------- INSTALL: download semua file inti ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(APP_CACHE).then((cache) =>
        // addAll akan gagal total kalau SATU saja file 404 — pakai cara aman:
        // coba satu-satu, lewati yang gagal, supaya install tidak batal semua.
        Promise.allSettled(
          CORE_ASSETS.map((url) =>
            cache.add(url).catch((err) => console.warn("Gagal cache:", url, err))
          )
        )
      ),
      caches.open(AUDIO_CACHE).then((cache) =>
        Promise.allSettled(
          AUDIO_TETAP.map((url) =>
            cache.add(url).catch((err) => console.warn("Gagal cache audio tetap:", url, err))
          )
        )
      )
    ])
  );
  // TIDAK skipWaiting() di sini secara otomatis — versi baru ini sengaja
  // "menunggu" (state: waiting) supaya banner "Versi baru tersedia" tetap
  // tampil sampai pengguna sendiri yang klik tombol Update.
});

// Diminta oleh install.js (lewat tombol "Update") untuk benar-benar
// mengaktifkan versi baru yang sedang menunggu.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
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

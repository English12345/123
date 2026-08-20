// Dipakai di semua halaman setelah login (dashboard, flashcard, quiz).

function pastikanLogin() {
  const sudahLogin = localStorage.getItem('sudahLogin') === 'ya';
  if (!sudahLogin) {
    window.location.href = 'index.html';
    return null;
  }
  const namaEl = document.getElementById('namaPengguna');
  if (namaEl) namaEl.textContent = localStorage.getItem('namaPengguna') || 'Pengguna';
  perbaruiStreakHarian();
  return { nama: localStorage.getItem('namaPengguna') };
}

// ============================================================
// TRANSISI HALAMAN — fade halus antar halaman supaya terasa
// seperti aplikasi native, bukan reload web biasa.
// ============================================================
function pasangTransisiHalaman() {
  requestAnimationFrame(() => document.body.classList.add('halaman-siap'));

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || a.target === '_blank') return;
    if (!href.endsWith('.html') && !href.includes('.html?')) return;

    e.preventDefault();
    document.body.classList.add('halaman-keluar');
    setTimeout(() => { window.location.href = href; }, 170);
  });
}
document.addEventListener('DOMContentLoaded', pasangTransisiHalaman);

// ============================================================
// STREAK HARIAN — hitung berapa hari berturut-turut pengguna
// membuka aplikasi (dashboard/flashcard/quiz), per akun.
// ============================================================
function kunciStreak() {
  const username = localStorage.getItem('namaPengguna') || 'tamu';
  return `streakBelajarKata_${username}`;
}

function perbaruiStreakHarian() {
  const kunci = kunciStreak();
  const hariIni = new Date().toISOString().slice(0, 10);
  let data;
  try {
    data = JSON.parse(localStorage.getItem(kunci)) || { jumlahHari: 0, tanggalTerakhir: null };
  } catch (err) {
    data = { jumlahHari: 0, tanggalTerakhir: null };
  }

  if (data.tanggalTerakhir === hariIni) return data; // sudah tercatat hari ini

  const kemarin = new Date();
  kemarin.setDate(kemarin.getDate() - 1);
  const strKemarin = kemarin.toISOString().slice(0, 10);

  data.jumlahHari = (data.tanggalTerakhir === strKemarin) ? data.jumlahHari + 1 : 1;
  data.tanggalTerakhir = hariIni;
  localStorage.setItem(kunci, JSON.stringify(data));
  return data;
}

function ambilStreakSaatIni() {
  try {
    const data = JSON.parse(localStorage.getItem(kunciStreak()));
    return data ? data.jumlahHari : 0;
  } catch (err) {
    return 0;
  }
}

// ============================================================
// LENCANA PENCAPAIAN — dipakai di dashboard untuk kartu kategori.
// ============================================================
function tentukanLencana(persenHafal) {
  if (persenHafal >= 100) return { emoji: '🥇', label: 'Tuntas' };
  if (persenHafal >= 70) return { emoji: '🥈', label: 'Hampir' };
  if (persenHafal >= 30) return { emoji: '🥉', label: 'Mulai' };
  return null;
}

// ============================================================
// LEVEL & MASKOT — burung hantu (mengikuti logo app) yang "tumbuh"
// sesuai jumlah kata yang sudah dikuasai (hafal) di seluruh kategori.
// ============================================================
const LEVEL_TIERS = [
  { min: 0,    emoji: '🥚', judul: 'Telur Ajaib',        gelar: 'Baru Mulai' },
  { min: 15,   emoji: '🐣', judul: 'Anak Burung',        gelar: 'Pembelajar Pemula' },
  { min: 35,   emoji: '🐤', judul: 'Burung Kecil',       gelar: 'Rajin Belajar' },
  { min: 65,   emoji: '🦉', judul: 'Burung Hantu Muda',  gelar: 'Pintar Kata' },
  { min: 105,  emoji: '🦜', judul: 'Burung Cerdas',      gelar: 'Jago Bahasa' },
  { min: 165,  emoji: '🦅', judul: 'Elang Kata',         gelar: 'Master Vocabulary' },
  { min: 250,  emoji: '👑', judul: 'Raja Kata',          gelar: 'Juara Sejati' },
  { min: 375,  emoji: '🌟', judul: 'Bintang Belajar',    gelar: 'Bintang Kelas' },
  { min: 550,  emoji: '🏆', judul: 'Juara Vocabulary',   gelar: 'Sang Juara' },
  { min: 800,  emoji: '🦄', judul: 'Legenda Kata',       gelar: 'Legenda Belajar' },
];

function hitungLevel(totalHafal) {
  let tierIndex = 0;
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (totalHafal >= LEVEL_TIERS[i].min) tierIndex = i;
  }
  const tier = LEVEL_TIERS[tierIndex];
  const tierBerikut = LEVEL_TIERS[tierIndex + 1] || null;
  const persenKeBerikut = tierBerikut
    ? Math.round(((totalHafal - tier.min) / (tierBerikut.min - tier.min)) * 100)
    : 100;

  return {
    level: tierIndex + 1,
    emoji: tier.emoji,
    judul: tier.judul,
    gelar: tier.gelar,
    totalHafal,
    tierBerikut,
    sisaKeBerikut: tierBerikut ? tierBerikut.min - totalHafal : 0,
    persenKeBerikut: Math.max(0, Math.min(100, persenKeBerikut)),
    levelMaks: tierIndex === LEVEL_TIERS.length - 1
  };
}

// ============================================================
// STATISTIK PER KATA — dasar untuk latihan "kata tersulit"
// (semacam spaced repetition ringan): catat tiap kali kata dijawab
// benar/salah di kuis, supaya kata yang sering salah bisa dilatih
// ulang secara terfokus lintas kategori.
// ============================================================
function kunciKataStats() {
  const username = localStorage.getItem('namaPengguna') || 'tamu';
  return `kataStatsBelajarKata_${username}`;
}

function ambilSemuaKataStats() {
  try {
    const mentah = localStorage.getItem(kunciKataStats());
    return mentah ? JSON.parse(mentah) : {};
  } catch (err) {
    return {};
  }
}

function catatStatistikKata(kategoriId, kataEn, benar) {
  const semua = ambilSemuaKataStats();
  const kunci = `${kategoriId}::${kataEn}`;
  const entri = semua[kunci] || { benar: 0, salah: 0 };
  if (benar) entri.benar++; else entri.salah++;
  entri.terakhir = Date.now();
  semua[kunci] = entri;
  localStorage.setItem(kunciKataStats(), JSON.stringify(semua));
}

// Ambil daftar kata paling sering salah, lintas semua kategori yang
// pernah dikerjakan. Dipakai untuk mode kuis "Kata Tersulit".
// skorKesulitan lebih tinggi = lebih perlu dilatih ulang.
function ambilDaftarKataTersulit(maks = 15) {
  const semua = ambilSemuaKataStats();
  const daftar = Object.entries(semua)
    .map(([kunci, stat]) => {
      const idxPisah = kunci.indexOf('::');
      return {
        kategoriId: kunci.slice(0, idxPisah),
        en: kunci.slice(idxPisah + 2),
        benar: stat.benar || 0,
        salah: stat.salah || 0,
        terakhir: stat.terakhir || 0,
        skorKesulitan: (stat.salah || 0) * 3 - (stat.benar || 0)
      };
    })
    .filter(x => x.salah > 0 && x.skorKesulitan > -3)
    .sort((a, b) => b.skorKesulitan - a.skorKesulitan || b.terakhir - a.terakhir);

  return daftar.slice(0, maks);
}

// ============================================================
// LEVEL KESULITAN KATEGORI — dipakai untuk filter di dashboard.
// Sebagian besar kategori dianggap "Pemula" (kata benda konkret,
// gampang dikenali anak). Kategori berisi alat/komponen yang lebih
// spesifik masuk "Menengah". Kategori berisi kata sifat, kata kerja,
// dan konsep abstrak masuk "Lanjutan".
// ============================================================
const KATEGORI_LEVEL_LANJUTAN = new Set([
  'arah-posisi', 'istilah-matematika', 'keterangan-waktu', 'kata-sifat-ukuran',
  'kata-sifat-rasa', 'kata-kerja-harian', 'kata-kerja-tambahan', 'kata-kerja-sosial',
  'kata-kerja-belajar', 'kata-kerja-perasaan', 'gerakan-tubuh', 'ekspresi-wajah',
  'emosi-lanjutan', 'perasaan', 'geografi', 'istilah-cuaca-alam', 'istilah-game',
  'pola-motif'
]);

const KATEGORI_LEVEL_MENENGAH = new Set([
  'alat-tulis', 'bagian-komputer', 'gawai-teknologi', 'alat-dapur-elektronik',
  'alat-berkebun', 'bahan-bangunan', 'bahan-pakaian', 'peralatan-kantor',
  'alat-pertukangan', 'alat-kebersihan', 'peralatan-medis', 'elektronik',
  'bagian-mobil', 'kendaraan-konstruksi', 'kendaraan-berat', 'peralatan-pertanian',
  'peralatan-renang', 'peralatan-pantai', 'alat-berkemah', 'peralatan-bayi',
  'satuan-ukur', 'perlengkapan-hewan', 'peralatan-musim-dingin',
  'luar-angkasa-lanjutan', 'kendaraan-air-udara', 'peralatan-pemadam',
  'peralatan-musik-tambahan', 'istilah-fotografi-seni', 'permainan-papan',
  'genre-musik', 'gaya-tari', 'bagian-wajah', 'bagian-tumbuhan', 'organ-tubuh',
  'bahan-makanan-pokok'
]);

function ambilLevelKategori(kategoriId) {
  if (KATEGORI_LEVEL_LANJUTAN.has(kategoriId)) return 'lanjutan';
  if (KATEGORI_LEVEL_MENENGAH.has(kategoriId)) return 'menengah';
  return 'pemula';
}

const LABEL_LEVEL = { pemula: '🌱 Pemula', menengah: '🌿 Menengah', lanjutan: '🌳 Lanjutan' };

// Berapa lama hasil cek device dianggap masih berlaku, supaya device yang
// sudah terdaftar TIDAK perlu menghubungi npoint.io di setiap login.
const DEVICE_CHECK_CACHE_JAM = 24;

// Kalau npoint.io gagal/lambat dihubungi, jangan coba lagi di setiap
// percobaan login selama jam ini — supaya saat npoint.io down, pembeli
// asli tidak ikut kena lemot berulang-ulang. Dibuat pendek supaya kalau
// npoint.io cuma bermasalah sesaat, device-lock kembali ketat secepatnya.
const DEVICE_CHECK_GAGAL_CACHE_JAM = 0.25; // 15 menit

// Batas maksimal menunggu SATU percobaan ke npoint.io sebelum dianggap
// gagal. Dinaikkan sedikit supaya npoint yang cuma lambat (bukan down)
// masih sempat dijawab dan device-lock tetap berfungsi.
const DEVICE_CHECK_TIMEOUT_MS = 4000;

function simpanCacheDeviceCheck(username, jam) {
  const kadaluarsa = Date.now() + jam * 60 * 60 * 1000;
  localStorage.setItem('deviceCheckKadaluarsa_' + username, String(kadaluarsa));
}

function cacheDeviceCheckMasihBerlaku(username) {
  const kadaluarsa = Number(localStorage.getItem('deviceCheckKadaluarsa_' + username) || 0);
  return Date.now() < kadaluarsa;
}

async function fetchDenganTimeout(url, opsi = {}, timeoutMs = DEVICE_CHECK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opsi, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Coba hubungi npoint.io sampai 2 kali sebelum benar-benar dianggap gagal.
// Ini menutup celah "gangguan sesaat" (satu request kebetulan lambat/gagal)
// supaya tidak langsung jatuh ke fail-open padahal npoint.io sebenarnya baik-baik saja.
async function fetchDenganRetry(url, opsi = {}, percobaan = 2) {
  let errorTerakhir;
  for (let i = 0; i < percobaan; i++) {
    try {
      return await fetchDenganTimeout(url, opsi);
    } catch (err) {
      errorTerakhir = err;
      if (i < percobaan - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  throw errorTerakhir;
}

// Ambil deviceId yang tersimpan di browser ini, atau buat baru kalau belum ada.
// Ini BUKAN fingerprint hardware — cuma ID acak yang disimpan di localStorage,
// jadi kalau localStorage di-clear atau ganti browser, device ini akan
// dianggap "device baru" oleh sistem.
function ambilAtauBuatDeviceId() {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('deviceId', id);
  }
  return id;
}

// Cek ke npoint.io apakah AKUN INI (bukan device secara umum) sudah
// "dikunci" ke device lain. Bin npoint.io menyimpan satu objek berisi
// data device per-username, contoh:
// { "belajar": { "deviceId": "dev-xxx" }, "belajar2": { "deviceId": null } }
//
// - Kalau device ini sudah lolos cek untuk username ini dan cache belum
//   kadaluarsa -> langsung izinkan, TANPA menghubungi npoint.io.
// - Kalau username ini belum punya device terdaftar -> daftarkan device
//   ini untuk username ini, izinkan masuk.
// - Kalau device terdaftar untuk username ini sama dengan device ini -> izinkan.
// - Kalau device terdaftar untuk username ini beda -> tolak.
// - Kalau npoint.io tidak terjangkau/lambat (>2.5 detik) -> fail-open
//   (izinkan masuk) dan cache hasil itu 1 jam.
async function cekDanKunciDevice(username) {
  const deviceIdSaya = ambilAtauBuatDeviceId();

  if (cacheDeviceCheckMasihBerlaku(username)) {
    return { ok: true, alasan: 'cache' };
  }

  try {
    const resBaca = await fetchDenganRetry(DEVICE_LOCK.npointUrl);
    if (!resBaca.ok) throw new Error('Gagal membaca status device');
    const data = await resBaca.json();
    const entriUser = data[username];

    if (!entriUser || !entriUser.deviceId) {
      // Gabungkan (bukan timpa total) supaya username lain di objek yang
      // sama tidak ikut terhapus saat kita POST ulang seluruh isi bin.
      const dataBaru = {
        ...data,
        [username]: {
          deviceId: deviceIdSaya,
          terdaftarPada: new Date().toISOString()
        }
      };

      const resDaftar = await fetchDenganRetry(DEVICE_LOCK.npointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataBaru)
      });
      if (!resDaftar.ok) throw new Error('Gagal mendaftarkan device');

      // npoint.io tidak punya "tulis hanya kalau masih kosong" (atomic
      // compare-and-swap) DAN kita menimpa seluruh isi bin setiap POST,
      // jadi ada celah kecil: device lain (untuk username sama ATAU
      // username lain) bisa saja menulis di waktu hampir bersamaan dan
      // sebagian tertimpa. Baca ulang untuk mempersempit celah itu
      // (bukan menghilangkan total — itu butuh backend dengan transaksi,
      // di luar npoint.io).
      const resVerifikasi = await fetchDenganRetry(DEVICE_LOCK.npointUrl);
      if (resVerifikasi.ok) {
        const dataVerifikasi = await resVerifikasi.json();
        const entriVerifikasi = dataVerifikasi[username];
        if (entriVerifikasi && entriVerifikasi.deviceId && entriVerifikasi.deviceId !== deviceIdSaya) {
          return { ok: false, alasan: 'device-lain' };
        }
      }

      simpanCacheDeviceCheck(username, DEVICE_CHECK_CACHE_JAM);
      return { ok: true };
    }

    if (entriUser.deviceId === deviceIdSaya) {
      simpanCacheDeviceCheck(username, DEVICE_CHECK_CACHE_JAM);
      return { ok: true };
    }

    return { ok: false, alasan: 'device-lain' };
  } catch (err) {
    console.error('Cek device-lock gagal/timeout, fail-open:', err);
    simpanCacheDeviceCheck(username, DEVICE_CHECK_GAGAL_CACHE_JAM);
    return { ok: true, alasan: 'server-tidak-terjangkau' };
  }
}

function pasangTombolLogout() {
  const btn = document.getElementById('logoutBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (typeof bunyiKlik === 'function') bunyiKlik();
    localStorage.removeItem('sudahLogin');
    localStorage.removeItem('namaPengguna');
    window.location.href = 'index.html';
  });
}

// Ucapkan kata bahasa Inggris memakai Web Speech API (tanpa perlu file audio).
//
// Catatan teknis: di banyak browser (terutama Chrome), daftar suara (voices)
// tidak langsung siap saat halaman dibuka — butuh sepersekian detik untuk
// dimuat oleh browser. Kalau kita baru mencari suara SAAT tombol diklik,
// klik pertama akan terasa "telat" atau bahkan tidak bersuara sama sekali.
// Solusinya: muat & simpan (cache) suara Inggris SEJAK AWAL halaman dibuka,
// jadi saat kartu/tombol diklik, suara sudah siap dan langsung terdengar.
let suaraInggrisTerpilih = null;

function muatCacheSuaraInggris() {
  if (!('speechSynthesis' in window)) return;
  const daftarSuara = window.speechSynthesis.getVoices();
  if (!daftarSuara.length) return;

  suaraInggrisTerpilih =
    daftarSuara.find(v => v.lang === 'en-US' && /female/i.test(v.name)) ||
    daftarSuara.find(v => v.lang === 'en-US') ||
    daftarSuara.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) ||
    daftarSuara[0];
}

if ('speechSynthesis' in window) {
  muatCacheSuaraInggris();
  window.speechSynthesis.onvoiceschanged = muatCacheSuaraInggris;
}

function ucapkanKata(teks) {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;

  // Hanya batalkan ucapan sebelumnya kalau memang masih ada yang berjalan.
  // Memanggil cancel() setiap saat (walau tidak sedang bicara) justru bisa
  // membuat browser lambat merespons klik berikutnya.
  if (synth.speaking || synth.pending) synth.cancel();
  if (synth.paused) synth.resume();

  const utter = new SpeechSynthesisUtterance(teks);
  utter.lang = 'en-US';
  utter.rate = 0.85;
  utter.pitch = 1.1;
  if (suaraInggrisTerpilih) utter.voice = suaraInggrisTerpilih;

  synth.speak(utter);
}

function ambilParam(nama) {
  return new URLSearchParams(window.location.search).get(nama);
}

// Muat daftar kategori aktif dari manifest.json, lalu ambil detail tiap file kategori.
async function muatDaftarKategori() {
  const resManifest = await fetch('data/manifest.json');
  if (!resManifest.ok) throw new Error('Gagal memuat manifest.json');
  const manifest = await resManifest.json();
  const daftarId = manifest.aktif || [];

  const semuaKategori = await Promise.all(
    daftarId.map(async (id) => {
      try {
        const res = await fetch(`data/categories/${id}.json`);
        if (!res.ok) return null;
        const data = await res.json();
        return {
          id: data.id || id,
          nama: data.nama || id,
          iconEmoji: data.iconEmoji || '📚',
          warnaTema: data.warnaTema || '#2EC4B6',
          urutan: typeof data.urutan === 'number' ? data.urutan : 999,
          jumlahKata: Array.isArray(data.kata) ? data.kata.length : 0
        };
      } catch (err) {
        console.error(`Gagal memuat kategori "${id}":`, err);
        return null;
      }
    })
  );

  return semuaKategori
    .filter(Boolean)
    .sort((a, b) => a.urutan - b.urutan || a.nama.localeCompare(b.nama));
}

// Muat detail lengkap satu kategori (termasuk daftar katanya).
async function muatDetailKategori(id) {
  const res = await fetch(`data/categories/${id}.json`);
  if (!res.ok) throw new Error('Kategori tidak ditemukan');
  return res.json();
}

// ============================================================
// PROGRESS TRACKING — kata yang sudah dikuasai & hasil kuis.
// Disimpan per akun (namaPengguna) supaya kalau HP dipakai ulang
// oleh pembeli lain, progress tidak ikut kebawa/kecampur.
// ============================================================
function kunciProgres() {
  const username = localStorage.getItem('namaPengguna') || 'tamu';
  return `progresBelajarKata_${username}`;
}

function ambilSemuaProgres() {
  try {
    const mentah = localStorage.getItem(kunciProgres());
    return mentah ? JSON.parse(mentah) : {};
  } catch (err) {
    console.error('Gagal membaca progres, mulai dari kosong:', err);
    return {};
  }
}

function simpanSemuaProgres(semuaProgres) {
  localStorage.setItem(kunciProgres(), JSON.stringify(semuaProgres));
}

// Bentuk data default untuk satu kategori kalau belum pernah disentuh.
function progresKosong() {
  return { hafal: [], kuisTerbaik: null, kuisTerakhir: null };
}

function ambilProgresKategori(kategoriId) {
  const semua = ambilSemuaProgres();
  return semua[kategoriId] || progresKosong();
}

// Tandai/batalkan satu kata sebagai "sudah hafal". Dipakai di flashcard.html.
// Mengembalikan true/false = status barunya (sudah hafal atau tidak).
function toggleKataHafal(kategoriId, kataEn) {
  const semua = ambilSemuaProgres();
  const progres = semua[kategoriId] || progresKosong();
  const sudahAda = progres.hafal.includes(kataEn);

  if (sudahAda) {
    progres.hafal = progres.hafal.filter((k) => k !== kataEn);
  } else {
    progres.hafal.push(kataEn);
  }

  semua[kategoriId] = progres;
  simpanSemuaProgres(semua);
  return !sudahAda;
}

function apakahKataHafal(kategoriId, kataEn) {
  return ambilProgresKategori(kategoriId).hafal.includes(kataEn);
}

// Simpan hasil kuis. kuisTerakhir selalu ditimpa; kuisTerbaik cuma ditimpa
// kalau persentase kali ini lebih tinggi dari rekor sebelumnya.
function simpanHasilKuis(kategoriId, skor, total) {
  const semua = ambilSemuaProgres();
  const progres = semua[kategoriId] || progresKosong();
  const persen = total > 0 ? Math.round((skor / total) * 100) : 0;
  const tanggal = new Date().toISOString().slice(0, 10);
  const hasil = { skor, total, persen, tanggal };

  progres.kuisTerakhir = hasil;
  if (!progres.kuisTerbaik || persen > progres.kuisTerbaik.persen) {
    progres.kuisTerbaik = hasil;
  }

  semua[kategoriId] = progres;
  simpanSemuaProgres(semua);
  return hasil;
}

// Ringkasan progres 1 kategori, dipakai buat badge di dashboard.html.
function ambilRingkasanKategori(kategoriId, totalKata) {
  const progres = ambilProgresKategori(kategoriId);
  return {
    jumlahHafal: progres.hafal.length,
    totalKata,
    persenHafal: totalKata > 0 ? Math.round((progres.hafal.length / totalKata) * 100) : 0,
    kuisTerbaik: progres.kuisTerbaik
  };
}

// Total kata "hafal" di SEMUA kategori sekaligus, tanpa perlu fetch tiap
// file kategori — cukup baca localStorage. Dipakai untuk hitung level global.
function hitungTotalHafalSemuaKategori() {
  const semua = ambilSemuaProgres();
  return Object.values(semua).reduce((sum, p) => sum + (p.hafal ? p.hafal.length : 0), 0);
}

document.addEventListener('DOMContentLoaded', pasangTombolLogout);

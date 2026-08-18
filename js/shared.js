// Dipakai di semua halaman setelah login (dashboard, flashcard, quiz).

function pastikanLogin() {
  const sudahLogin = localStorage.getItem('sudahLogin') === 'ya';
  if (!sudahLogin) {
    window.location.href = 'index.html';
    return null;
  }
  const namaEl = document.getElementById('namaPengguna');
  if (namaEl) namaEl.textContent = localStorage.getItem('namaPengguna') || 'Pengguna';
  return { nama: localStorage.getItem('namaPengguna') };
}

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

document.addEventListener('DOMContentLoaded', pasangTombolLogout);

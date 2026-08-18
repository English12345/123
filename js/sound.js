// Efek suara ringan untuk aplikasi ini, dibuat langsung lewat Web Audio API
// (bukan file .mp3), supaya tidak perlu asset tambahan dan tetap ringan.
let audioCtxBersama = null;
function ambilAudioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtxBersama) audioCtxBersama = new AC();
  if (audioCtxBersama.state === 'suspended') audioCtxBersama.resume();
  return audioCtxBersama;
}
function mainkanNada(freq, tunda, durasi, tipe = 'sine', volume = 0.22) {
  const ctx = ambilAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tipe;
  osc.frequency.value = freq;
  const mulai = ctx.currentTime + tunda;
  gain.gain.setValueAtTime(0.0001, mulai);
  gain.gain.exponentialRampToValueAtTime(volume, mulai + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, mulai + durasi);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(mulai);
  osc.stop(mulai + durasi + 0.02);
}
function bunyiKlik() {
  mainkanNada(880, 0, 0.07, 'triangle', 0.15);
}
function bunyiBenar() {
  const notasi = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notasi.forEach((freq, i) => mainkanNada(freq, i * 0.1, 0.22, 'triangle', 0.25));
}
function bunyiSalah() {
  const notasi = [392, 329.63]; // G4 -> E4
  notasi.forEach((freq, i) => mainkanNada(freq, i * 0.13, 0.24, 'sawtooth', 0.16));
}

// ==== Musik latar (backsound) ====
// Sumber: koleksi CC0/Public Domain di Internet Archive (lisensi bebas
// pakai komersial tanpa atribusi wajib). Kalau link ini suatu saat mati,
// paling aman ganti dengan file yang kamu host sendiri, bukan hotlink terus.
const URL_MUSIK_LATAR = 'https://archive.org/download/happy-background-music/upbeat-ukulele-kids.mp3';
let elemenMusikLatar = null;
const VOLUME_MUSIK_NORMAL = 0.12; // sengaja pelan, biar tidak menutupi voice over
const VOLUME_MUSIK_REDUP = 0.04;

function ambilMusikLatar() {
  if (!elemenMusikLatar) {
    elemenMusikLatar = new Audio(URL_MUSIK_LATAR);
    elemenMusikLatar.loop = true;
    elemenMusikLatar.volume = VOLUME_MUSIK_NORMAL;
    elemenMusikLatar.preload = 'auto';
  }
  return elemenMusikLatar;
}
// WAJIB dipanggil dari dalam event klik pengguna (bukan otomatis saat
// halaman load), karena browser blokir autoplay audio tanpa interaksi user.
function mulaiMusikLatar() {
  ambilMusikLatar().play().catch(() => {});
}
function hentikanMusikLatar() {
  if (elemenMusikLatar) elemenMusikLatar.pause();
}
// Turunkan volume musik saat voice over mulai bicara...
function redupkanMusikLatar() {
  if (elemenMusikLatar) elemenMusikLatar.volume = VOLUME_MUSIK_REDUP;
}
// ...dan kembalikan pelan setelah voice over selesai.
function pulihkanMusikLatar() {
  if (elemenMusikLatar) elemenMusikLatar.volume = VOLUME_MUSIK_NORMAL;
}

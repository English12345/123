// Efek suara ringan untuk aplikasi ini, dibuat langsung lewat Web Audio API
// (bukan file .mp3), supaya tidak perlu asset tambahan dan tetap ringan.
// Ada 3 jenis bunyi:
//  - bunyiKlik()  -> bunyi "pop" kecil tiap tombol ditekan
//  - bunyiBenar() -> jingle ceria naik, dipakai saat jawaban BENAR
//  - bunyiSalah() -> bunyi turun pendek, dipakai saat jawaban SALAH

let audioCtxBersama = null;

function ambilAudioCtx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtxBersama) audioCtxBersama = new AC();
  if (audioCtxBersama.state === 'suspended') audioCtxBersama.resume();
  return audioCtxBersama;
}

// Mainkan satu nada sederhana.
// freq: frekuensi (Hz), tunda: jeda sebelum mulai (detik), durasi: lama bunyi (detik)
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

// Bunyi "pop" kecil & lucu untuk setiap tombol yang ditekan.
function bunyiKlik() {
  mainkanNada(880, 0, 0.07, 'triangle', 0.15);
}

// Jingle ceria naik (do-mi-sol-do tinggi), kesan "hore!" khas anak-anak.
function bunyiBenar() {
  const notasi = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notasi.forEach((freq, i) => mainkanNada(freq, i * 0.1, 0.22, 'triangle', 0.25));
}

// Bunyi pendek menurun, ramah anak (bukan bunyi keras/menakutkan), untuk jawaban salah.
function bunyiSalah() {
  const notasi = [392, 329.63]; // G4 -> E4
  notasi.forEach((freq, i) => mainkanNada(freq, i * 0.13, 0.24, 'sawtooth', 0.16));
}

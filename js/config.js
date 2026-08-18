// PENGATURAN LOGIN
// Aplikasi ini berjalan murni di browser (tanpa server), jadi siapapun
// yang buka file ini secara teknis bisa lihat username/password di bawah.
// Cocok untuk "1 akun per pembeli", bukan untuk data rahasia.
const AKUN_VALID = [
  { username: "belajar01", password: "belajar431" },
  { username: "belajar02", password: "belajar254" },
  { username: "belajar03", password: "belajar504" },
  { username: "belajar04", password: "belajar766" },
  { username: "belajar05", password: "belajar149" },
  { username: "belajar06", password: "belajar174" },
  { username: "belajar07", password: "belajar940" },
  { username: "belajar08", password: "belajar648" },
  { username: "belajar09", password: "belajar196" },
  { username: "belajar10", password: "belajar474" },
  { username: "belajar11", password: "belajar696" },
  { username: "belajar12", password: "belajar159" },
  { username: "belajar13", password: "belajar619" },
  { username: "belajar14", password: "belajar319" },
  { username: "belajar15", password: "belajar138" },
  { username: "belajar16", password: "belajar188" },
  { username: "belajar17", password: "belajar544" },
  { username: "belajar18", password: "belajar528" },
  { username: "belajar19", password: "belajar171" },
  { username: "ayo", password: "belajar" },
  { username: "belajar20", password: "belajar346" }
];

// DEVICE LOCK — cek device via npoint.io (soft-lock, bisa dilewati orang
// yang niat buka DevTools). Kalau npoint.io tidak terjangkau, sistem
// fail-open (login tetap diizinkan) supaya pembeli sah tidak ikut terkunci.
const DEVICE_LOCK = {
  npointUrl: "https://api.npoint.io/ee30229b90131df1b572"
};

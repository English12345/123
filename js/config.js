// PENGATURAN LOGIN
// Aplikasi ini berjalan murni di browser (tanpa server), jadi siapapun
// yang buka file ini secara teknis bisa lihat username/password di bawah.
// Cocok untuk "1 akun per pembeli", bukan untuk data rahasia.
const AKUN_VALID = [
  { username: "me", password: "go" },
  { username: "on", password: "go" },
  { username: "to", password: "go" },
  { username: "you", password: "go" }
];

// DEVICE LOCK — cek device via npoint.io (soft-lock, bisa dilewati orang
// yang niat buka DevTools). Kalau npoint.io tidak terjangkau, sistem
// fail-open (login tetap diizinkan) supaya pembeli sah tidak ikut terkunci.
const DEVICE_LOCK = {
  npointUrl: "https://api.npoint.io/ee30229b90131df1b572"
};

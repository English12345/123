/* ============================================================
   CARA PAKAI:
   1. Taruh file ini (install.js), manifest.json, dan sw.js
      di root folder repo GitHub kamu (sejajar dengan index.html).
   2. Di index.html, tambahkan di dalam <head>:
        <link rel="manifest" href="./manifest.json">
        <meta name="theme-color" content="#3949AB">
   3. Sebelum tag </body>, tambahkan:
        <script src="./install.js"></script>
   4. Tambahkan tombol INI HANYA DI index.html:
        <button id="btnInstall" style="display:none">📲 Install Aplikasi</button>
        <div id="updateBanner" style="display:none">
          Versi baru tersedia! <button id="btnUpdate">Update Sekarang</button>
        </div>
      Halaman lain (dashboard/flashcard/quiz) TIDAK perlu elemen ini —
      script ini aman dipasang di semua halaman walau elemennya tidak ada
      (dipakai cuma untuk mendaftarkan service worker / caching offline).
   ============================================================ */

// ---------- 1. DAFTARKAN SERVICE WORKER ----------
let sedangReload = false; // jaga-jaga supaya reload cuma terjadi 1x

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      // Cek ke server apakah ada versi baru
      reg.update();

      // Kalau pas halaman ini dibuka sudah ada versi baru yang lagi
      // menunggu (misal: terdeteksi waktu di halaman lain / kunjungan
      // sebelumnya), langsung tampilkan banner-nya lagi di sini.
      if (reg.waiting) {
        tampilkanBannerUpdate();
      }

      // Versi baru terdeteksi & sudah selesai didownload -> tampilkan banner.
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            tampilkanBannerUpdate();
          }
        });
      });

      // Tombol "Update Sekarang" -> suruh SW baru aktif, baru reload
      // SETELAH benar-benar aktif (bukan reload buta).
      const btnUpdate = document.getElementById("btnUpdate");
      if (btnUpdate) {
        btnUpdate.addEventListener("click", () => {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        });
      }
    });

    // Begitu SW baru resmi mengambil alih, baru reload halaman sekali.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (sedangReload) return;
      sedangReload = true;
      window.location.reload();
    });
  });
}

function tampilkanBannerUpdate() {
  const banner = document.getElementById("updateBanner");
  if (banner) banner.style.display = "block";
}

// ---------- 2. TOMBOL INSTALL KE HOME SCREEN (Android/Chrome) ----------
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // cegah popup otomatis browser
  deferredPrompt = e;

  const btnInstall = document.getElementById("btnInstall");
  if (btnInstall) btnInstall.style.display = "inline-block";
});

const btnInstall = document.getElementById("btnInstall");
if (btnInstall) {
  btnInstall.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Hasil install:", outcome); // "accepted" atau "dismissed"
    deferredPrompt = null;
    btnInstall.style.display = "none";
  });
}

// Sembunyikan tombol install kalau app sudah ter-install
window.addEventListener("appinstalled", () => {
  const btnInstall = document.getElementById("btnInstall");
  if (btnInstall) btnInstall.style.display = "none";
});

// ---------- 3. KHUSUS iPhone/Safari (tidak support beforeinstallprompt) ----------
// Safari tidak punya tombol install otomatis, jadi tampilkan instruksi manual
function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}
function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
}
if (isIos() && !isInStandaloneMode()) {
  const iosHint = document.getElementById("iosInstallHint");
  if (iosHint) {
    iosHint.style.display = "block";
    iosHint.textContent = "Di iPhone: tekan tombol Share (⬆️) lalu pilih 'Add to Home Screen'";
  }
}

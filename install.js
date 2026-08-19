/* ============================================================
   CARA PAKAI:
   1. Taruh file ini (install.js), manifest.json, dan sw.js
      di root folder repo GitHub kamu (sejajar dengan index.html).
   2. Di index.html, tambahkan di dalam <head>:
        <link rel="manifest" href="./manifest.json">
        <meta name="theme-color" content="#3949AB">
   3. Sebelum tag </body>, tambahkan:
        <script src="./install.js"></script>
   4. Tambahkan tombol di HTML kamu, contoh:
        <button id="btnInstall" style="display:none">📲 Install Aplikasi</button>
        <div id="updateBanner" style="display:none">
          Versi baru tersedia! <button id="btnUpdate">Update Sekarang</button>
        </div>
   ============================================================ */

// ---------- 1. DAFTARKAN SERVICE WORKER ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((reg) => {
      // Cek update setiap kali halaman dibuka
      reg.update();

      // Kalau ada service worker baru yang sedang menunggu, tampilkan banner update
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            const banner = document.getElementById("updateBanner");
            if (banner) banner.style.display = "block";
          }
        });
      });
    });
  });

  // Tombol "Update Sekarang" -> reload untuk pakai versi baru
  const btnUpdate = document.getElementById("btnUpdate");
  if (btnUpdate) {
    btnUpdate.addEventListener("click", () => {
      window.location.reload();
    });
  }
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

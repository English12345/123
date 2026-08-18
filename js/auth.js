const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.classList.remove('show');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const akunCocok = AKUN_VALID.find(
    (a) => a.username === username && a.password === password
  );

  if (!akunCocok) {
    errorMsg.textContent = 'Username atau password salah.';
    errorMsg.classList.add('show');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.textContent;
    submitBtn.textContent = 'Memeriksa perangkat...';
  }

  const hasilCek = await cekDanKunciDevice(username);

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn.dataset.originalText || 'Masuk';
  }

  if (!hasilCek.ok) {
    errorMsg.textContent = 'Akun ini sedang aktif di perangkat lain. Hubungi penjual untuk reset akses.';
    errorMsg.classList.add('show');
    return;
  }

  // Simpan status login di perangkat ini supaya tidak perlu login ulang tiap buka aplikasi.
  localStorage.setItem('sudahLogin', 'ya');
  localStorage.setItem('namaPengguna', username);
  window.location.href = 'dashboard.html';
});

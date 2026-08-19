(async function initDashboard() {
  const user = pastikanLogin();
  if (!user) return;

  const grid = document.getElementById('categoryGrid');
  const statsBar = document.getElementById('statsBar');
  const emptyState = document.getElementById('emptyState');

  try {
    const kategoriList = await muatDaftarKategori();

    if (!kategoriList.length) {
      statsBar.style.display = 'none';
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    // Hitung ringkasan tiap kategori sekali saja, dipakai untuk stats bar & kartu.
    const ringkasanPerKategori = kategoriList.map(kat => ({
      kat,
      ringkasan: ambilRingkasanKategori(kat.id, kat.jumlahKata)
    }));

    // ==== Render stats bar: total kata dikuasai + streak harian ====
    const totalHafal = ringkasanPerKategori.reduce((sum, r) => sum + r.ringkasan.jumlahHafal, 0);
    const totalKata = ringkasanPerKategori.reduce((sum, r) => sum + r.kat.jumlahKata, 0);
    const streak = ambilStreakSaatIni();

    statsBar.innerHTML = `
      <div class="stat-pill">
        <div class="stat-pill-icon">⭐</div>
        <div>
          <div class="stat-pill-value">${totalHafal} / ${totalKata}</div>
          <div class="stat-pill-label">Kata dikuasai</div>
        </div>
      </div>
      <div class="stat-pill streak">
        <div class="stat-pill-icon">🔥</div>
        <div>
          <div class="stat-pill-value">${streak} hari</div>
          <div class="stat-pill-label">Belajar berturut-turut</div>
        </div>
      </div>
    `;

    // ==== Render kartu kategori: progress bar visual + lencana pencapaian ====
    grid.innerHTML = ringkasanPerKategori.map(({ kat, ringkasan }) => {
      const infoKuis = ringkasan.kuisTerbaik ? ` · 🧠 ${ringkasan.kuisTerbaik.persen}%` : '';
      const lencana = tentukanLencana(ringkasan.persenHafal);
      const badgeHtml = lencana ? `<div class="achievement-badge" title="${lencana.label}">${lencana.emoji}</div>` : '';

      return `
      <div class="category-card" style="--accent: ${kat.warnaTema}">
        ${badgeHtml}
        <div class="category-icon">${kat.iconEmoji}</div>
        <h3>${kat.nama}</h3>
        <div class="category-meta">${kat.jumlahKata} kata</div>
        <div class="mini-progress-track">
          <div class="mini-progress-fill" style="width: ${ringkasan.persenHafal}%"></div>
        </div>
        <div class="category-progress">⭐ ${ringkasan.jumlahHafal}/${kat.jumlahKata} dikuasai${infoKuis}</div>
        <div class="category-cta">
          <a class="chip-btn learn" href="flashcard.html?kategori=${encodeURIComponent(kat.id)}">Belajar</a>
          <a class="chip-btn quiz" href="quiz.html?kategori=${encodeURIComponent(kat.id)}">Kuis</a>
        </div>
      </div>
    `;
    }).join('');
  } catch (err) {
    statsBar.style.display = 'none';
    grid.innerHTML = '';
    emptyState.textContent = 'Gagal memuat daftar kategori. Coba muat ulang halaman.';
    emptyState.style.display = 'block';
  }
})();

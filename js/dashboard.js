(async function initDashboard() {
  const user = pastikanLogin();
  if (!user) return;

  const grid = document.getElementById('categoryGrid');
  const emptyState = document.getElementById('emptyState');

  try {
    const kategoriList = await muatDaftarKategori();

    if (!kategoriList.length) {
      emptyState.style.display = 'block';
      return;
    }

    grid.innerHTML = kategoriList.map(kat => {
      const ringkasan = ambilRingkasanKategori(kat.id, kat.jumlahKata);
      const infoKuis = ringkasan.kuisTerbaik ? ` · 🧠 ${ringkasan.kuisTerbaik.persen}%` : '';
      return `
      <div class="category-card" style="--accent: ${kat.warnaTema}">
        <div class="category-icon">${kat.iconEmoji}</div>
        <h3>${kat.nama}</h3>
        <div class="category-meta">${kat.jumlahKata} kata</div>
        <div class="category-progress">⭐ ${ringkasan.jumlahHafal}/${kat.jumlahKata} dikuasai${infoKuis}</div>
        <div class="category-cta">
          <a class="chip-btn learn" href="flashcard.html?kategori=${encodeURIComponent(kat.id)}">Belajar</a>
          <a class="chip-btn quiz" href="quiz.html?kategori=${encodeURIComponent(kat.id)}">Kuis</a>
        </div>
      </div>
    `;
    }).join('');
  } catch (err) {
    emptyState.textContent = 'Gagal memuat daftar kategori. Coba muat ulang halaman.';
    emptyState.style.display = 'block';
  }
})();

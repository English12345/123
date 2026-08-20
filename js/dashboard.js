(async function initDashboard() {
  const user = pastikanLogin();
  if (!user) return;

  const grid = document.getElementById('categoryGrid');
  const statsBar = document.getElementById('statsBar');
  const emptyState = document.getElementById('emptyState');
  const noResultState = document.getElementById('noResultState');
  const levelCard = document.getElementById('levelCard');
  const tersulitCard = document.getElementById('tersulitCard');
  const searchInput = document.getElementById('searchInput');
  const filterChips = document.getElementById('filterChips');

  let ringkasanPerKategori = [];
  let filterLevelAktif = 'semua';

  function renderGrid() {
    const kataKunci = searchInput.value.trim().toLowerCase();

    const hasilFilter = ringkasanPerKategori.filter(({ kat, level }) => {
      const cocokLevel = filterLevelAktif === 'semua' || level === filterLevelAktif;
      const cocokCari = !kataKunci || kat.nama.toLowerCase().includes(kataKunci);
      return cocokLevel && cocokCari;
    });

    if (!hasilFilter.length) {
      grid.innerHTML = '';
      noResultState.style.display = 'block';
      return;
    }
    noResultState.style.display = 'none';

    grid.innerHTML = hasilFilter.map(({ kat, ringkasan }) => {
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
  }

  try {
    const kategoriList = await muatDaftarKategori();

    if (!kategoriList.length) {
      statsBar.style.display = 'none';
      levelCard.style.display = 'none';
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    ringkasanPerKategori = kategoriList.map(kat => ({
      kat,
      level: ambilLevelKategori(kat.id),
      ringkasan: ambilRingkasanKategori(kat.id, kat.jumlahKata)
    }));

    // ==== Level & maskot (dihitung dari total kata dikuasai lintas kategori) ====
    const totalHafal = ringkasanPerKategori.reduce((sum, r) => sum + r.ringkasan.jumlahHafal, 0);
    const totalKata = ringkasanPerKategori.reduce((sum, r) => sum + r.kat.jumlahKata, 0);
    const lv = hitungLevel(totalHafal);

    levelCard.innerHTML = `
      <div class="level-mascot">${lv.emoji}</div>
      <div class="level-info">
        <div class="level-title">Level ${lv.level}: ${lv.judul}</div>
        <div class="level-gelar">${lv.gelar}</div>
        <div class="level-progress-track">
          <div class="level-progress-fill" style="width: ${lv.persenKeBerikut}%"></div>
        </div>
        <div class="level-progress-label">
          ${lv.levelMaks
            ? 'Level tertinggi tercapai! 🎊'
            : `${lv.sisaKeBerikut} kata lagi menuju ${lv.tierBerikut.judul} ${lv.tierBerikut.emoji}`}
        </div>
      </div>
    `;

    // ==== Stats bar: total kata dikuasai + streak harian ====
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

    // ==== Kartu ajakan latihan "Kata Tersulit" (spaced repetition ringan) ====
    const kataTersulit = ambilDaftarKataTersulit(30);
    if (kataTersulit.length >= 4) {
      tersulitCard.style.display = 'flex';
      tersulitCard.innerHTML = `
        <div class="tersulit-icon">🔁</div>
        <div class="tersulit-text">
          <div class="tersulit-title">Latihan Kata Tersulit</div>
          <div class="tersulit-sub">${kataTersulit.length} kata yang sering salah siap dilatih ulang</div>
        </div>
        <a class="chip-btn quiz" href="quiz.html?kategori=__tersulit__">Latih Sekarang</a>
      `;
    } else {
      tersulitCard.style.display = 'none';
    }

    // ==== Filter & search ====
    filterChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      if (typeof bunyiKlik === 'function') bunyiKlik();
      filterChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('aktif'));
      btn.classList.add('aktif');
      filterLevelAktif = btn.dataset.level;
      renderGrid();
    });

    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderGrid, 120);
    });

    renderGrid();
  } catch (err) {
    statsBar.style.display = 'none';
    levelCard.style.display = 'none';
    grid.innerHTML = '';
    emptyState.textContent = 'Gagal memuat daftar kategori. Coba muat ulang halaman.';
    emptyState.style.display = 'block';
  }
})();

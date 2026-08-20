(async function initQuiz() {
  const user = pastikanLogin();
  if (!user) return;

  const kategoriId = ambilParam('kategori');
  if (!kategoriId) {
    window.location.href = 'dashboard.html';
    return;
  }
  const modeTersulit = kategoriId === '__tersulit__';

  const quizArea = document.getElementById('quizArea');
  quizArea.innerHTML = `<p class="section-sub">Menyiapkan soal...</p>`;

  function acakArray(arr) {
    const salinan = [...arr];
    for (let i = salinan.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
    }
    return salinan;
  }

  let kategoriNama = '';
  let kategoriIcon = '📚';
  let soalList = [];
  let soalIndex = 0;
  let skor = 0;
  let sudahDijawab = false;
  let jawabanArray = []; // null = belum dijawab, true = benar, false = salah (satu entri per soal, untuk baris bintang)

  // Emoji buat overlay hasil jawaban. SALAH sengaja pakai emoji sedih/cemberut, bukan ketawa.
  const EMOJI_BENAR = ['🎉', '⭐', '🥳', '👏', '😄'];
  const EMOJI_SALAH = ['😢', '😭', '🙁', '😞'];

  // ============================================================
  // Muat soal: mode biasa (1 kategori) ATAU mode "Kata Tersulit"
  // (kumpulan kata sering-salah lintas kategori, semacam
  // latihan ulang terfokus / spaced repetition ringan).
  // ============================================================
  async function siapkanSoalTersulit() {
    const daftarTersulit = ambilDaftarKataTersulit(12);
    if (daftarTersulit.length < 4) {
      quizArea.innerHTML = `<div class="empty-state">Belum cukup data kata tersulit. Kerjakan beberapa kuis kategori dulu ya!</div>`;
      return false;
    }

    const kategoriUnik = [...new Set(daftarTersulit.map(x => x.kategoriId))];
    const detailPerKategori = {};
    await Promise.all(kategoriUnik.map(async (id) => {
      try {
        detailPerKategori[id] = await muatDetailKategori(id);
      } catch (err) {
        detailPerKategori[id] = null;
      }
    }));

    // Kumpulkan item asli (id, en, emoji) untuk tiap kata tersulit + pool distraktor gabungan.
    const poolGabungan = [];
    const kataUtama = [];
    daftarTersulit.forEach(entri => {
      const detail = detailPerKategori[entri.kategoriId];
      if (!detail) return;
      const item = (detail.kata || []).find(k => k.en === entri.en);
      if (item) {
        kataUtama.push({ ...item, _asalKategori: entri.kategoriId });
      }
    });
    kategoriUnik.forEach(id => {
      const detail = detailPerKategori[id];
      if (detail) poolGabungan.push(...detail.kata.map(k => ({ ...k, _asalKategori: id })));
    });

    if (kataUtama.length < 4) {
      quizArea.innerHTML = `<div class="empty-state">Belum cukup data kata tersulit. Kerjakan beberapa kuis kategori dulu ya!</div>`;
      return false;
    }

    kategoriNama = 'Kata Tersulit';
    kategoriIcon = '🔁';

    const acak = acakArray(kataUtama);
    soalList = acak.map(item => {
      const distraktor = acakArray(poolGabungan.filter(k => k.en !== item.en)).slice(0, 3);
      const opsi = acakArray([item, ...distraktor]);
      return { soal: item, opsi };
    });
    return true;
  }

  async function siapkanSoalKategori() {
    const data = await muatDetailKategori(kategoriId);
    kategoriNama = data.nama;
    kategoriIcon = data.iconEmoji || '📚';

    const kataListMentah = (data.kata || []).map(k => ({ ...k, _asalKategori: kategoriId }));
    if (kataListMentah.length < 4) {
      quizArea.innerHTML = `<div class="empty-state">Kelompok kata ini butuh minimal 4 kata untuk membuat kuis.</div>`;
      return false;
    }

    const acak = acakArray(kataListMentah);
    soalList = acak.map(item => {
      const distraktor = acakArray(kataListMentah.filter(k => k.en !== item.en)).slice(0, 3);
      const opsi = acakArray([item, ...distraktor]);
      return { soal: item, opsi };
    });
    return true;
  }

  try {
    const siap = modeTersulit ? await siapkanSoalTersulit() : await siapkanSoalKategori();
    if (!siap) return;
    jawabanArray = new Array(soalList.length).fill(null);
    renderSoal();
  } catch (err) {
    quizArea.innerHTML = `<div class="empty-state">Gagal memuat kuis. Coba muat ulang halaman.</div>`;
    return;
  }

  function renderSoal() {
    sudahDijawab = false;
    const { soal, opsi } = soalList[soalIndex];

    quizArea.innerHTML = `
      <h2 class="section-title">🧠 Kuis: ${kategoriIcon} ${kategoriNama}</h2>
      <p class="section-sub">Soal ${soalIndex + 1} dari ${soalList.length}</p>
      <div class="stars-row" id="starsRow"></div>
      <div class="quiz-card">
        <div class="quiz-emoji">${soal.emoji || '📚'}</div>
        <div class="quiz-question">Dalam Bahasa Inggris, ini disebut apa?</div>
        <div class="quiz-prompt">${soal.id}</div>
        <div class="options-grid" id="optionsGrid">
          ${opsi.map((o, i) => `<button class="option-btn" data-en="${o.en}" data-index="${i}">${o.en}</button>`).join('')}
        </div>
        <div class="quiz-footer">
          <button class="btn-secondary" id="nextSoalBtn" style="display:none;">Lanjut →</button>
        </div>
      </div>
    `;

    renderBintang();

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => jawabSoal(btn, soal));
    });

    document.getElementById('nextSoalBtn').addEventListener('click', () => {
      if (typeof bunyiKlik === 'function') bunyiKlik();
      soalBerikutnya();
    });
  }

  // Gambar ulang baris bintang skor: emas berkilau kalau benar, merah berkilau kalau salah.
  function renderBintang() {
    const starsRow = document.getElementById('starsRow');
    if (!starsRow) return;
    starsRow.innerHTML = jawabanArray.map((hasil, i) => {
      let kelas = 'star-item';
      if (hasil === true) kelas += ' benar';
      else if (hasil === false) kelas += ' salah';
      else if (i === soalIndex) kelas += ' aktif';
      return `<span class="${kelas}">★</span>`;
    }).join('');
  }

  // Taburkan potongan kertas warna-warni jatuh dari atas layar (dipanggil cuma kalau jawaban benar).
  function buatConfetti(container, jumlah = 26) {
    const warnaList = [
      'var(--coral)', 'var(--kuning-500)', 'var(--tosca-600)',
      'var(--violet)', 'var(--pink-pop)', 'var(--success)'
    ];
    for (let i = 0; i < jumlah; i++) {
      const potongan = document.createElement('div');
      potongan.className = 'confetti-piece';
      potongan.style.left = `${Math.random() * 100}%`;
      potongan.style.background = warnaList[Math.floor(Math.random() * warnaList.length)];
      potongan.style.animationDuration = `${1.1 + Math.random() * 0.9}s`;
      potongan.style.animationDelay = `${Math.random() * 0.25}s`;
      potongan.style.setProperty('--rotasi-awal', `${Math.random() * 360}deg`);
      container.appendChild(potongan);
    }
  }

  // Tampilkan emoji besar di TENGAH LAYAR (overlay, di luar kartu) sesuai hasil jawaban.
  function tampilkanFeedback(benar) {
    // Jaga-jaga kalau overlay sebelumnya masih ada (klik cepat / ganti soal buru-buru)
    const overlayLama = document.querySelector('.feedback-overlay');
    if (overlayLama) overlayLama.remove();

    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';

    if (benar) {
      buatConfetti(overlay);
    }

    const daftarEmoji = benar ? EMOJI_BENAR : EMOJI_SALAH;
    const emoji = daftarEmoji[Math.floor(Math.random() * daftarEmoji.length)];
    const teks = benar ? 'Betul sekali!' : 'Belum tepat, coba lagi ya!';

    const emojiEl = document.createElement('div');
    emojiEl.className = `feedback-overlay-emoji ${benar ? 'benar' : 'salah'}`;
    emojiEl.textContent = emoji;

    const textEl = document.createElement('div');
    textEl.className = `feedback-overlay-text ${benar ? 'benar' : 'salah'}`;
    textEl.textContent = teks;

    overlay.appendChild(emojiEl);
    overlay.appendChild(textEl);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.remove(), 1500);
  }

  function jawabSoal(btn, soalBenar) {
    if (sudahDijawab) return;
    sudahDijawab = true;

    const dipilihBenar = btn.dataset.en === soalBenar.en;
    if (dipilihBenar) skor++;
    jawabanArray[soalIndex] = dipilihBenar;

    // Catat statistik kata ini (basis latihan "Kata Tersulit" / spaced repetition ringan).
    catatStatistikKata(soalBenar._asalKategori || kategoriId, soalBenar.en, dipilihBenar);

    document.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.en === soalBenar.en) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    // Suara otomatis begitu dijawab: hore ceria kalau benar, bunyi lembut kalau salah.
    if (dipilihBenar) {
      if (typeof bunyiBenar === 'function') bunyiBenar();
    } else {
      if (typeof bunyiSalah === 'function') bunyiSalah();
    }
    tampilkanFeedback(dipilihBenar);
    renderBintang();
    ucapkanKata(soalBenar.en);

    const nextSoalBtn = document.getElementById('nextSoalBtn');
    nextSoalBtn.style.display = 'inline-block';
    nextSoalBtn.textContent = soalIndex === soalList.length - 1 ? 'Lihat Hasil →' : 'Lanjut →';
  }

  function soalBerikutnya() {
    if (soalIndex < soalList.length - 1) {
      soalIndex++;
      renderSoal();
    } else {
      tampilkanHasil();
    }
  }

  function tampilkanHasil() {
    const persen = Math.round((skor / soalList.length) * 100);
    let pesan, emoji;
    if (persen >= 90) { pesan = 'Luar biasa! Kamu sudah hafal banget!'; emoji = '🏆'; }
    else if (persen >= 70) { pesan = 'Bagus sekali! Sedikit lagi sempurna!'; emoji = '🎉'; }
    else if (persen >= 50) { pesan = 'Cukup baik, ayo belajar lagi ya!'; emoji = '💪'; }
    else { pesan = 'Yuk belajar kartu katanya dulu, lalu coba lagi!'; emoji = '📚'; }

    let infoRekor = '';
    let infoLencana = '';

    if (modeTersulit) {
      infoRekor = `<p class="result-rekor">🔁 Kata-kata ini sudah kamu latih ulang!</p>`;
    } else {
      const hasil = simpanHasilKuis(kategoriId, skor, soalList.length);
      const rekorBaru = hasil.persen === persen; // true kalau ini jadi skor terbaik baru (atau menyamai)
      infoRekor = `<p class="result-rekor">${rekorBaru
        ? '🏅 Ini skor terbaikmu sejauh ini!'
        : `Skor terbaikmu: ${hasil.skor} / ${hasil.total} (${hasil.persen}%)`}</p>`;

      const ringkasanKategori = ambilRingkasanKategori(kategoriId, soalList.length);
      const lencana = tentukanLencana(ringkasanKategori.persenHafal);
      infoLencana = lencana
        ? `<p class="result-rekor">${lencana.emoji} Lencana kategori ini: ${lencana.label}</p>`
        : '';
    }

    const tombolUlangi = modeTersulit
      ? `<a href="dashboard.html" class="btn-secondary" style="text-decoration:none;">🏠 Ke Dashboard</a>`
      : `<a href="flashcard.html?kategori=${encodeURIComponent(kategoriId)}" class="btn-secondary" style="text-decoration:none;">📖 Belajar Lagi</a>`;

    quizArea.innerHTML = `
      <div class="result-card">
        <div class="result-emoji">${emoji}</div>
        <div class="result-score">${skor} / ${soalList.length}</div>
        <p class="result-sub">${pesan}</p>
        ${infoRekor}
        ${infoLencana}
        <div class="result-actions">
          ${tombolUlangi}
          <button class="btn-primary" id="ulangiBtn" style="width:auto; padding:12px 24px;">🔁 Ulangi Kuis</button>
        </div>
      </div>
    `;
    document.getElementById('ulangiBtn').addEventListener('click', () => {
      if (typeof bunyiKlik === 'function') bunyiKlik();
      window.location.reload();
    });
  }
})();

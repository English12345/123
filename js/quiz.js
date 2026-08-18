(async function initQuiz() {
  const user = pastikanLogin();
  if (!user) return;

  const kategoriId = ambilParam('kategori');
  if (!kategoriId) {
    window.location.href = 'dashboard.html';
    return;
  }

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

  const EMOJI_BENAR = ['🎉', '⭐', '🥳', '👏', '😄'];
  const EMOJI_SALAH = ['😅', '🙈', '💦', '🤔'];

  try {
    const data = await muatDetailKategori(kategoriId);
    kategoriNama = data.nama;
    kategoriIcon = data.iconEmoji || '📚';

    const kataList = data.kata || [];
    if (kataList.length < 4) {
      quizArea.innerHTML = `<div class="empty-state">Kelompok kata ini butuh minimal 4 kata untuk membuat kuis.</div>`;
      return;
    }

    const acak = acakArray(kataList);
    soalList = acak.map(item => {
      const distraktor = acakArray(kataList.filter(k => k.en !== item.en)).slice(0, 3);
      const opsi = acakArray([item, ...distraktor]);
      return { soal: item, opsi };
    });
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
        <div class="feedback-box" id="feedbackBox"></div>
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

  // Tampilkan emoji + teks singkat sesuai hasil jawaban.
  function tampilkanFeedback(benar) {
    const box = document.getElementById('feedbackBox');
    if (!box) return;
    const daftarEmoji = benar ? EMOJI_BENAR : EMOJI_SALAH;
    const emoji = daftarEmoji[Math.floor(Math.random() * daftarEmoji.length)];
    const teks = benar ? 'Betul sekali!' : 'Belum tepat, coba lagi ya!';
    box.innerHTML = `
      <div class="feedback-emoji">${emoji}</div>
      <div class="feedback-text ${benar ? 'benar' : 'salah'}">${teks}</div>
    `;
  }

  function jawabSoal(btn, soalBenar) {
    if (sudahDijawab) return;
    sudahDijawab = true;

    const dipilihBenar = btn.dataset.en === soalBenar.en;
    if (dipilihBenar) skor++;
    jawabanArray[soalIndex] = dipilihBenar;

    document.querySelectorAll('.option-btn').forEach(b => {
      b.disabled = true;
      if (b.dataset.en === soalBenar.en) b.classList.add('correct');
      else if (b === btn) b.classList.add('wrong');
    });

    // Suara & emoji otomatis begitu dijawab: hore ceria kalau benar, bunyi lembut kalau salah.
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

    quizArea.innerHTML = `
      <div class="result-card">
        <div class="result-emoji">${emoji}</div>
        <div class="result-score">${skor} / ${soalList.length}</div>
        <p class="result-sub">${pesan}</p>
        <div class="result-actions">
          <a href="flashcard.html?kategori=${encodeURIComponent(kategoriId)}" class="btn-secondary" style="text-decoration:none;">📖 Belajar Lagi</a>
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

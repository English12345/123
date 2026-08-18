(async function initFlashcard() {
  const user = pastikanLogin();
  if (!user) return;

  const kategoriId = ambilParam('kategori');
  if (!kategoriId) {
    window.location.href = 'dashboard.html';
    return;
  }

  const judulEl = document.getElementById('judulKategori');
  const progressLabel = document.getElementById('progressLabel');
  const progressFill = document.getElementById('progressFill');
  const flipCard = document.getElementById('flipCard');
  const emojiFront = document.getElementById('emojiFront');
  const emojiBack = document.getElementById('emojiBack');
  const kataIndo = document.getElementById('kataIndo');
  const kataInggris = document.getElementById('kataInggris');
  const speakBtn = document.getElementById('speakBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const quizLink = document.getElementById('quizLink');

  let kataList = [];
  let index = 0;

  function tampilkanKartu() {
    const item = kataList[index];
    flipCard.classList.remove('flipped');
    emojiFront.textContent = item.emoji || '📚';
    emojiBack.textContent = item.emoji || '📚';
    kataIndo.textContent = item.id;
    kataInggris.textContent = item.en;

    progressLabel.textContent = `${index + 1} / ${kataList.length}`;
    progressFill.style.width = `${((index + 1) / kataList.length) * 100}%`;

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === kataList.length - 1;
  }

  try {
    const data = await muatDetailKategori(kategoriId);

    judulEl.textContent = `${data.iconEmoji || '📚'} ${data.nama}`;
    kataList = data.kata || [];
    quizLink.href = `quiz.html?kategori=${encodeURIComponent(kategoriId)}`;

    if (!kataList.length) {
      judulEl.textContent = 'Belum ada kata di kelompok ini';
      return;
    }
    tampilkanKartu();
  } catch (err) {
    judulEl.textContent = 'Gagal memuat kategori';
    return;
  }

  flipCard.addEventListener('click', () => {
    if (typeof bunyiKlik === 'function') bunyiKlik();
    flipCard.classList.toggle('flipped');
    // Setiap kartu dibalik ke sisi Bahasa Inggris, langsung ucapkan katanya.
    if (flipCard.classList.contains('flipped')) {
      ucapkanKata(kataList[index].en);
    }
  });

  speakBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    ucapkanKata(kataList[index].en);
  });

  prevBtn.addEventListener('click', () => {
    if (typeof bunyiKlik === 'function') bunyiKlik();
    if (index > 0) { index--; tampilkanKartu(); }
  });

  nextBtn.addEventListener('click', () => {
    if (typeof bunyiKlik === 'function') bunyiKlik();
    if (index < kataList.length - 1) { index++; tampilkanKartu(); }
  });
})();

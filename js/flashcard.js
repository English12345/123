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

  // ==== Voice over dua-bahasa: ID (laki-laki) -> jeda 0.7s -> EN (perempuan) ====
  // Fungsi ini LOKAL untuk halaman flashcard saja, tidak menimpa ucapkanKata()
  // global di shared.js, supaya tidak mempengaruhi halaman lain (mis. quiz.js).
  let suaraTersedia = [];
  function muatDaftarSuara() { suaraTersedia = window.speechSynthesis.getVoices(); }
  if ('speechSynthesis' in window) {
    muatDaftarSuara();
    window.speechSynthesis.onvoiceschanged = muatDaftarSuara;
  }
  function pilihSuara(kodeLang, kataKunciPrioritas) {
    const kandidat = suaraTersedia.filter(v => v.lang.toLowerCase().startsWith(kodeLang));
    for (const kw of kataKunciPrioritas) {
      const cocok = kandidat.find(v => new RegExp(kw, 'i').test(v.name));
      if (cocok) return cocok;
    }
    return kandidat[0] || null;
  }
  let musikSudahDimulai = false;
  function pastikanMusikJalan() {
    if (!musikSudahDimulai && typeof mulaiMusikLatar === 'function') {
      mulaiMusikLatar();
      musikSudahDimulai = true;
    }
  }
  function ucapkanDwiBahasa(teksId, teksEn) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // langsung motong suara sebelumnya, biar responsif
  if (typeof redupkanMusikLatar === 'function') redupkanMusikLatar();

  const utterId = new SpeechSynthesisUtterance(teksId);
  utterId.lang = 'id-ID';
  utterId.pitch = 1.15;
  utterId.rate = 1.0;
  const suaraId = pilihSuara('id', ['male', 'pria', 'laki']);
  if (suaraId) utterId.voice = suaraId;

  utterId.onend = () => {
    // langsung diucapkan, tanpa jeda buatan
    const utterEn = new SpeechSynthesisUtterance(teksEn);
    utterEn.lang = 'en-US';
    utterEn.pitch = 1.15;
    utterEn.rate = 1.0;
    const suaraEn = pilihSuara('en', ['female', 'zira', 'samantha', 'woman']);
    if (suaraEn) utterEn.voice = suaraEn;
    utterEn.onend = () => {
      if (typeof pulihkanMusikLatar === 'function') pulihkanMusikLatar();
    };
    window.speechSynthesis.speak(utterEn);
  };
  window.speechSynthesis.speak(utterId);
}
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
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    flipCard.classList.toggle('flipped');
    const item = kataList[index];
    ucapkanDwiBahasa(item.id, item.en);
  });

  speakBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    const item = kataList[index];
    ucapkanDwiBahasa(item.id, item.en);
  });

  prevBtn.addEventListener('click', () => {
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    if (index > 0) { index--; tampilkanKartu(); }
  });
  nextBtn.addEventListener('click', () => {
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    if (index < kataList.length - 1) { index++; tampilkanKartu(); }
  });
})();

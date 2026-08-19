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

  // ==== Voice over dari file audio hasil Piper TTS (bukan API browser) ====
  // GANTI USERNAME/NAMA_REPO sesuai repo GitHub kamu sebelum dipakai.
  const BASE_URL_AUDIO = 'https://cdn.jsdelivr.net/gh/English12345/123@main/audio';

  function slugKata(teks) {
    return teks.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  let musikSudahDimulai = false;
  function pastikanMusikJalan() {
    if (!musikSudahDimulai && typeof mulaiMusikLatar === 'function') {
      mulaiMusikLatar();
      musikSudahDimulai = true;
    }
  }

 function ucapkanDwiBahasa(teksId, teksEn) {
  const slug = slugKata(teksEn);
  const urlId = `${BASE_URL_AUDIO}/id/${slug}.mp3`;
  const urlEn = `${BASE_URL_AUDIO}/en/${slug}.mp3`;
  const audioId = new Audio(urlId);
  const audioEn = new Audio(urlEn);
  audioEn.preload = 'auto';

  if (typeof redupkanMusikLatar === 'function') redupkanMusikLatar();

  audioId.addEventListener('ended', () => {
    audioEn.play().catch((err) => console.error('Gagal PLAY audio EN:', urlEn, err));
  });
  audioEn.addEventListener('ended', () => {
    if (typeof pulihkanMusikLatar === 'function') pulihkanMusikLatar();
  });
  audioId.addEventListener('error', () => {
    console.error('Gagal LOAD audio ID:', urlId, audioId.error);
    if (typeof pulihkanMusikLatar === 'function') pulihkanMusikLatar();
  });
  audioEn.addEventListener('error', () => {
    console.error('Gagal LOAD audio EN:', urlEn, audioEn.error);
  });

  audioId.play().catch((err) => console.error('Gagal PLAY audio ID:', urlId, err));
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

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
  const masteryBadge = document.getElementById('masteryBadge');
  const btnHafal = document.getElementById('btnHafal');
  let kataList = [];
  let index = 0;

  // ==== Voice over dari file audio hasil Piper TTS (bukan API browser) ====
  // GANTI USERNAME/NAMA_REPO sesuai repo GitHub kamu sebelum dipakai.
  const BASE_URL_AUDIO = 'https://cdn.jsdelivr.net/gh/English12345/123@main/audio';

  function slugKata(teks) {
    return teks.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // ==== Cache preload: simpan objek Audio yang sudah mulai/selesai didownload ====
  const audioCache = {}; // key: slug, value: { id: Audio, en: Audio }

  function buatAudio(url) {
    const a = new Audio(url);
    a.preload = 'auto';
    a.load(); // paksa mulai download dari sekarang, jangan tunggu di-play
    return a;
  }

  function preloadKata(item) {
    if (!item) return;
    const slug = slugKata(item.en);
    if (audioCache[slug]) return; // sudah pernah di-preload
    audioCache[slug] = {
      id: buatAudio(`${BASE_URL_AUDIO}/id/${slug}.mp3`),
      en: buatAudio(`${BASE_URL_AUDIO}/en/${slug}.mp3`)
    };
  }

  let musikSudahDimulai = false;
  function pastikanMusikJalan() {
    if (!musikSudahDimulai && typeof mulaiMusikLatar === 'function') {
      mulaiMusikLatar();
      musikSudahDimulai = true;
    }
  }

  function ucapkanDwiBahasa(item) {
    const slug = slugKata(item.en);
    preloadKata(item); // jaga-jaga kalau belum sempat ke-preload

    // Pakai audio dari cache (kalau sudah didownload = langsung bunyi tanpa loading)
    const cached = audioCache[slug];
    const audioId = cached.id;
    const audioEn = cached.en;

    // reset ke awal, buat jaga-jaga kalau sebelumnya sudah pernah diputar
    audioId.currentTime = 0;
    audioEn.currentTime = 0;

    if (typeof redupkanMusikLatar === 'function') redupkanMusikLatar();

    audioId.onended = () => {
      audioEn.play().catch((err) => console.error('Gagal PLAY audio EN:', err));
    };
    audioEn.onended = () => {
      if (typeof pulihkanMusikLatar === 'function') pulihkanMusikLatar();
    };
    audioId.onerror = () => {
      console.error('Gagal LOAD audio ID:', audioId.src, audioId.error);
      if (typeof pulihkanMusikLatar === 'function') pulihkanMusikLatar();
    };
    audioEn.onerror = () => {
      console.error('Gagal LOAD audio EN:', audioEn.src, audioEn.error);
    };

    audioId.play().catch((err) => console.error('Gagal PLAY audio ID:', err));
  }

  function perbaruiBadgeHafal() {
    if (!masteryBadge) return;
    const progres = ambilProgresKategori(kategoriId);
    masteryBadge.textContent = `⭐ ${progres.hafal.length}/${kataList.length}`;
  }

  function perbaruiTombolHafal() {
    if (!btnHafal) return;
    const item = kataList[index];
    const sudahHafal = apakahKataHafal(kategoriId, item.en);
    btnHafal.textContent = sudahHafal ? '✅ Sudah Hafal!' : '⭐ Tandai Sudah Hafal';
    btnHafal.classList.toggle('aktif', sudahHafal);
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
    perbaruiTombolHafal();
    perbaruiBadgeHafal();

    // Mulai download audio kartu ini SEKARANG (sebelum diklik),
    // plus siap-siap kartu berikutnya biar next/prev juga lebih responsif.
    preloadKata(item);
    preloadKata(kataList[index + 1]);
    preloadKata(kataList[index - 1]);
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
    ucapkanDwiBahasa(kataList[index]);
  });

  speakBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    ucapkanDwiBahasa(kataList[index]);
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

  if (btnHafal) {
    btnHafal.addEventListener('click', () => {
      if (typeof bunyiKlik === 'function') bunyiKlik();
      toggleKataHafal(kategoriId, kataList[index].en);
      perbaruiTombolHafal();
      perbaruiBadgeHafal();
    });
  }
})();

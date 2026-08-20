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
  const autoplayBtn = document.getElementById('autoplayBtn');
  const autoplayLabel = document.getElementById('autoplayLabel');
  const autoplayDot = autoplayBtn ? autoplayBtn.querySelector('.autoplay-dot') : null;
  let kataList = [];
  let index = 0;
  let sedangAutoplay = false;
  let audioIdAktif = null; // referensi audio yang lagi diputar, buat dihentikan paksa kalau perlu
  let audioEnAktif = null;

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

    // Simpan referensi audio yang sedang aktif, supaya autoplay bisa
    // menghentikannya paksa kalau tombol "Berhenti" ditekan di tengah ucapan.
    audioIdAktif = audioId;
    audioEnAktif = audioEn;

    // Dikembalikan sebagai Promise supaya autoplay bisa MENUNGGU sampai
    // ucapan Indonesia + Inggris selesai, baru lanjut ke kartu berikutnya.
    return new Promise((resolve) => {
      let sudahSelesai = false;
      const selesaikan = () => {
        if (sudahSelesai) return;
        sudahSelesai = true;
        resolve();
      };

      audioId.onended = () => {
        audioEn.play().catch((err) => {
          console.error('Gagal PLAY audio EN:', err);
          selesaikan();
        });
      };
      audioEn.onended = () => {
        if (typeof pulihkanMusikLatar === 'function') pulihkanMusikLatar();
        selesaikan();
      };
      audioId.onerror = () => {
        console.error('Gagal LOAD audio ID:', audioId.src, audioId.error);
        if (typeof pulihkanMusikLatar === 'function') pulihkanMusikLatar();
        selesaikan();
      };
      audioEn.onerror = () => {
        console.error('Gagal LOAD audio EN:', audioEn.src, audioEn.error);
        selesaikan();
      };

      audioId.play().catch((err) => {
        console.error('Gagal PLAY audio ID:', err);
        selesaikan();
      });
    });
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
    hentikanAutoplayJikaAktif();
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    flipCard.classList.toggle('flipped');
    ucapkanDwiBahasa(kataList[index]);
  });

  speakBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hentikanAutoplayJikaAktif();
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    ucapkanDwiBahasa(kataList[index]);
  });

  prevBtn.addEventListener('click', () => {
    hentikanAutoplayJikaAktif();
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    if (index > 0) { index--; tampilkanKartu(); }
  });
  nextBtn.addEventListener('click', () => {
    hentikanAutoplayJikaAktif();
    pastikanMusikJalan();
    if (typeof bunyiKlik === 'function') bunyiKlik();
    if (index < kataList.length - 1) { index++; tampilkanKartu(); }
  });

  // ============================================================
  // PUTAR OTOMATIS — urutan tiap kartu: tab kartu (flip) → ucap
  // Indonesia → ucap Inggris → lanjut kartu berikutnya → ulangi,
  // sampai kartu terakhir. Ucapan WAJIB selesai dulu sebelum pindah
  // kartu (tidak ada skip diam-diam).
  // ============================================================
  function tunggu(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function perbaruiTombolAutoplay() {
    if (!autoplayBtn) return;
    autoplayBtn.classList.toggle('aktif', sedangAutoplay);
    if (autoplayDot) autoplayDot.textContent = sedangAutoplay ? '⏸️' : '▶️';
    if (autoplayLabel) autoplayLabel.textContent = sedangAutoplay ? 'Berhenti' : 'Putar Otomatis';
  }

  function hentikanAutoplayJikaAktif() {
    if (!sedangAutoplay) return;
    sedangAutoplay = false;
    if (audioIdAktif) audioIdAktif.pause();
    if (audioEnAktif) audioEnAktif.pause();
    perbaruiTombolAutoplay();
  }

async function jalankanAutoplay() {
  while (sedangAutoplay) {
    // 1) Tab kartu — buka ke sisi jawaban (Inggris)
    flipCard.classList.add('flipped');

    // 2) Ucap Indonesia lalu Inggris — WAJIB tunggu sampai selesai
    await ucapkanDwiBahasa(kataList[index]);
    if (!sedangAutoplay) break; // dibatalkan tepat saat sedang diucapkan

    await tunggu(500); // jeda singkat biar tidak buru-buru
    if (!sedangAutoplay) break;

    // 3) Kartu terakhir? Kembali ke kartu pertama (loop). Kalau belum, lanjut biasa.
    if (index >= kataList.length - 1) {
      index = 0;
    } else {
      index++;
    }
    tampilkanKartu(); // otomatis reset tampilan ke sisi depan (Indonesia)

    await tunggu(350); // jeda kecil sebelum "tab kartu" berikutnya
  }
  sedangAutoplay = false;
  perbaruiTombolAutoplay();
}

  if (autoplayBtn) {
    autoplayBtn.addEventListener('click', () => {
      pastikanMusikJalan();
      if (typeof bunyiKlik === 'function') bunyiKlik();

      if (sedangAutoplay) {
        hentikanAutoplayJikaAktif();
        return;
      }
      sedangAutoplay = true;
      perbaruiTombolAutoplay();
      jalankanAutoplay();
    });
  }

  // Tampilkan overlay singkat saat level naik — momen perayaan kecil
  // supaya anak sadar progres belajarnya (mirip feedback kuis).
  function tampilkanLevelUp(lv) {
    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';

    const emojiEl = document.createElement('div');
    emojiEl.className = 'feedback-overlay-emoji benar';
    emojiEl.textContent = lv.emoji;

    const textEl = document.createElement('div');
    textEl.className = 'feedback-overlay-text benar';
    textEl.textContent = `Naik Level! ${lv.judul}`;

    overlay.appendChild(emojiEl);
    overlay.appendChild(textEl);
    document.body.appendChild(overlay);
    if (typeof bunyiBenar === 'function') bunyiBenar();

    setTimeout(() => overlay.remove(), 1800);
  }

  if (btnHafal) {
    btnHafal.addEventListener('click', () => {
      if (typeof bunyiKlik === 'function') bunyiKlik();
      const totalHafalSebelum = hitungTotalHafalSemuaKategori();
      toggleKataHafal(kategoriId, kataList[index].en);
      const totalHafalSesudah = hitungTotalHafalSemuaKategori();
      perbaruiTombolHafal();
      perbaruiBadgeHafal();

      if (totalHafalSesudah > totalHafalSebelum) {
        const lvSebelum = hitungLevel(totalHafalSebelum);
        const lvSesudah = hitungLevel(totalHafalSesudah);
        if (lvSesudah.level > lvSebelum.level) {
          tampilkanLevelUp(lvSesudah);
        }
      }
    });
  }
})();

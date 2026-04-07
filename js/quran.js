// Quran page logic — NoorIslam Service Layer

document.addEventListener('DOMContentLoaded', () => {
  const surahGrid = document.getElementById('surahGrid');
  const surahLoader = document.getElementById('surahLoader');
  const searchInput = document.getElementById('searchInput');
  const surahListView = document.getElementById('surahListView');
  const readerView = document.getElementById('readerView');
  const backBtn = document.getElementById('backBtn');
  const ayahsContainer = document.getElementById('ayahsContainer');
  const ayahLoader = document.getElementById('ayahLoader');
  const bismillahHeader = document.getElementById('bismillahHeader');

  let allSurahs = [];
  let currentAudioBtn = null;
  const audioElement = document.getElementById('audioElement');
  const globalAudioPlayer = document.getElementById('globalAudioPlayer');
  const nowPlayingText = document.getElementById('nowPlayingText');

  async function loadSurahList() {
    surahLoader.style.display = 'flex';
    try {
      const response = await fetch(`${NoorAPI.quran()}/surah.json`);
      const data = await response.json();

      if (data && data.length > 0) {
        allSurahs = data.map((s, index) => ({
          number: index + 1,
          name: s.surahName,
          nameArabic: s.surahNameArabic,
          nameArabicLong: s.surahNameArabicLong,
          translation: s.surahNameTranslation,
          revelationPlace: s.revelationPlace,
          totalAyah: s.totalAyah
        }));
        renderSurahs(allSurahs);
      }
    } catch (e) {
      console.error(e);
      surahGrid.innerHTML = '<p style="text-align:center;width:100%;color:var(--text-muted)">Failed to load. Please refresh.</p>';
    } finally {
      surahLoader.style.display = 'none';
    }
  }

  function renderSurahs(surahs) {
    surahGrid.innerHTML = '';
    surahs.forEach(surah => {
      const card = document.createElement('div');
      card.className = 'surah-card';
      card.onclick = () => openReader(surah.number, surah.name, surah.nameArabic, surah.revelationPlace, surah.totalAyah);
      card.innerHTML = `
        <div class="surah-number-badge"><span style="z-index:1">${surah.number}</span></div>
        <div class="surah-info">
          <div class="surah-english">${surah.name}</div>
          <div class="surah-details">${surah.translation} • ${surah.totalAyah} ayahs • ${surah.revelationPlace}</div>
        </div>
        <div class="surah-arabic">${surah.nameArabic}</div>
      `;
      surahGrid.appendChild(card);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allSurahs.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.translation.toLowerCase().includes(term) ||
        s.number.toString() === term
      );
      renderSurahs(filtered);
    });
  }

  async function openReader(surahNumber, engName, arName, type, numAyahs) {
    surahListView.style.display = 'none';
    readerView.style.display = 'block';
    document.getElementById('rSurahNameEn').textContent = engName;
    document.getElementById('rSurahNameAr').textContent = arName;
    document.getElementById('rSurahDetails').textContent = `${type} • ${numAyahs} Verses`;
    bismillahHeader.style.display = surahNumber === 9 ? 'none' : 'block';
    ayahsContainer.innerHTML = '';
    ayahLoader.style.display = 'flex';
    window.scrollTo(0, 0);

    try {
      const response = await fetch(`${NoorAPI.quran()}/${surahNumber}.json`);
      const data = await response.json();
      if (data && data.arabic1 && data.english) {
        renderAyahs(surahNumber, data.arabic1, data.english);
      } else {
        throw new Error('Invalid data');
      }
    } catch (e) {
      console.error(e);
      ayahsContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Error loading verses. Please try again.</p>';
    } finally {
      ayahLoader.style.display = 'none';
    }
  }

  function renderAyahs(surahNumber, arabicArr, englishArr) {
    arabicArr.forEach((arabicText, index) => {
      const ayahNum = index + 1;
      const sStr = surahNumber.toString().padStart(3, '0');
      const aStr = ayahNum.toString().padStart(3, '0');
      const audioUrl = `${NoorAPI.audio()}/${sStr}${aStr}.mp3`;

      const div = document.createElement('div');
      div.className = 'ayah-container';
      div.id = `ayah-${ayahNum}`;
      div.innerHTML = `
        <div class="ayah-top">
          <div class="ayah-number">${surahNumber}:${ayahNum}</div>
          <div class="ayah-actions">
            <button class="action-btn play-btn" data-audio="${audioUrl}" data-identifier="${surahNumber}:${ayahNum}" title="Play Audio">▶</button>
          </div>
        </div>
        <div class="ayah-arabic">${arabicText}</div>
        <div class="ayah-translation">${englishArr[index] || ''}</div>
      `;
      ayahsContainer.appendChild(div);
    });

    document.querySelectorAll('.play-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        playAudio(this.dataset.audio, this.dataset.identifier, this);
      });
    });
  }

  function playAudio(url, identifier, btnElement) {
    if (currentAudioBtn) {
      currentAudioBtn.classList.remove('playing');
      currentAudioBtn.textContent = '▶';
    }
    if (audioElement.src === url && !audioElement.paused) {
      audioElement.pause();
      globalAudioPlayer.style.display = 'none';
      return;
    }
    audioElement.src = url;
    audioElement.play();
    nowPlayingText.textContent = `Ayah ${identifier}`;
    globalAudioPlayer.style.display = 'flex';
    btnElement.classList.add('playing');
    btnElement.textContent = '⏸';
    currentAudioBtn = btnElement;
  }

  if (audioElement) {
    audioElement.addEventListener('ended', () => {
      if (currentAudioBtn) {
        currentAudioBtn.classList.remove('playing');
        currentAudioBtn.textContent = '▶';
      }
      globalAudioPlayer.style.display = 'none';
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      readerView.style.display = 'none';
      surahListView.style.display = 'block';
      if (audioElement) audioElement.pause();
      if (globalAudioPlayer) globalAudioPlayer.style.display = 'none';
      if (currentAudioBtn) {
        currentAudioBtn.classList.remove('playing');
        currentAudioBtn.textContent = '▶';
      }
    });
  }

  loadSurahList();
});

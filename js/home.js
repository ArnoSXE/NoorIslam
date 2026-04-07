// Home page — NoorIslam Service Layer

document.addEventListener('DOMContentLoaded', () => {
  loadDailyVerse();
});

async function loadDailyVerse() {
  const arabicEl = document.getElementById('dailyArabic');
  const transEl = document.getElementById('dailyTranslation');
  const refEl = document.getElementById('dailyRef');
  if (!arabicEl || !transEl || !refEl) return;

  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  const picks = [
    { surah: 2, ayah: 255 }, { surah: 55, ayah: 13 }, { surah: 112, ayah: 1 },
    { surah: 93, ayah: 5 }, { surah: 94, ayah: 5 }, { surah: 3, ayah: 139 },
    { surah: 2, ayah: 286 }, { surah: 17, ayah: 9 }, { surah: 39, ayah: 53 },
    { surah: 65, ayah: 3 }, { surah: 2, ayah: 152 }, { surah: 13, ayah: 28 },
    { surah: 94, ayah: 6 }, { surah: 3, ayah: 173 },
  ];

  const pick = picks[seed % picks.length];

  try {
    const response = await fetch(`${NoorAPI.quran()}/${pick.surah}.json`);
    const data = await response.json();
    if (data && data.arabic1 && data.english) {
      const idx = pick.ayah - 1;
      arabicEl.textContent = data.arabic1[idx] || data.arabic1[0];
      transEl.textContent = `"${data.english[idx] || data.english[0]}"`;
      refEl.textContent = `— Surah ${data.surahName} [${pick.surah}:${pick.ayah}]`;
      arabicEl.style.animation = 'none';
      arabicEl.offsetHeight;
      arabicEl.style.animation = 'fadeIn 1s ease-in';
    } else { throw new Error('Invalid'); }
  } catch (error) {
    arabicEl.textContent = "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ";
    transEl.textContent = '"Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence."';
    refEl.textContent = "— Surah Al-Baqarah [2:255]";
  }
}

// Hadith logic — NoorIslam Service Layer

let currentBook = '';
let currentCollectionInfo = null;
let hadithsData = [];
let displayedHadiths = 0;
const BATCH_SIZE = 20;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const bookParam = urlParams.get('book');
    if (bookParam) {
        const titleMap = {
            'bukhari': 'Sahih Al-Bukhari', 'muslim': 'Sahih Muslim',
            'abudawud': 'Sunan Abu Dawud', 'tirmidhi': 'Jami At-Tirmidhi',
            'ibnmajah': 'Sunan Ibn Majah', 'nasai': 'Sunan An-Nasai'
        };
        if (titleMap[bookParam]) loadChapters(bookParam, titleMap[bookParam]);
    }
    document.getElementById('loadMoreBtn').addEventListener('click', renderHadithBatch);
});

function showView(viewId) {
    document.getElementById('collectionsView').style.display = 'none';
    document.getElementById('chaptersView').style.display = 'none';
    document.getElementById('hadithsView').style.display = 'none';
    document.getElementById(viewId).style.display = viewId === 'collectionsView' ? 'grid' : 'block';
    window.scrollTo(0, 0);
}

async function loadChapters(bookId, bookName) {
    currentBook = bookId;
    document.getElementById('currentBookName').textContent = bookName;
    showView('chaptersView');
    const loader = document.getElementById('chaptersLoader');
    const list = document.getElementById('chaptersList');
    loader.style.display = 'flex';
    list.innerHTML = '';

    try {
        const data = await fetchData(`${NoorAPI.hadith()}/info.json`);
        if (data && data[bookId]) {
            currentCollectionInfo = data[bookId].metadata;
            const sections = currentCollectionInfo.sections;
            Object.keys(sections).forEach(chapterNum => {
                const chapterName = sections[chapterNum];
                if (!chapterName) return;
                const div = document.createElement('div');
                div.className = 'list-item';
                div.innerHTML = `<span><b>Chapter ${chapterNum}:</b> ${chapterName}</span><span style="color:var(--pk-gold)">→</span>`;
                div.onclick = () => loadHadiths(chapterNum, chapterName);
                list.appendChild(div);
            });
        }
    } catch (e) {
        list.innerHTML = '<p style="text-align:center">Failed to load chapters.</p>';
    } finally {
        loader.style.display = 'none';
    }
}

async function loadHadiths(chapterNum, chapterName) {
    document.getElementById('currentChapterName').textContent = `Chapter ${chapterNum}: ${chapterName}`;
    showView('hadithsView');
    const loader = document.getElementById('hadithsLoader');
    const list = document.getElementById('hadithsList');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loader.style.display = 'flex';
    list.innerHTML = '';
    loadMoreBtn.style.display = 'none';
    hadithsData = [];
    displayedHadiths = 0;

    try {
        const arUrl = `${NoorAPI.hadith()}/editions/ara-${currentBook}.json`;
        const enUrl = `${NoorAPI.hadith()}/editions/eng-${currentBook}.json`;
        const [arRes, enRes] = await Promise.all([fetch(arUrl).then(r => r.json()), fetch(enUrl).then(r => r.json())]);

        if (arRes && enRes) {
            const chapterHadiths = [];
            for (let i = 0; i < arRes.hadiths.length; i++) {
                const h = arRes.hadiths[i];
                if (h.reference && h.reference.book == chapterNum) {
                    chapterHadiths.push({ arabic: h, english: enRes.hadiths[i] });
                }
            }
            hadithsData = chapterHadiths;
            if (hadithsData.length === 0) {
                list.innerHTML = '<p style="text-align:center">No Hadiths found in this section.</p>';
            } else {
                renderHadithBatch();
            }
        }
    } catch (e) {
        list.innerHTML = '<p style="text-align:center">Failed to load hadiths.</p>';
    } finally {
        loader.style.display = 'none';
    }
}

function renderHadithBatch() {
    const list = document.getElementById('hadithsList');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const endIdx = Math.min(displayedHadiths + BATCH_SIZE, hadithsData.length);
    for (let i = displayedHadiths; i < endIdx; i++) {
        const item = hadithsData[i];
        const div = document.createElement('div');
        div.className = 'hadith-card';
        div.innerHTML = `
            <div class="hadith-num">Hadith ${item.arabic.hadithnumber}</div>
            <div class="hadith-arabic">${item.arabic.text}</div>
            <div class="hadith-english">${item.english ? item.english.text : 'Translation not available.'}</div>
        `;
        list.appendChild(div);
    }
    displayedHadiths = endIdx;
    loadMoreBtn.style.display = displayedHadiths < hadithsData.length ? 'inline-block' : 'none';
}

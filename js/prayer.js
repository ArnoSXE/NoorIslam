// Prayer times — NoorIslam Service Layer

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('locateBtn').addEventListener('click', getUserLocation);
    getUserLocation();
});

function getUserLocation() {
    const errorMsg = document.getElementById('errorMsg');
    const btn = document.getElementById('locateBtn');
    btn.textContent = 'Locating...';
    btn.disabled = true;
    errorMsg.style.display = 'none';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                fetchPrayerTimes(lat, lng);
                fetch(`${NoorAPI.geo()}?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('locationText').textContent = `${data.city || data.locality || "Your Location"}, ${data.countryName || ''}`;
                    }).catch(() => {
                        document.getElementById('locationText').textContent = 'Coordinates Detected';
                    });
            },
            error => {
                errorMsg.textContent = 'Geolocation failed. Please allow location access.';
                errorMsg.style.display = 'block';
                btn.textContent = 'Update Location';
                btn.disabled = false;
                fetchPrayerTimesByIP();
            }
        );
    } else {
        errorMsg.textContent = 'Geolocation is not supported by this browser.';
        errorMsg.style.display = 'block';
        fetchPrayerTimesByIP();
    }
}

async function fetchPrayerTimes(lat, lng) {
    const loader = document.getElementById('prayerLoader');
    const grid = document.getElementById('prayerGrid');
    const btn = document.getElementById('locateBtn');
    loader.style.display = 'flex';
    grid.style.display = 'none';

    try {
        const url = `${NoorAPI.prayer()}/timings?latitude=${lat}&longitude=${lng}&method=2`;
        const data = await fetchData(url);
        if (data && data.code === 200) updateUI(data.data);
    } catch (e) {
        document.getElementById('errorMsg').textContent = 'Failed to fetch prayer times.';
        document.getElementById('errorMsg').style.display = 'block';
    } finally {
        loader.style.display = 'none';
        btn.textContent = 'Update Location';
        btn.disabled = false;
    }
}

async function fetchPrayerTimesByIP() {
    const loader = document.getElementById('prayerLoader');
    loader.style.display = 'flex';
    document.getElementById('locationText').textContent = 'Location (Auto-IP)';
    try {
        const url = `${NoorAPI.prayer()}/timingsByCity?city=Mecca&country=Saudi Arabia&method=4`;
        const data = await fetchData(url);
        if (data && data.code === 200) {
            document.getElementById('locationText').textContent = 'Mecca, Saudi Arabia (Default)';
            updateUI(data.data);
        }
    } catch (e) { console.error(e); }
    finally {
        loader.style.display = 'none';
        const btn = document.getElementById('locateBtn');
        btn.textContent = 'Update Location';
        btn.disabled = false;
    }
}

function updateUI(data) {
    const greg = data.date.gregorian;
    const hijri = data.date.hijri;
    document.getElementById('gregorianDate').textContent = `${greg.weekday.en}, ${greg.day} ${greg.month.en} ${greg.year}`;
    document.getElementById('hijriDate').textContent = `${hijri.day} ${hijri.month.ar} ${hijri.year}`;

    const timings = data.timings;
    const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    prayers.forEach(p => {
        const timeStr = timings[p];
        let [hours, minutes] = timeStr.split(':');
        let ampm = 'AM';
        hours = parseInt(hours);
        if (hours >= 12) { ampm = 'PM'; if (hours > 12) hours -= 12; }
        if (hours === 0) hours = 12;
        document.getElementById(`time-${p}`).textContent = `${hours}:${minutes} ${ampm}`;
        document.getElementById(`card-${p}`).classList.remove('current');
    });

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let nextPrayer = null;
    let minDiff = Infinity;
    prayers.forEach(p => {
        const [h, m] = timings[p].split(':');
        const diff = (parseInt(h) * 60 + parseInt(m)) - currentTime;
        if (diff > 0 && diff < minDiff) { minDiff = diff; nextPrayer = p; }
    });
    if (!nextPrayer) nextPrayer = 'Fajr';
    document.getElementById(`card-${nextPrayer}`).classList.add('current');
    document.getElementById('prayerGrid').style.display = 'grid';
}

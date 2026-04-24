const locationDiv = document.getElementById('location');
let userLat, userLon;

function renderLocation(country, displayCity, displayDistrict, lat, lon) {
    let html = '';
    const items = [
        { icon: 'globe', emoji: '&#127760;', label: '国家', value: country },
        { icon: 'city', emoji: '&#127961;', label: '城市', value: displayCity },
        { icon: 'pin', emoji: '&#128205;', label: '区域', value: displayDistrict }
    ];
    for (const item of items) {
        if (item.value) {
            html += `<div class="location-item">
                <span class="icon ${item.icon}">${item.emoji}</span>
                <strong>${item.label}:</strong> ${item.value}
            </div>`;
        }
    }
    html += `<a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" class="maps-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        在 Google Maps 中查看
    </a>`;
    locationDiv.innerHTML = html;
}

function onPositionSuccess(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    userLat = lat;
    userLon = lon;
    locationDiv.innerHTML = '<div class="loading">正在解析地址</div>';

    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`)
        .then(res => res.json())
        .then(data => {
            const addr = data.address || {};
            const country = addr.country || '未知';
            const municipalityMap = {
                'CN-BJ': '北京', 'CN-SH': '上海',
                'CN-TJ': '天津', 'CN-CQ': '重庆'
            };
            const isoCode = addr['ISO3166-2-lvl4'] || '';
            const municipality = municipalityMap[isoCode];
            let displayCity, displayDistrict;
            if (municipality) {
                displayCity = municipality;
                const district = addr.city || '';
                const street = addr.suburb || '';
                displayDistrict = [district, street].filter(Boolean).join(' · ');
            } else {
                displayCity = addr.state || addr.city || addr.town || addr.county || '';
                displayDistrict = [addr.city_district || addr.city || '', addr.suburb || ''].filter(Boolean).join(' · ');
            }
            renderLocation(country, displayCity, displayDistrict, lat, lon);
            fetchWeather(lat, lon);
        })
        .catch(() => {
            locationDiv.innerHTML = '<div class="loading" style="color:#E57373;">地址解析失败</div>';
        });
}

function onPositionError(error) {
    const messages = {
        1: '您拒绝了位置权限请求。',
        2: '无法获取位置信息。',
        3: '获取位置信息超时。'
    };
    locationDiv.innerHTML = `<div style="color:#E57373;font-size:14px;padding:8px 0;">&#9888;&#65039; ${messages[error.code] || '未知错误'}</div>`;
}

function requestLocation() {
    navigator.geolocation.getCurrentPosition(onPositionSuccess, onPositionError, {
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: 10000
    });
}

if (!navigator.geolocation) {
    locationDiv.innerHTML = '<div style="color:#E57373;font-size:14px;">您的浏览器不支持地理定位。</div>';
} else if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
            locationDiv.innerHTML = '<div class="loading">正在自动获取位置</div>';
        }
        requestLocation();
    }).catch(() => requestLocation());
} else {
    requestLocation();
}

function fetchWeather(lat, lon) {
    const weatherDiv = document.getElementById('weather');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto&forecast_days=3`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const daily = data.daily;
            if (!daily) {
                weatherDiv.innerHTML = '<div style="color:#E57373;font-size:14px;">天气数据获取失败</div>';
                return;
            }

            const weatherMap = {
                0:  { emoji: '☀️', text: '晴' },
                1:  { emoji: '🌤️', text: '大部晴' },
                2:  { emoji: '⛅', text: '多云' },
                3:  { emoji: '☁️', text: '阴' },
                45: { emoji: '🌫️', text: '雾' },
                48: { emoji: '🌫️', text: '冻雾' },
                51: { emoji: '🌦️', text: '小毛毛雨' },
                53: { emoji: '🌦️', text: '毛毛雨' },
                55: { emoji: '🌦️', text: '大毛毛雨' },
                61: { emoji: '🌧️', text: '小雨' },
                63: { emoji: '🌧️', text: '中雨' },
                65: { emoji: '🌧️', text: '大雨' },
                71: { emoji: '🌨️', text: '小雪' },
                73: { emoji: '🌨️', text: '中雪' },
                75: { emoji: '🌨️', text: '大雪' },
                77: { emoji: '🌨️', text: '雪粒' },
                80: { emoji: '🌧️', text: '阵雨' },
                81: { emoji: '🌧️', text: '中阵雨' },
                82: { emoji: '🌧️', text: '强阵雨' },
                85: { emoji: '🌨️', text: '小阵雪' },
                86: { emoji: '🌨️', text: '大阵雪' },
                95: { emoji: '⛈️', text: '雷暴' },
                96: { emoji: '⛈️', text: '雷暴+小冰雹' },
                99: { emoji: '⛈️', text: '雷暴+大冰雹' }
            };

            function getClothingAdvice(tMin, tMax, rain, wind) {
                const avg = (tMin + tMax) / 2;
                let advice = '';
                if (avg < 5)       advice = '羽绒服、厚外套，注意保暖';
                else if (avg < 10) advice = '棉衣或厚外套，搭配毛衣';
                else if (avg < 15) advice = '外套+薄毛衣，早晚较凉';
                else if (avg < 20) advice = '薄外套或长袖衬衫';
                else if (avg < 25) advice = '长袖或薄衬衫即可';
                else if (avg < 30) advice = '短袖、轻薄透气衣物';
                else               advice = '短袖短裤，注意防暑';
                if (rain > 50) advice += '；记得带伞';
                if (wind > 30) advice += '；风大注意防风';
                if (tMax - tMin > 10) advice += '；昼夜温差大，注意增减衣物';
                return advice;
            }

            const labels = ['今天', '明天', '后天'];
            let html = '<div class="weather-cards">';
            for (let i = 0; i < 3; i++) {
                const code = daily.weathercode[i];
                const w = weatherMap[code] || { emoji: '❓', text: `未知(${code})` };
                const tMax = daily.temperature_2m_max[i];
                const tMin = daily.temperature_2m_min[i];
                const rain = daily.precipitation_probability_max[i];
                const wind = daily.windspeed_10m_max[i];
                const clothing = getClothingAdvice(tMin, tMax, rain, wind);

                html += `
                <div class="weather-card">
                    <div class="card-header">
                        <span class="card-label">${labels[i]}</span>
                        <span class="card-date">${daily.time[i]}</span>
                    </div>
                    <div class="card-weather-main">
                        <span class="weather-emoji">${w.emoji}</span>
                        <span class="weather-desc">${w.text}</span>
                    </div>
                    <div class="card-details">
                        <div class="detail-row">
                            <span class="detail-icon">🌡️</span>
                            <span>${Math.round(tMin)}°C ~ ${Math.round(tMax)}°C</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-icon">💧</span>
                            <span>降水概率 ${rain}%</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-icon">💨</span>
                            <span>最大风速 ${wind} km/h</span>
                        </div>
                    </div>
                    <div class="card-advice">👗 ${clothing}</div>
                </div>`;
            }
            html += '</div>';
            weatherDiv.innerHTML = html;
        })
        .catch(() => {
            weatherDiv.innerHTML = '<div style="color:#E57373;font-size:14px;">天气数据获取失败</div>';
        });
}

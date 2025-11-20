// 1. 城市資料庫
const CITIES = [
  { name: "台北", lat: 25.0330, lng: 121.5654 },
  { name: "東京", lat: 35.6762, lng: 139.6503 },
  { name: "紐約", lat: 40.7128, lng: -74.0060 },
  { name: "倫敦", lat: 51.5074, lng: -0.1278 },
  { name: "雪梨", lat: -33.8688, lng: 151.2093 },
  { name: "巴黎", lat: 48.8566, lng: 2.3522 },
  { name: "莫斯科", lat: 55.7558, lng: 37.6173 },
  { name: "南極點", lat: -90.0000, lng: 0.0000 },
  { name: "新加坡", lat: 1.3521, lng: 103.8198 },
  { name: "開普敦", lat: -33.9249, lng: 18.4241 }
];

// DOM 快取
const ui = {
  card: document.getElementById('weather-card'),
  closeBtn: document.getElementById('close-btn'),
  name: document.getElementById('city-name'),
  temp: document.getElementById('temperature'),
  desc: document.getElementById('weather-desc'),
  icon: document.getElementById('weather-icon'),
  wind: document.getElementById('windspeed'),
  coords: document.getElementById('coords')
};

// 2. WMO 天氣代碼轉換表
function getWeatherStatus(code) {
  if (code === 0) return { desc: "晴朗無雲", icon: "☀️" };
  if (code >= 1 && code <= 3) return { desc: "多雲/陰天", icon: "☁️" };
  if (code >= 45 && code <= 48) return { desc: "有霧", icon: "🌫️" };
  if (code >= 51 && code <= 55) return { desc: "毛毛雨", icon: "🌧️" };
  if (code >= 61 && code <= 65) return { desc: "下雨", icon: "☔" };
  if (code >= 71 && code <= 77) return { desc: "降雪", icon: "❄️" };
  if (code >= 80 && code <= 82) return { desc: "陣雨", icon: "🌦️" };
  if (code >= 95 && code <= 99) return { desc: "雷雨", icon: "⛈️" };
  return { desc: "未知天氣", icon: "❓" };
}

// 3. 初始化地球
const world = Globe()
  (document.getElementById('globeViz'))
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
  
  // --- 紅色圓點圖層 (保持 3D) ---
  .pointsData(CITIES)
  .pointAltitude(0.01)
  .pointColor(() => '#ff3333')
  .pointRadius(0.8)
  .pointResolution(24)
  .onPointClick(handleCityClick)

  // --- 修改重點：改用 HTML 元素圖層 (解決中文亂碼) ---
  .htmlElementsData(CITIES)
  .htmlLat(d => d.lat)
  .htmlLng(d => d.lng)
  .htmlElement(d => {
    // 這裡動態建立 HTML 標籤
    const el = document.createElement('div');
    el.innerText = d.name;
    
    // 直接設定樣式
    el.style.color = '#ffcc00';
    el.style.fontSize = '14px';
    el.style.fontWeight = 'bold';
    el.style.fontFamily = 'sans-serif';
    el.style.textShadow = '0px 0px 4px rgba(0,0,0,0.8)'; // 黑色陰影讓文字更清楚
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto'; // 確保可以點擊
    el.style.transform = 'translate(-50%, -150%)'; // 稍微往上移，不要蓋住紅點
    
    // 綁定點擊事件
    el.onclick = () => handleCityClick(d);
    
    return el;
  });

// 自動旋轉設定
const controls = world.controls();
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;

// 4. 點擊處理
function handleCityClick(city) {
  controls.autoRotate = false;

  world.pointOfView({ 
    lat: city.lat, 
    lng: city.lng, 
    altitude: 1.8 
  }, 1200);

  ui.card.classList.remove('hidden');
  ui.name.innerText = city.name;
  ui.temp.innerText = "--";
  ui.desc.innerText = "資料讀取中...";
  ui.icon.innerText = "⏳";
  ui.wind.innerText = "--";
  ui.coords.innerText = `${city.lat.toFixed(1)}, ${city.lng.toFixed(1)}`;

  fetchWeatherData(city);
}

// 5. 抓取 API 資料
async function fetchWeatherData(city) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current_weather=true&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.current_weather) throw new Error("No Data");

    const weather = data.current_weather;
    const status = getWeatherStatus(weather.weathercode);

    ui.temp.innerText = weather.temperature;
    ui.wind.innerText = `${weather.windspeed} km/h`;
    ui.desc.innerText = status.desc;
    ui.icon.innerText = status.icon;

  } catch (err) {
    console.error(err);
    ui.desc.innerText = "無法取得天氣資訊";
    ui.icon.innerText = "⚠️";
  }
}

// 6. 關閉按鈕
ui.closeBtn.onclick = () => {
  ui.card.classList.add('hidden');
  controls.autoRotate = true;
  world.pointOfView({ altitude: 2.5 }, 1500);
};

window.onresize = () => {
  world.width(window.innerWidth);
  world.height(window.innerHeight);
};
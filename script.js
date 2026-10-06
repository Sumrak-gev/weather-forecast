const statusEl = document.getElementById("status");
const card = document.getElementById("card");

// Переводы самых частых описаний погоды с wttr.in (английский → русский)
const DESC_RU = {
  "sunny": "Солнечно",
  "clear": "Ясно",
  "partly cloudy": "Переменная облачность",
  "cloudy": "Облачно",
  "overcast": "Пасмурно",
  "mist": "Дымка",
  "fog": "Туман",
  "freezing fog": "Ледяной туман",
  "patchy rain possible": "Местами дождь",
  "patchy rain nearby": "Местами дождь",
  "light rain": "Небольшой дождь",
  "light rain shower": "Небольшой ливень",
  "moderate rain": "Дождь",
  "moderate rain at times": "Временами дождь",
  "heavy rain": "Сильный дождь",
  "heavy rain at times": "Временами сильный дождь",
  "light drizzle": "Лёгкая морось",
  "patchy light drizzle": "Местами морось",
  "light snow": "Небольшой снег",
  "moderate snow": "Снег",
  "heavy snow": "Сильный снег",
  "patchy snow possible": "Местами снег",
  "blowing snow": "Метель",
  "blizzard": "Сильная метель",
  "thundery outbursts possible": "Возможна гроза",
  "patchy light rain with thunder": "Гроза с дождём",
  "moderate or heavy rain with thunder": "Сильная гроза с дождём",
};

function translateDesc(text) {
  const key = text.toLowerCase();
  return DESC_RU[key] || text;
}

function weatherEmoji(text) {
  const t = text.toLowerCase();
  if (t.includes("thunder")) return "⛈️";
  if (t.includes("snow") || t.includes("sleet") || t.includes("blizzard") || t.includes("ice")) return "❄️";
  if (t.includes("rain") || t.includes("drizzle") || t.includes("shower")) return "🌧️";
  if (t.includes("fog") || t.includes("mist") || t.includes("haze")) return "🌫️";
  if (t.includes("overcast")) return "☁️";
  if (t.includes("cloud")) return "⛅";
  if (t.includes("sunny") || t.includes("clear")) return "☀️";
  return "🌡️";
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

async function fetchWeather(location) {
  const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Сервис погоды недоступен");
  const data = await res.json();
  if (!data.current_condition) throw new Error("Место не найдено");
  return data;
}

function renderWeather(data, place) {
  const cur = data.current_condition[0];
  const descEn = cur.weatherDesc[0].value;
  const emoji = weatherEmoji(descEn);

  document.getElementById("cur-emoji").textContent = emoji;
  document.getElementById("cur-temp").textContent = cur.temp_C + "°C";
  document.getElementById("cur-place").textContent = place;
  document.getElementById("meta-wind").textContent = "Ветер " + cur.windspeedKmph + " км/ч";
  document.getElementById("meta-desc").textContent = translateDesc(descEn);

  const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const daysEl = document.getElementById("days");
  daysEl.innerHTML = "";

  data.weather.forEach((day, i) => {
    const date = new Date(day.date);
    const descDay = day.hourly[4]?.weatherDesc[0]?.value || day.hourly[0].weatherDesc[0].value;
    const e = weatherEmoji(descDay);
    const div = document.createElement("div");
    div.className = "day";
    div.innerHTML = `
      <div class="label">${i === 0 ? "Сегодня" : dayNames[date.getDay()]}</div>
      <div class="e">${e}</div>
      <div class="range">${day.maxtempC}° / ${day.mintempC}°</div>
    `;
    daysEl.appendChild(div);
  });

  card.classList.add("visible");
}

async function loadByCity(name) {
  setStatus("Загружаю погоду...");
  card.classList.remove("visible");
  try {
    const data = await fetchWeather(name);
    renderWeather(data, data.nearest_area?.[0]?.areaName?.[0]?.value || name);
    setStatus("");
  } catch (err) {
    setStatus("Ошибка: " + err.message, true);
  }
}

async function loadByCoords(lat, lon) {
  setStatus("Загружаю погоду...");
  card.classList.remove("visible");
  try {
    const data = await fetchWeather(`${lat},${lon}`);
    const place = data.nearest_area?.[0]?.areaName?.[0]?.value || "Текущее местоположение";
    renderWeather(data, place);
    setStatus("");
  } catch (err) {
    setStatus("Ошибка: " + err.message, true);
  }
}

document.getElementById("search-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const city = document.getElementById("city-input").value.trim();
  if (city) loadByCity(city);
});

document.getElementById("geo-btn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Геолокация не поддерживается браузером", true);
    return;
  }
  setStatus("Определяю местоположение...");
  navigator.geolocation.getCurrentPosition(
    (pos) => loadByCoords(pos.coords.latitude, pos.coords.longitude),
    () => setStatus("Не удалось определить местоположение", true)
  );
});

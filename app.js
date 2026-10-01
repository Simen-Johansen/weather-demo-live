/**
 * Hamar Weather Forecast - Tomorrow's Outlook
 * Powered by MET Norway (Locationforecast 2.0)
 * Hamar Coordinates: 60.7945° N, 11.0679° E
 */

// Configuration & Constants
const HAMAR_CONFIG = {
  name: 'Hamar, Norway',
  region: 'Innlandet',
  lat: 60.7945,
  lon: 11.0679,
  apiUrl: 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.7945&lon=11.0679',
};

// Application State
let currentUnit = 'C'; // 'C' or 'F'
let tomorrowData = null; // Filtered timeseries points for tomorrow
let allForecastData = null; // Full API payload
let selectedHourIndex = 0;

// DOM Elements
const loadingState = document.getElementById('loadingState');
const errorBanner = document.getElementById('errorBanner');
const forecastWrapper = document.getElementById('forecastWrapper');
const apiStatusBadge = document.getElementById('apiStatusBadge');
const statusLabel = document.getElementById('statusLabel');
const lastUpdatedLabel = document.getElementById('lastUpdatedLabel');
const btnRefresh = document.getElementById('btnRefresh');
const btnRetry = document.getElementById('btnRetry');
const btnCelsius = document.getElementById('btnCelsius');
const btnFahrenheit = document.getElementById('btnFahrenheit');

// Hero Elements
const heroDateDisplay = document.getElementById('heroDateDisplay');
const heroIcon = document.getElementById('heroIcon');
const heroTemp = document.getElementById('heroTemp');
const heroUnit = document.getElementById('heroUnit');
const heroCondition = document.getElementById('heroCondition');
const heroHigh = document.getElementById('heroHigh');
const heroLow = document.getElementById('heroLow');
const heroRainTotal = document.getElementById('heroRainTotal');
const heroMaxWind = document.getElementById('heroMaxWind');
const heroAvgClouds = document.getElementById('heroAvgClouds');
const heroPressure = document.getElementById('heroPressure');

// Dayparts & Hourly Elements
const daypartsGrid = document.getElementById('daypartsGrid');
const hourlyTrack = document.getElementById('hourlyTrack');
const hourlyCountChip = document.getElementById('hourlyCountChip');

// Inspector Elements
const selectedHourLabel = document.getElementById('selectedHourLabel');
const selectedCondition = document.getElementById('selectedCondition');
const selectedTemp = document.getElementById('selectedTemp');
const selectedPrecip = document.getElementById('selectedPrecip');
const selectedWind = document.getElementById('selectedWind');
const selectedWindArrow = document.getElementById('selectedWindArrow');
const selectedWindDir = document.getElementById('selectedWindDir');
const selectedHumidity = document.getElementById('selectedHumidity');
const selectedClouds = document.getElementById('selectedClouds');

// SVG Icon Library for MET Norway Weather Codes
function getWeatherIcon(symbolCode) {
  if (!symbolCode) symbolCode = 'cloudy';
  const cleanCode = symbolCode.toLowerCase();

  // Clear Sky (Day/Night)
  if (cleanCode.includes('clearsky_day')) {
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="14" fill="#fbbf24"/>
        <g stroke="#f59e0b" stroke-width="3" stroke-linecap="round">
          <line x1="32" y1="6" x2="32" y2="12"/>
          <line x1="32" y1="52" x2="32" y2="58"/>
          <line x1="6" y1="32" x2="12" y2="32"/>
          <line x1="52" y1="32" x2="58" y2="32"/>
          <line x1="13.6" y1="13.6" x2="17.8" y2="17.8"/>
          <line x1="46.2" y1="46.2" x2="50.4" y2="50.4"/>
          <line x1="13.6" y1="50.4" x2="17.8" y2="46.2"/>
          <line x1="46.2" y1="17.8" x2="50.4" y2="13.6"/>
        </g>
      </svg>
    `;
  }

  if (cleanCode.includes('clearsky_night')) {
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M42 34A18 18 0 1 1 26 12a14 14 0 0 0 16 22Z" fill="#38bdf8"/>
        <circle cx="48" cy="18" r="2" fill="#e0f2fe"/>
        <circle cx="20" cy="46" r="1.5" fill="#e0f2fe"/>
      </svg>
    `;
  }

  // Fair / Partly Cloudy (Day)
  if (cleanCode.includes('fair_day') || cleanCode.includes('partlycloudy_day')) {
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="24" cy="24" r="11" fill="#fbbf24"/>
        <g stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round">
          <line x1="24" y1="6" x2="24" y2="10"/>
          <line x1="10" y1="24" x2="6" y2="24"/>
          <line x1="12" y1="12" x2="15" y2="15"/>
        </g>
        <path d="M45 46H23a11 11 0 0 1-1.6-21.9A14 14 0 0 1 47 26.5 9 9 0 0 1 45 46Z" fill="#94a3b8" fill-opacity="0.95"/>
        <path d="M43 44H24a9 9 0 0 1-1.3-17.9A12 12 0 0 1 45 28a7.5 7.5 0 0 1-2 16Z" fill="#cbd5e1"/>
      </svg>
    `;
  }

  // Fair / Partly Cloudy (Night)
  if (cleanCode.includes('fair_night') || cleanCode.includes('partlycloudy_night')) {
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M34 24A12 12 0 1 1 22 10a10 10 0 0 0 12 14Z" fill="#38bdf8"/>
        <path d="M48 48H26a11 11 0 0 1-1.6-21.9A14 14 0 0 1 50 28.5 9 9 0 0 1 48 48Z" fill="#475569"/>
        <path d="M46 46H27a9 9 0 0 1-1.3-17.9A12 12 0 0 1 48 30a7.5 7.5 0 0 1-2 16Z" fill="#94a3b8"/>
      </svg>
    `;
  }

  // Heavy Rain
  if (cleanCode.includes('heavyrain')) {
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M46 36H20a10 10 0 0 1-1.5-19.9A13 13 0 0 1 42 18a8.5 8.5 0 0 1 4 18Z" fill="#64748b"/>
        <g stroke="#0284c7" stroke-width="3" stroke-linecap="round">
          <line x1="20" y1="42" x2="16" y2="52"/>
          <line x1="30" y1="42" x2="26" y2="52"/>
          <line x1="40" y1="42" x2="36" y2="52"/>
        </g>
        <g stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round">
          <line x1="25" y1="46" x2="22" y2="56"/>
          <line x1="35" y1="46" x2="32" y2="56"/>
          <line x1="45" y1="46" x2="42" y2="56"/>
        </g>
      </svg>
    `;
  }

  // Rain / Light Rain
  if (cleanCode.includes('rain')) {
    const isLight = cleanCode.includes('light');
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M47 38H21a10 10 0 0 1-1.5-19.9A13 13 0 0 1 43 20a8.5 8.5 0 0 1 4 18Z" fill="#94a3b8"/>
        <g stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round">
          <line x1="24" y1="44" x2="20" y2="54"/>
          <line x1="34" y1="44" x2="30" y2="54"/>
          <line x1="44" y1="44" x2="40" y2="54"/>
          ${!isLight ? '<line x1="29" y1="47" x2="26" y2="57"/>' : ''}
        </g>
      </svg>
    `;
  }

  // Snow
  if (cleanCode.includes('snow')) {
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M47 36H21a10 10 0 0 1-1.5-19.9A13 13 0 0 1 43 18a8.5 8.5 0 0 1 4 18Z" fill="#94a3b8"/>
        <g fill="#e0f2fe">
          <circle cx="24" cy="44" r="2.5"/>
          <circle cx="34" cy="48" r="2.5"/>
          <circle cx="44" cy="44" r="2.5"/>
          <circle cx="28" cy="54" r="2.5"/>
          <circle cx="39" cy="54" r="2.5"/>
        </g>
      </svg>
    `;
  }

  // Sleet
  if (cleanCode.includes('sleet')) {
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M47 36H21a10 10 0 0 1-1.5-19.9A13 13 0 0 1 43 18a8.5 8.5 0 0 1 4 18Z" fill="#94a3b8"/>
        <line x1="23" y1="44" x2="20" y2="52" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
        <circle cx="34" cy="47" r="2.5" fill="#e0f2fe"/>
        <line x1="44" y1="44" x2="41" y2="52" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  // Fog
  if (cleanCode.includes('fog')) {
    return `
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M47 32H21a10 10 0 0 1-1.5-19.9A13 13 0 0 1 43 14a8.5 8.5 0 0 1 4 18Z" fill="#94a3b8" fill-opacity="0.7"/>
        <g stroke="#cbd5e1" stroke-width="3" stroke-linecap="round">
          <line x1="16" y1="40" x2="48" y2="40"/>
          <line x1="20" y1="47" x2="44" y2="47"/>
          <line x1="18" y1="54" x2="46" y2="54"/>
        </g>
      </svg>
    `;
  }

  // Default: Cloudy
  return `
    <svg viewBox="0 0 64 64" fill="none">
      <path d="M49 42H19a11 11 0 0 1-1.7-21.9A15 15 0 0 1 45 20a10 10 0 0 1 4 22Z" fill="#94a3b8"/>
      <path d="M46 40H21a9 9 0 0 1-1.4-17.9A13 13 0 0 1 43 22a8.5 8.5 0 0 1 3 18Z" fill="#cbd5e1"/>
    </svg>
  `;
}

// Convert symbol codes into human readable strings
function formatConditionName(symbolCode) {
  if (!symbolCode) return 'Overcast / Cloudy';
  const raw = symbolCode
    .replace(/_day|_night/g, '')
    .replace(/heavy/g, 'Heavy ')
    .replace(/light/g, 'Light ')
    .replace(/partlycloudy/g, 'Partly Cloudy')
    .replace(/clearsky/g, 'Clear Sky')
    .replace(/fair/g, 'Fair Weather')
    .replace(/rain/g, 'Rain')
    .replace(/snow/g, 'Snow')
    .replace(/sleet/g, 'Sleet')
    .replace(/fog/g, 'Foggy');

  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Temperature conversion
function formatTemp(celsius, withUnit = true) {
  if (celsius === null || celsius === undefined || isNaN(celsius)) return '--';
  let val = celsius;
  if (currentUnit === 'F') {
    val = (celsius * 9) / 5 + 32;
  }
  const rounded = Math.round(val);
  return withUnit ? `${rounded}°${currentUnit}` : `${rounded}°`;
}

// Compass cardinal directions
function getWindCardinal(degrees) {
  if (degrees === undefined || degrees === null) return '--';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
}

// Identify Tomorrow's calendar date and filter timeseries points
function extractTomorrowData(timeseries) {
  // Current time in Hamar
  const now = new Date();
  
  // Calculate tomorrow's local calendar day
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const targetYear = tomorrow.getFullYear();
  const targetMonth = tomorrow.getMonth();
  const targetDate = tomorrow.getDate();

  // Filter timeseries items matching tomorrow's local day
  const matching = timeseries.filter(item => {
    const itemDate = new Date(item.time);
    return (
      itemDate.getFullYear() === targetYear &&
      itemDate.getMonth() === targetMonth &&
      itemDate.getDate() === targetDate
    );
  });

  return {
    dateObj: tomorrow,
    entries: matching,
  };
}

// Fetch forecast from MET Norway API
async function fetchForecast() {
  setLoading(true);
  hideError();

  try {
    const response = await fetch(HAMAR_CONFIG.apiUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with HTTP status ${response.status}`);
    }

    const data = await response.json();
    allForecastData = data;

    processAndRenderForecast(data);

    // Update status badge
    apiStatusBadge.classList.remove('offline');
    statusLabel.textContent = 'MET Norway Live';
    const now = new Date();
    lastUpdatedLabel.textContent = `Last fetched: ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Updated by MET Norway)`;
  } catch (err) {
    console.error('Error fetching from MET Norway API:', err);
    showError(
      'Could not reach api.met.no',
      'Direct browser connection encountered an issue or rate limit. Trying fallback Hamar forecast cache...'
    );
    // Use fallback sample data if direct request fails
    loadFallbackData();
  } finally {
    setLoading(false);
  }
}

// Process and Render Forecast
function processAndRenderForecast(data) {
  const timeseries = data.properties.timeseries;
  const tomorrowInfo = extractTomorrowData(timeseries);
  
  if (!tomorrowInfo.entries || tomorrowInfo.entries.length === 0) {
    showError('No forecast data available for tomorrow', 'The API did not return entries for tomorrow.');
    return;
  }

  tomorrowData = tomorrowInfo;

  renderHero(tomorrowInfo);
  renderDayparts(tomorrowInfo);
  renderHourlyTimeline(tomorrowInfo);
  selectHour(0); // Select first hour or midday
}

// Render Hero Section
function renderHero(info) {
  const entries = info.entries;
  const dateObj = info.dateObj;

  // Format Date: e.g. "Friday, 2 October 2026"
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  heroDateDisplay.textContent = formattedDate;

  // Midday point (around 12:00 or 14:00) for headline condition and representative temp
  const middayEntry = entries.find(e => {
    const hour = new Date(e.time).getHours();
    return hour === 12 || hour === 13 || hour === 14;
  }) || entries[Math.floor(entries.length / 2)] || entries[0];

  const temps = entries.map(e => e.data.instant.details.air_temperature).filter(t => t !== undefined);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);

  // Representative temp
  const repTemp = middayEntry.data.instant.details.air_temperature;
  let displayTemp = repTemp;
  if (currentUnit === 'F') {
    displayTemp = (repTemp * 9) / 5 + 32;
  }
  heroTemp.textContent = Math.round(displayTemp);
  heroUnit.textContent = `°${currentUnit}`;

  // Representative Symbol & Condition
  const symbol =
    middayEntry.data.next_1_hours?.summary?.symbol_code ||
    middayEntry.data.next_6_hours?.summary?.symbol_code ||
    'cloudy';

  heroIcon.innerHTML = getWeatherIcon(symbol);
  heroCondition.textContent = formatConditionName(symbol);

  heroHigh.textContent = formatTemp(maxTemp, true);
  heroLow.textContent = formatTemp(minTemp, true);

  // Sum total precipitation
  let totalPrecip = 0;
  entries.forEach(e => {
    const p1 = e.data.next_1_hours?.details?.precipitation_amount;
    if (typeof p1 === 'number') {
      totalPrecip += p1;
    }
  });
  heroRainTotal.textContent = `${totalPrecip.toFixed(1)} mm`;

  // Max wind speed
  const winds = entries.map(e => e.data.instant.details.wind_speed).filter(w => typeof w === 'number');
  const maxWind = winds.length ? Math.max(...winds) : 0;
  heroMaxWind.textContent = `${maxWind.toFixed(1)} m/s`;

  // Average cloud area fraction
  const clouds = entries.map(e => e.data.instant.details.cloud_area_fraction).filter(c => typeof c === 'number');
  const avgClouds = clouds.length ? Math.round(clouds.reduce((a, b) => a + b, 0) / clouds.length) : 0;
  heroAvgClouds.textContent = `${avgClouds}%`;

  // Average air pressure
  const pressures = entries.map(e => e.data.instant.details.air_pressure_at_sea_level).filter(p => typeof p === 'number');
  const avgPressure = pressures.length ? Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length) : 1013;
  heroPressure.textContent = `${avgPressure} hPa`;
}

// Render 4 Day Periods Breakdown (Night, Morning, Afternoon, Evening)
function renderDayparts(info) {
  const entries = info.entries;

  const periods = [
    { key: 'night', label: 'Night', hours: '00:00 – 06:00', start: 0, end: 5 },
    { key: 'morning', label: 'Morning', hours: '06:00 – 12:00', start: 6, end: 11 },
    { key: 'afternoon', label: 'Afternoon', hours: '12:00 – 18:00', start: 12, end: 17 },
    { key: 'evening', label: 'Evening', hours: '18:00 – 24:00', start: 18, end: 23 },
  ];

  daypartsGrid.innerHTML = '';

  periods.forEach(p => {
    const periodEntries = entries.filter(e => {
      const h = new Date(e.time).getHours();
      return h >= p.start && h <= p.end;
    });

    if (periodEntries.length === 0) return;

    // Average temperature
    const pTemps = periodEntries.map(e => e.data.instant.details.air_temperature).filter(t => typeof t === 'number');
    const avgTemp = pTemps.reduce((a, b) => a + b, 0) / pTemps.length;

    // Period precipitation
    const precip = periodEntries.reduce((sum, e) => {
      const p = e.data.next_1_hours?.details?.precipitation_amount || 0;
      return sum + p;
    }, 0);

    // Period wind
    const pWinds = periodEntries.map(e => e.data.instant.details.wind_speed).filter(w => typeof w === 'number');
    const avgWind = pWinds.length ? (pWinds.reduce((a, b) => a + b, 0) / pWinds.length).toFixed(1) : '0';

    // Representative symbol
    const midIdx = Math.floor(periodEntries.length / 2);
    const repEntry = periodEntries[midIdx] || periodEntries[0];
    const symbol =
      repEntry.data.next_1_hours?.summary?.symbol_code ||
      repEntry.data.next_6_hours?.summary?.symbol_code ||
      'cloudy';

    const card = document.createElement('div');
    card.className = 'daypart-card';
    card.innerHTML = `
      <div class="daypart-header">
        <span class="daypart-name">${p.label}</span>
        <span class="daypart-hours">${p.hours}</span>
      </div>
      <div class="daypart-icon">
        ${getWeatherIcon(symbol)}
      </div>
      <div class="daypart-temp">${formatTemp(avgTemp, true)}</div>
      <div class="daypart-desc">${formatConditionName(symbol)}</div>
      <div class="daypart-meta">
        <span title="Expected rain during this period">💧 ${precip.toFixed(1)} mm</span>
        <span title="Average wind speed">💨 ${avgWind} m/s</span>
      </div>
    `;
    daypartsGrid.appendChild(card);
  });
}

// Render 24-Hour Timeline
function renderHourlyTimeline(info) {
  const entries = info.entries;
  hourlyTrack.innerHTML = '';
  hourlyCountChip.textContent = `${entries.length} hours`;

  entries.forEach((entry, idx) => {
    const timeDate = new Date(entry.time);
    const hourStr = timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const temp = entry.data.instant.details.air_temperature;
    const precip = entry.data.next_1_hours?.details?.precipitation_amount || 0;
    const windSpeed = entry.data.instant.details.wind_speed || 0;
    const symbol = entry.data.next_1_hours?.summary?.symbol_code || entry.data.next_6_hours?.summary?.symbol_code || 'cloudy';

    const hourCard = document.createElement('div');
    hourCard.className = `hour-card ${idx === selectedHourIndex ? 'active' : ''}`;
    hourCard.id = `hour-card-${idx}`;
    hourCard.setAttribute('role', 'button');
    hourCard.setAttribute('tabindex', '0');
    hourCard.title = `Click to inspect forecast for ${hourStr}`;

    hourCard.innerHTML = `
      <span class="hour-time">${hourStr}</span>
      <div class="hour-icon">${getWeatherIcon(symbol)}</div>
      <span class="hour-temp">${formatTemp(temp, false)}</span>
      <span class="hour-rain ${precip === 0 ? 'zero' : ''}">${precip > 0 ? precip.toFixed(1) + ' mm' : '0 mm'}</span>
      <span class="hour-wind">💨 ${Math.round(windSpeed)}</span>
    `;

    hourCard.addEventListener('click', () => {
      selectHour(idx);
    });

    hourCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectHour(idx);
      }
    });

    hourlyTrack.appendChild(hourCard);
  });
}

// Select an hour to inspect
function selectHour(index) {
  if (!tomorrowData || !tomorrowData.entries || !tomorrowData.entries[index]) return;
  selectedHourIndex = index;

  // Update card highlights
  const cards = hourlyTrack.querySelectorAll('.hour-card');
  cards.forEach((card, idx) => {
    if (idx === index) {
      card.classList.add('active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      card.classList.remove('active');
    }
  });

  const entry = tomorrowData.entries[index];
  const dt = new Date(entry.time);
  const timeFormatted = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  selectedHourLabel.textContent = `Tomorrow at ${timeFormatted}`;

  const details = entry.data.instant.details;
  const symbol = entry.data.next_1_hours?.summary?.symbol_code || entry.data.next_6_hours?.summary?.symbol_code || 'cloudy';
  const precip = entry.data.next_1_hours?.details?.precipitation_amount || 0;

  selectedCondition.textContent = formatConditionName(symbol);
  selectedTemp.textContent = formatTemp(details.air_temperature, true);
  selectedPrecip.textContent = `${precip.toFixed(1)} mm`;

  const windSpeed = details.wind_speed !== undefined ? details.wind_speed.toFixed(1) : '--';
  const windDir = details.wind_from_direction !== undefined ? details.wind_from_direction : 0;
  selectedWind.textContent = `${windSpeed} m/s`;
  selectedWindArrow.style.transform = `rotate(${windDir}deg)`;
  selectedWindDir.textContent = getWindCardinal(windDir);

  selectedHumidity.textContent = details.relative_humidity !== undefined ? `${Math.round(details.relative_humidity)}%` : '--%';
  selectedClouds.textContent = details.cloud_area_fraction !== undefined ? `${Math.round(details.cloud_area_fraction)}%` : '--%';
}

// Temperature Unit Toggle Handler
function setUnit(unit) {
  if (currentUnit === unit) return;
  currentUnit = unit;

  if (unit === 'C') {
    btnCelsius.classList.add('active');
    btnCelsius.setAttribute('aria-pressed', 'true');
    btnFahrenheit.classList.remove('active');
    btnFahrenheit.setAttribute('aria-pressed', 'false');
  } else {
    btnFahrenheit.classList.add('active');
    btnFahrenheit.setAttribute('aria-pressed', 'true');
    btnCelsius.classList.remove('active');
    btnCelsius.setAttribute('aria-pressed', 'false');
  }

  // Re-render UI with new unit
  if (tomorrowData) {
    renderHero(tomorrowData);
    renderDayparts(tomorrowData);
    renderHourlyTimeline(tomorrowData);
    selectHour(selectedHourIndex);
  }
}

// UI State Helpers
function setLoading(isLoading) {
  if (isLoading) {
    loadingState.style.display = 'flex';
    forecastWrapper.style.opacity = '0.4';
    forecastWrapper.style.pointerEvents = 'none';
    btnRefresh.classList.add('spinning');
  } else {
    loadingState.style.display = 'none';
    forecastWrapper.style.opacity = '1';
    forecastWrapper.style.pointerEvents = 'auto';
    btnRefresh.classList.remove('spinning');
  }
}

function showError(title, msg) {
  errorBanner.classList.remove('hidden');
  document.getElementById('errorTitle').textContent = title;
  document.getElementById('errorMessage').textContent = msg;
}

function hideError() {
  errorBanner.classList.add('hidden');
}

// Fallback Data Loader (in case direct live fetch is blocked by CORS or network timeout)
function loadFallbackData() {
  apiStatusBadge.classList.add('offline');
  statusLabel.textContent = 'MET Norway (Cached Sample)';
  lastUpdatedLabel.textContent = 'Loaded offline sample data for Hamar';

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  // Generate 24 hours of representative Hamar autumn weather
  const mockTimeseries = [];
  for (let h = 0; h < 24; h++) {
    const itemDate = new Date(tomorrow);
    itemDate.setHours(h, 0, 0, 0);

    let symbol = 'cloudy';
    let precip = 0.0;
    let temp = 12.0;

    if (h >= 1 && h <= 5) {
      symbol = h >= 3 ? 'heavyrain' : 'rain';
      precip = h >= 3 ? 1.4 : 0.4;
      temp = 11.8;
    } else if (h >= 6 && h <= 8) {
      symbol = 'rain';
      precip = 0.3;
      temp = 11.7;
    } else if (h >= 9 && h <= 18) {
      symbol = 'cloudy';
      precip = 0.0;
      temp = 12.4;
    } else if (h >= 19 && h <= 23) {
      symbol = h >= 22 ? 'partlycloudy_night' : 'cloudy';
      precip = 0.0;
      temp = 11.9;
    }

    mockTimeseries.push({
      time: itemDate.toISOString(),
      data: {
        instant: {
          details: {
            air_temperature: temp,
            cloud_area_fraction: 94.0,
            relative_humidity: 88.0,
            wind_from_direction: 145.0,
            wind_speed: 2.8,
            air_pressure_at_sea_level: 1022.0,
          },
        },
        next_1_hours: {
          summary: { symbol_code: symbol },
          details: { precipitation_amount: precip },
        },
      },
    });
  }

  processAndRenderForecast({
    properties: {
      timeseries: mockTimeseries,
    },
  });
}

// Event Listeners
btnCelsius.addEventListener('click', () => setUnit('C'));
btnFahrenheit.addEventListener('click', () => setUnit('F'));
btnRefresh.addEventListener('click', () => fetchForecast());
btnRetry.addEventListener('click', () => fetchForecast());

// Initial Launch
document.addEventListener('DOMContentLoaded', () => {
  fetchForecast();
});

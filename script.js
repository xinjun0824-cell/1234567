const routeListElement = document.getElementById('routeList');
const detailTitle = document.getElementById('detailTitle');
const detailContent = document.getElementById('detailContent');
const searchInput = document.getElementById('searchInput');
const tabRoute = document.getElementById('tabRoute');
const tabManage = document.getElementById('tabManage');
const routeView = document.getElementById('route-view');
const manageView = document.getElementById('manage-view');
const routeForm = document.getElementById('routeForm');
const routeNameInput = document.getElementById('routeName');
const routeFromInput = document.getElementById('routeFrom');
const routeToInput = document.getElementById('routeTo');
const routeDirectionInput = document.getElementById('routeDirection');
const scheduleInput = document.getElementById('scheduleInput');
const autoFillBtn = document.getElementById('autoFillBtn');
const importFileInput = document.getElementById('importFileInput');
const importBtn = document.getElementById('importBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const apiEndpointInput = document.getElementById('apiEndpoint');
const apiKeyInput = document.getElementById('apiKey');
const fetchOfficialBtn = document.getElementById('fetchOfficialBtn');
const manageMessage = document.getElementById('manageMessage');

const defaultRoutes = [
  {
    id: '1',
    name: '1',
    from: '南站',
    to: '瑞隆路',
    direction: '往瑞隆路',
    schedule: ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00']
  },
  {
    id: '5',
    name: '5',
    from: '岡山',
    to: '鳳山',
    direction: '往鳳山',
    schedule: ['06:20', '06:45', '07:10', '07:35', '08:00', '08:25']
  },
  {
    id: '33',
    name: '33',
    from: '左營站',
    to: '大寮',
    direction: '往大寮',
    schedule: ['06:15', '06:50', '07:25', '08:00', '08:35', '09:10']
  },
  {
    id: '70',
    name: '70',
    from: '高雄轉運站',
    to: '小港機場',
    direction: '往小港機場',
    schedule: ['06:40', '07:10', '07:40', '08:10', '08:40', '09:10']
  },
  {
    id: '248',
    name: '248',
    from: '中正市場',
    to: '蓮池潭',
    direction: '往蓮池潭',
    schedule: ['06:35', '07:05', '07:35', '08:05', '08:35', '09:05']
  }
];

const fullCityRoutesUrl = 'data/all-routes.json';
let currentRoutes = [];
let selectedRouteId = null;

async function loadRoutes() {
  const saved = window.localStorage.getItem('kaohsiungBusRoutes');
  if (saved) {
    try {
      currentRoutes = JSON.parse(saved);
      return;
    } catch (error) {
      console.warn('本機儲存資料解析失敗，改為載入全市範例資料。', error);
    }
  }

  try {
    const response = await fetch(fullCityRoutesUrl);
    if (response.ok) {
      const data = await response.json();
      currentRoutes = Array.isArray(data) ? data : [...defaultRoutes];
      return;
    }
    console.warn('無法載入全市資料，改為使用預設資料');
  } catch (error) {
    console.warn('載入全市資料時發生錯誤，改為使用預設資料。', error);
  }

  currentRoutes = [...defaultRoutes];
}

function saveRoutes() {
  window.localStorage.setItem('kaohsiungBusRoutes', JSON.stringify(currentRoutes));
}

function renderRouteList(filter = '') {
  const query = filter.trim().toLowerCase();
  routeListElement.innerHTML = '';

  const filtered = currentRoutes.filter((route) => {
    return route.name.toLowerCase().includes(query) || route.from.toLowerCase().includes(query) || route.to.toLowerCase().includes(query) || route.direction.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    routeListElement.innerHTML = '<li class="empty-state">找不到符合的路線，請調整搜尋條件。</li>';
    return;
  }

  filtered.forEach((route) => {
    const item = document.createElement('li');
    item.className = 'route-item' + (route.id === selectedRouteId ? ' active' : '');
    item.innerHTML = `<strong>${route.name}</strong>
      <p class="route-meta">${route.from} → ${route.to} · ${route.direction}</p>`;
    item.addEventListener('click', () => {
      selectedRouteId = route.id;
      renderRouteList(searchInput.value);
      showRouteDetail(route);
    });
    routeListElement.appendChild(item);
  });
}

function getRouteSchedule(route) {
  if (!route || !route.schedule) return ['暫無可用時刻表資料'];
  let schedule = Array.isArray(route.schedule)
    ? route.schedule.map((item) => item.toString().trim())
    : route.schedule.toString().split(/\r?\n|;|\||,/).map((item) => item.trim());
  schedule = schedule.filter((item) => item);
  return schedule.length ? schedule : ['暫無可用時刻表資料'];
}

function showRouteDetail(route) {
  detailTitle.textContent = `路線 ${route.name}：${route.from} → ${route.to}`;
  const schedule = getRouteSchedule(route);
  const missingSchedule = !Array.isArray(route.schedule) || route.schedule.length === 0;
  const scheduleCount = schedule.length;
  
  // 使用網格或多列顯示時刻表，以節省空間並提高可讀性
  const scheduleItems = schedule.map((time) => `<li>${time}</li>`).join('');
  
  detailContent.innerHTML = `
    <div class="badge">${route.direction || '方向資訊不完整'}</div>
    <p>此路線的示範時刻表如下，實際班距可能依路線調整。</p>
    ${missingSchedule ? '<p class="warning">本路線的時刻表資料不足，請手動補上或使用自動填入。</p>' : ''}
    <h3>發車時刻 <span class="schedule-count">（共 ${scheduleCount} 班）</span></h3>
    <ul class="schedule-grid">${scheduleItems}</ul>
  `;
}

function switchPage(isManage) {
  routeView.classList.toggle('active', !isManage);
  manageView.classList.toggle('active', isManage);
  tabRoute.classList.toggle('active', !isManage);
  tabManage.classList.toggle('active', isManage);
}

function showMessage(text, type = 'success') {
  manageMessage.textContent = text;
  manageMessage.className = `message ${type}`;
}

function clearMessage() {
  manageMessage.textContent = '';
  manageMessage.className = 'message';
}

function normalizeRouteId(value) {
  return value.trim();
}

function buildRouteQueryUrl(routeId) {
  const endpoint = apiEndpointInput ? apiEndpointInput.value.trim() : '';
  if (!endpoint) return '';
  if (endpoint.includes('{route}')) {
    return endpoint.replace(/{route}/g, encodeURIComponent(routeId));
  }
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}route=${encodeURIComponent(routeId)}`;
}

async function fetchRouteFromApi(routeId) {
  const url = buildRouteQueryUrl(routeId);
  if (!url) return null;
  const headers = {};
  const key = apiKeyInput ? apiKeyInput.value.trim() : '';
  if (key) headers['Authorization'] = key;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error('官方 API 回傳錯誤');
  }
  const payload = await response.json();
  let items = [];
  if (Array.isArray(payload)) {
    items = payload;
  } else if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) items = payload.data;
    else items = Object.values(payload);
  }
  const imported = normalizeImportedRoutes(items);
  return imported.find((item) => item.id === routeId) || null;
}

async function autoFillSchedule() {
  const routeId = normalizeRouteId(routeNameInput.value);
  if (!routeId) {
    showMessage('請先輸入路線編號，再按自動填入。', 'error');
    return;
  }

  showMessage('正在自動填入時刻表，請稍候...');

  try {
    let routeData = null;
    if (apiEndpointInput && apiEndpointInput.value.trim()) {
      routeData = await fetchRouteFromApi(routeId);
    }

    if (!routeData) {
      const response = await fetch('data/bus-autofill.json');
      if (response.ok) {
        const data = await response.json();
        routeData = data[routeId] || null;
      }
    }

    if (!routeData) {
      const allRoutesResponse = await fetch(fullCityRoutesUrl);
      if (allRoutesResponse.ok) {
        const allRoutes = await allRoutesResponse.json();
        if (Array.isArray(allRoutes)) {
          routeData = allRoutes.find((item) => item.id === routeId || item.name === routeId) || null;
        }
      }
    }

    if (!routeData) {
      showMessage('找不到對應路線的 API 或內建資料，請手動填寫時刻表。', 'error');
      return;
    }

    routeFromInput.value = routeData.from || routeFromInput.value;
    routeToInput.value = routeData.to || routeToInput.value;
    routeDirectionInput.value = routeData.direction || routeDirectionInput.value;
    if (Array.isArray(routeData.schedule)) {
      scheduleInput.value = routeData.schedule.join('\n');
    } else {
      scheduleInput.value = routeData.schedule ? routeData.schedule.toString() : scheduleInput.value;
    }
    showMessage('已自動填入時刻表，請確認資料後儲存。', 'success');
  } catch (error) {
    console.error(error);
    showMessage('自動填入失敗，請稍後再試。', 'error');
  }
}

function handleRouteSave(event) {
  event.preventDefault();
  clearMessage();

  const routeId = normalizeRouteId(routeNameInput.value);
  const from = routeFromInput.value.trim();
  const to = routeToInput.value.trim();
  const direction = routeDirectionInput.value.trim();
  const scheduleLines = scheduleInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');

  if (!routeId || !from || !to || !direction || scheduleLines.length === 0) {
    showMessage('請完整填寫所有欄位，包含至少一筆時刻。', 'error');
    return;
  }

  if (currentRoutes.some((route) => route.id === routeId)) {
    showMessage('該路線編號已存在，請使用不同編號或前往查詢頁瀏覽。', 'error');
    return;
  }

  const newRoute = {
    id: routeId,
    name: routeId,
    from,
    to,
    direction,
    schedule: scheduleLines
  };

  currentRoutes.unshift(newRoute);
  saveRoutes();
  renderRouteList(searchInput.value);
  routeForm.reset();
  showMessage(`已新增路線 ${routeId}，請到路線查詢頁查看。`, 'success');
}

async function init() {
  await loadRoutes();
  renderRouteList();

  // load saved API settings
  const savedEndpoint = window.localStorage.getItem('busApiEndpoint') || '';
  const savedKey = window.localStorage.getItem('busApiKey') || '';
  if (apiEndpointInput) apiEndpointInput.value = savedEndpoint;
  if (apiKeyInput) apiKeyInput.value = savedKey;

  tabRoute && tabRoute.addEventListener('click', () => switchPage(false));
  tabManage && tabManage.addEventListener('click', () => switchPage(true));
  searchInput && searchInput.addEventListener('input', () => renderRouteList(searchInput.value));
  routeForm && routeForm.addEventListener('submit', handleRouteSave);
  autoFillBtn && autoFillBtn.addEventListener('click', autoFillSchedule);
  importBtn && importBtn.addEventListener('click', () => handleImportFile(importFileInput.files[0]));
  loadSampleBtn && loadSampleBtn.addEventListener('click', loadAllSampleData);
  fetchOfficialBtn && fetchOfficialBtn.addEventListener('click', fetchOfficialData);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ---------- Import / Sample data helpers ----------
async function loadAllSampleData() {
  showMessage('正在載入示範全市資料...');
  try {
    const res = await fetch('data/all-routes.json');
    if (!res.ok) throw new Error('無法取得示範資料');
    const data = await res.json();
    if (Array.isArray(data)) {
      // prepend any new routes, avoid duplicates by id
      data.forEach(d => { if (!currentRoutes.some(r => r.id === d.id)) currentRoutes.unshift(d); });
    } else {
      showMessage('示範資料格式錯誤', 'error');
      return;
    }
    saveRoutes();
    renderRouteList(searchInput.value);
    showMessage('已載入示範全市路線。', 'success');
  } catch (err) {
    console.error(err);
    showMessage('載入示範資料失敗。', 'error');
  }
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || '');
    return obj;
  });
  return rows;
}

function normalizeImportedRoutes(items) {
  const out = [];
  items.forEach(it => {
    const id = (it.id || it.route || it.name || '').toString().trim();
    if (!id) return;
    const scheduleRaw = it.schedule || it.times || it.timetable || '';
    const schedule = Array.isArray(scheduleRaw)
      ? scheduleRaw.map(s => s.trim()).filter(Boolean)
      : scheduleRaw.toString().split(/;|\|/).map(s => s.trim()).filter(Boolean);
    out.push({
      id,
      name: it.name || id,
      from: it.from || it.origin || '',
      to: it.to || it.destination || '',
      direction: it.direction || it.note || '',
      schedule: schedule.length ? schedule : ['暫無時刻']
    });
  });
  return out;
}

function handleImportFile(file) {
  if (!file) {
    showMessage('請先選擇檔案。', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const txt = e.target.result;
    try {
      let parsed;
      if (file.name.endsWith('.json')) {
        parsed = JSON.parse(txt);
        if (!Array.isArray(parsed)) {
          if (parsed && typeof parsed === 'object') parsed = Object.values(parsed);
          else parsed = [];
        }
      } else {
        parsed = parseCSV(txt);
      }
      const imported = normalizeImportedRoutes(parsed);
      imported.forEach(r => { if (!currentRoutes.some(cr => cr.id === r.id)) currentRoutes.unshift(r); });
      saveRoutes();
      renderRouteList(searchInput.value);
      showMessage(`已匯入 ${imported.length} 筆路線`, 'success');
    } catch (err) {
      console.error(err);
      showMessage('匯入失敗，請檢查檔案格式。', 'error');
    }
  };
  reader.readAsText(file);
}

// ---------- Official API fetch ----------
async function fetchOfficialData() {
  const endpoint = apiEndpointInput ? apiEndpointInput.value.trim() : '';
  const key = apiKeyInput ? apiKeyInput.value.trim() : '';
  if (!endpoint) {
    showMessage('請先輸入官方 API Endpoint。', 'error');
    return;
  }
  showMessage('從官方抓取資料中，請稍候...');
  try {
    const headers = {};
    if (key) headers['Authorization'] = key;
    const res = await fetch(endpoint, { headers });
    if (!res.ok) throw new Error('官方 API 回傳錯誤');
    const payload = await res.json();
    let items = [];
    if (Array.isArray(payload)) items = payload;
    else if (payload && typeof payload === 'object') items = Array.isArray(payload.data) ? payload.data : Object.values(payload);
    const imported = normalizeImportedRoutes(items);
    if (imported.length === 0) {
      showMessage('官方回傳無可匯入路線。', 'error');
      return;
    }
    // merge and avoid duplicates
    let added = 0;
    imported.forEach(r => { if (!currentRoutes.some(cr => cr.id === r.id)) { currentRoutes.unshift(r); added++; } });
    saveRoutes();
    renderRouteList(searchInput.value);
    // save settings
    window.localStorage.setItem('busApiEndpoint', endpoint);
    window.localStorage.setItem('busApiKey', key);
    showMessage(`已從官方匯入 ${added} 筆新路線（總共 ${imported.length} 筆解析）。`, 'success');
  } catch (err) {
    console.error(err);
    showMessage('從官方匯入失敗，請檢查 Endpoint 或網路。', 'error');
  }
}

// bind fetch button
document.addEventListener('DOMContentLoaded', () => {
  if (fetchOfficialBtn) fetchOfficialBtn.addEventListener('click', fetchOfficialData);
});

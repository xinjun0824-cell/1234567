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

let currentRoutes = [];
let selectedRouteId = null;

function loadRoutes() {
  const saved = window.localStorage.getItem('kaohsiungBusRoutes');
  if (saved) {
    try {
      currentRoutes = JSON.parse(saved);
    } catch (error) {
      currentRoutes = [...defaultRoutes];
    }
  } else {
    currentRoutes = [...defaultRoutes];
  }
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

function showRouteDetail(route) {
  detailTitle.textContent = `路線 ${route.name}：${route.from} → ${route.to}`;
  const scheduleItems = route.schedule.map((time) => `<li>${time}</li>`).join('');
  detailContent.innerHTML = `
    <div class="badge">${route.direction}</div>
    <p>此路線的示範時刻表如下，實際班距可能依路線調整。</p>
    <h3>發車時刻</h3>
    <ul>${scheduleItems}</ul>
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

async function autoFillSchedule() {
  const routeId = normalizeRouteId(routeNameInput.value);
  if (!routeId) {
    showMessage('請先輸入路線編號，再按自動填入。', 'error');
    return;
  }

  showMessage('正在自動填入時刻表，請稍候...');

  try {
    const response = await fetch('data/bus-autofill.json');
    if (!response.ok) {
      throw new Error('無法讀取 API 資料');
    }
    const data = await response.json();
    const routeData = data[routeId];

    if (!routeData) {
      showMessage('找不到對應路線的 API 資料，請手動填寫時刻表。', 'error');
      return;
    }

    routeFromInput.value = routeData.from || routeFromInput.value;
    routeToInput.value = routeData.to || routeToInput.value;
    routeDirectionInput.value = routeData.direction || routeDirectionInput.value;
    scheduleInput.value = routeData.schedule.join('\n');
    showMessage('已自動填入時刻表，請確認資料後儲存。', 'success');
  } catch (error) {
    showMessage('自動填入失敗，請稍後再試。', 'error');
    console.error(error);
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

function init() {
  loadRoutes();
  renderRouteList();

  tabRoute.addEventListener('click', () => switchPage(false));
  tabManage.addEventListener('click', () => switchPage(true));
  searchInput.addEventListener('input', () => renderRouteList(searchInput.value));
  routeForm.addEventListener('submit', handleRouteSave);
  autoFillBtn.addEventListener('click', autoFillSchedule);
}

window.addEventListener('DOMContentLoaded', init);

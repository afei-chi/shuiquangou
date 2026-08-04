console.log("======== app.js 已加载 v2.0.3 ========");
// 全局错误捕获 — 帮助诊断JS问题
window._jsErrors = [];
window.addEventListener('error', function(e) {
  window._jsErrors.push(e.message);
  console.error('JS错误:', e.message, e.filename, e.lineno);
});
const REMOTE_DATA_URL = 'https://afei-chi.github.io/shuiquangou/data.json';
const APP_VERSION = '2.0.2';

// 最简单的JS测试 — banner立即变绿证明JS能执行
document.getElementById('diagBanner').style.background='#27ae60';
document.getElementById('diagBanner').textContent='✅ JS基础测试通过 | 若此条仍为红色则JS被禁用';

// ==================== DATA STORE ====================
const DB_KEY = 'shuiquangou_miniapp';
const CACHE_KEY = 'shuiquangou_cache_ts';

function getCacheTimestamp() {
  return localStorage.getItem(CACHE_KEY) || '';
}

function setCacheTimestamp() {
  localStorage.setItem(CACHE_KEY, new Date().toISOString());
}

async function loadDB() {
  // 1. Try remote data first (if REMOTE_DATA_URL is configured)
  if (REMOTE_DATA_URL && REMOTE_DATA_URL.startsWith('http')) {
    try {
      // 5秒超时，防止网络请求卡住导致loading界面永久显示
      let resp;
      if (typeof AbortController !== 'undefined') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        resp = await fetch(REMOTE_DATA_URL + '?t=' + Date.now(), { signal: controller.signal });
        clearTimeout(timeout);
      } else {
        // 旧浏览器不支持 AbortController，直接 fetch
        resp = await fetch(REMOTE_DATA_URL + '?t=' + Date.now());
      }
      if (resp.ok) {
        const remoteData = await resp.json();
        // Merge: remote data wins, but keep local cache for offline
        if (remoteData && remoteData.config) {
          saveDB(remoteData);
          setCacheTimestamp();
          window._dataSource = 'remote';
          return remoteData;
        }
      }
    } catch(e) {
      console.warn('远程数据加载失败，使用本地缓存', e.message);
    }
  }

  // 2. Fallback: localStorage cache
  try {
    const d = localStorage.getItem(DB_KEY);
    if (d) {
      window._dataSource = 'cache';
      return JSON.parse(d);
    }
  } catch(e) { console.warn('数据读取失败', e); }

  // 3. Last resort: default data
  const def = getDefaultDB();
  saveDB(def);
  window._dataSource = 'default';
  return def;
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function getDefaultDB() {
  return {
    config: {
      wifiName: '水泉沟山居', wifiPassword: 'chengde2024',
      hostPhone: '1380314XXXX', hostWechat: 'watervalley_host',
    },
    password: { code: String(Math.floor(100000 + Math.random() * 900000)), guestName: '住客', checkIn: '2024-08-03', checkOut: '2024-08-05' },
    dailyTip: { date: new Date().toISOString().slice(0,10), content: '今日山庄游人稀少，建议辰时（早8点）入园，从丽正门进，先游博物馆区，再乘舟游湖~', weather: '晴', temp: 26, sunrise: '05:12', openTime: '08:00-17:30' },
    routes: [
      {
        id: 'r1', name: '一日精华', type: 'day1', intro: '仿帝王巡游路线，一日看尽承德精华', active: true,
        days: [{ label: '一日精华游', items: [
          { time:'07:30', place:'老三羊汤', desc:'早餐·步行8分钟', tip:'必点：羊汤+烧饼，人均¥25' },
          { time:'08:30', place:'避暑山庄', desc:'丽正门入·3-4小时', tip:'门票¥130，自带干粮和水' },
          { time:'12:30', place:'乔家满族八大碗', desc:'午餐·满族风味', tip:'鹿肉、满族火锅必点' },
          { time:'14:00', place:'普宁寺', desc:'世界最大木雕千手观音', tip:'门票¥80，约1.5小时' },
          { time:'17:00', place:'磬锤峰', desc:'缆车观日落', tip:'缆车¥50单程' },
          { time:'19:30', place:'水泉沟夜市', desc:'烧烤·步行回民宿', tip:'' }
        ]}]
      },
      {
        id: 'r2', name: '两日深度', type: 'day2', intro: '慢游承德，体验皇家与民间', active: true,
        days: [
          { label: 'Day 1 — 避暑山庄 + 外八庙', items: [
            { time:'07:30', place:'老三羊汤', desc:'早餐', tip:'步行10分钟' },
            { time:'08:30-12:00', place:'避暑山庄', desc:'丽正门进 → 博物馆 → 湖区 → 平原区', tip:'门票¥130' },
            { time:'12:30', place:'大清花饺子', desc:'午餐·满族风味', tip:'' },
            { time:'14:00-16:30', place:'普陀宗乘之庙+须弥福寿之庙', desc:'小布达拉宫', tip:'联票¥80' },
            { time:'17:30', place:'磬锤峰', desc:'看日落', tip:'' },
            { time:'19:00', place:'乔家满族八大碗', desc:'晚餐', tip:'' }
          ]},
          { label: 'Day 2 — 周边深度', items: [
            { time:'08:00', place:'承德杏仁茶', desc:'特色早餐', tip:'' },
            { time:'09:00-11:30', place:'双塔山', desc:'自然奇观', tip:'门票¥50' },
            { time:'12:30', place:'满族火锅', desc:'午餐', tip:'' },
            { time:'14:00', place:'承德特产街', desc:'杏仁·山楂糕·榛子', tip:'' },
            { time:'16:00', place:'返程', desc:'带上一罐杏仁回家~', tip:'' }
          ]}
        ]
      },
      {
        id: 'r3', name: '三日全览', type: 'day3', intro: '深度游承德，不留遗憾', active: true,
        days: [
          { label: 'Day 1 — 避暑山庄沉浸游', items: [
            { time:'07:30', place:'老三羊汤', desc:'早餐', tip:'' },
            { time:'08:30-15:00', place:'避暑山庄全天深度游', desc:'博物馆→湖区划船→平原区→山区电瓶车', tip:'带午餐干粮' },
            { time:'15:30', place:'普宁寺', desc:'下午光线好，适合拍照', tip:'' },
            { time:'18:00', place:'乔家满族八大碗', desc:'晚餐', tip:'' }
          ]},
          { label: 'Day 2 — 外八庙 + 磬锤峰', items: [
            { time:'07:30', place:'杏仁茶+煎饼', desc:'早餐', tip:'' },
            { time:'08:30', place:'普陀宗乘之庙', desc:'小布达拉宫，2小时', tip:'' },
            { time:'10:30', place:'须弥福寿之庙', desc:'1小时', tip:'' },
            { time:'12:30', place:'午餐', desc:'', tip:'' },
            { time:'14:00', place:'磬锤峰国家森林公园', desc:'', tip:'' },
            { time:'18:00', place:'水泉沟夜市', desc:'', tip:'' }
          ]},
          { label: 'Day 3 — 周边探秘', items: [
            { time:'08:00', place:'早餐', desc:'', tip:'' },
            { time:'09:00', place:'双塔山或棒槌山', desc:'二选一', tip:'' },
            { time:'12:00', place:'农家乐午餐', desc:'体验承德农家菜', tip:'' },
            { time:'14:00', place:'特产采购 → 返程', desc:'', tip:'' }
          ]}
        ]
      },
      {
        id: 'r4', name: '亲子御游', type: 'family', intro: '带娃慢游，轻松愉快', active: true,
        days: [{ label: '推荐行程（2天1晚）', items: [
          { time:'09:00', place:'睡到自然醒', desc:'慢慢吃个早餐', tip:'' },
          { time:'10:00-12:00', place:'避暑山庄博物馆+湖区划船', desc:'孩子对划船和喂鱼更感兴趣', tip:'' },
          { time:'12:30', place:'午餐后回民宿午休', desc:'', tip:'' },
          { time:'15:00', place:'普宁寺', desc:'1小时足够，孩子看大佛会震撼', tip:'' },
          { time:'17:00', place:'武烈河边散步', desc:'', tip:'' },
          { time:'18:30', place:'晚餐', desc:'推荐有包间的餐厅', tip:'' }
        ]}]
      }
    ],
    foods: [
      { id:'f1', name:'老三羊汤', category:'breakfast', stars:4.8, distance:'步行8分钟', price:'¥25/人', tag:'30年老店', desc:'承德人从小吃到大的羊汤馆，汤白味浓，一定要配烧饼', rank:1, active:true },
      { id:'f2', name:'乔家满族八大碗', category:'lunch', stars:4.6, distance:'3公里', price:'¥60/人', tag:'满族风味', desc:'鹿肉、野猪肉、满族火锅，体验正宗满族大餐', rank:2, active:true },
      { id:'f3', name:'杏仁茶老店', category:'breakfast', stars:4.5, distance:'步行5分钟', price:'¥8/人', tag:'特色早餐', desc:'承德特产杏仁做的热饮，配煎饼果子一绝', rank:3, active:true },
      { id:'f4', name:'大清花饺子', category:'lunch', stars:4.4, distance:'2.5公里', price:'¥40/人', tag:'满族饺子', desc:'满族传统饺子馆，酸菜猪肉馅必点，量大实惠', rank:4, active:true },
      { id:'f5', name:'满族火锅城', category:'lunch', stars:4.3, distance:'3公里', price:'¥70/人', tag:'冬季首选', desc:'铜锅炭火，满族传统火锅，天冷时吃最舒服', rank:5, active:true },
      { id:'f6', name:'水泉沟烧烤夜市', category:'snack', stars:4.2, distance:'步行3分钟', price:'¥35/人', tag:'夜宵', desc:'本地人晚上的聚集地，烤串+啤酒，烟火气十足', rank:6, active:true },
      { id:'f7', name:'承德山楂糕', category:'snack', stars:4.7, distance:'特产店有售', price:'¥15/盒', tag:'必带特产', desc:'承德山楂是地理标志产品，酸甜可口', rank:7, active:true },
      { id:'f8', name:'承德露露杏仁露', category:'snack', stars:4.5, distance:'超市有售', price:'¥5/罐', tag:'本地饮品', desc:'承德本土品牌，杏仁含量高，比外面的浓很多', rank:8, active:true },
    ],
    scenicSpots: [
      {
        id:'s1', name:'避暑山庄', category:'皇家园林', location:'承德市双桥区丽正门大街', distance:'距民宿3km · 驾车约10分钟',
        openTime:'08:00-17:30', ticket:'¥130/人', duration:'3-4小时', tags:['世界遗产','5A'],
        history:'避暑山庄始建于康熙四十二年（1703年），历经康熙、雍正、乾隆三朝，耗时89年建成。它是中国现存最大的皇家园林，占地564万平方米，相当于颐和园的两倍，北海公园的八倍。\n\n康熙帝每年在此居住近半年，在此处理朝政、接见少数民族首领和外国使节。乾隆帝更是在此度过了大量时光，山庄内的"康乾七十二景"由此得名。\n\n1994年，避暑山庄及周围寺庙被联合国教科文组织列入世界文化遗产名录。',
        highlights:['丽正门 — 山庄正门，乾隆题"丽正门"石匾','澹泊敬诚殿 — 全部用楠木建成的主殿','烟雨楼 — 湖区最美建筑，《还珠格格》取景地','热河泉 — 世界最短的河，冬日不冻'],
        tips:'建议早上8点开门就入园，先去博物馆区（人少），然后乘船游湖，最后坐电瓶车上山。山庄内没有餐厅，建议自带干粮和水~',
        images:['🏛️','🏞️','🌊'], rating:4.7, reviewCount:'3.2万', sort:1, active:true
      },
      {
        id:'s2', name:'普陀宗乘之庙', category:'外八庙', location:'承德市双桥区狮子沟镇', distance:'距民宿4km · 驾车约12分钟',
        openTime:'08:00-17:30', ticket:'¥80/人', duration:'2小时', tags:['世界遗产'],
        history:'又称"小布达拉宫"，建于乾隆三十二年（1767年），是为庆祝乾隆六十寿辰和皇太后八十寿辰而建。仿西藏布达拉宫而建，是外八庙中规模最大的一座。\n\n大红台是普陀宗乘之庙的主体建筑，高43米，气势宏伟。庙内还有万法归一殿、权衡三界殿等精美建筑。',
        highlights:['大红台 — 43米高的主体建筑，雄伟壮观','万法归一殿 — 金顶辉煌','琉璃牌坊 — 精美绝伦','五塔门 — 藏式风格'],
        tips:'建议上午去，光线好适合拍照。可以和须弥福寿之庙一起游览，两庙相距不远，联票更划算。',
        images:['🛕','🏯','⛩️','🔔','📿'], rating:4.6, reviewCount:'1.8万', sort:2, active:true
      },
      {
        id:'s3', name:'磬锤峰', category:'奇峰异石', location:'承德市双桥区', distance:'距民宿2.5km · 驾车约8分钟',
        openTime:'08:00-17:30', ticket:'¥50/人', duration:'2小时', tags:['国家森林公园'],
        history:'俗称"棒槌山"，上粗下细形似棒槌，高38.29米。康熙皇帝赐名"磬锤峰"，是承德标志性自然景观。\n\n磬锤峰形成于约300万年前，是丹霞地貌的典型代表。清代皇帝多次登临赋诗，现为国家森林公园。',
        highlights:['磬锤峰主峰 — 38米高的奇石','缆车观光 — 俯瞰承德全景','蛤蟆石 — 形似蛤蟆的巨石','夕阳剪影 — 最佳拍摄时间'],
        tips:'推荐下午去，乘缆车上山，在山顶等日落，夕阳下的磬锤峰剪影是承德最美画面之一。缆车¥50单程。',
        images:['⛰️','🌅','🚡','🏔️'], rating:4.5, reviewCount:'1.2万', sort:3, active:true
      },
      {
        id:'s4', name:'普宁寺', category:'外八庙', location:'承德市双桥区普宁路', distance:'距民宿3.5km · 驾车约10分钟',
        openTime:'08:00-17:30', ticket:'¥80/人', duration:'1.5小时', tags:['世界遗产'],
        history:'建于乾隆二十年（1755年），是为纪念平定准噶尔叛乱而建。寺内供奉世界最大的木雕千手千眼观音菩萨，高22.28米，用松、柏、榆、杉、椴五种木材拼雕而成，重约110吨。',
        highlights:['千手观音 — 世界最大木雕佛像，22.28米','大乘之阁 — 汉藏结合建筑','天王殿 — 四大天王塑像','碑亭 — 满汉蒙藏四体文字'],
        tips:'千手观音非常震撼，站在大乘之阁楼下仰望才能真正感受其宏伟。寺内禁止对佛像拍照，请注意遵守。',
        images:['🛕','🙏','🏯'], rating:4.5, reviewCount:'1.5万', sort:4, active:true
      },
      {
        id:'s5', name:'须弥福寿之庙', category:'外八庙', location:'承德市双桥区狮子沟镇', distance:'距民宿4.2km · 驾车约12分钟',
        openTime:'08:00-17:30', ticket:'¥80/人（含普陀宗乘之庙联票）', duration:'1小时', tags:['世界遗产'],
        history:'建于乾隆四十五年（1780年），是为迎接六世班禅来承德祝贺乾隆七十寿辰而建，仿西藏扎什伦布寺风格。"须弥福寿"意为像须弥山一样福寿绵长。',
        highlights:['妙高庄严殿 — 鎏金铜瓦顶','琉璃万寿塔 — 八角七层','大红台 — 藏式红墙','金龙 — 殿顶八条鎏金铜龙'],
        tips:'规模比普陀宗乘之庙小，但金顶非常精美。建议和普陀宗乘之庙一起买联票游览，性价比更高。',
        images:['🛕','✨','🏯'], rating:4.4, reviewCount:'0.8万', sort:5, active:true
      },
      {
        id:'s6', name:'双塔山', category:'奇峰异石', location:'承德市双滦区', distance:'距民宿8km · 驾车约20分钟',
        openTime:'08:00-17:00', ticket:'¥50/人', duration:'2小时', tags:['自然奇观'],
        history:'双塔山是两座巨大的岩柱南北排列，北峰高约35米，南峰高约30米，峰顶各有一座辽代砖塔。两座古塔如何建在绝顶之上，至今仍是未解之谜。',
        highlights:['双塔奇观 — 峰顶辽代古塔','北峰塔 — 保存较完整','南峰塔 — 已部分坍塌','登山步道 — 森林氧吧'],
        tips:'距离市区稍远，建议安排半天时间。登山步道修得很好，适合徒步。人比磬锤峰少很多，体验更清静。',
        images:['⛰️','🗼'], rating:4.3, reviewCount:'0.5万', sort:6, active:true
      },
    ]
  };
}

// 先用同步默认数据初始化，避免 DB 为 Promise 导致渲染错误
// init() 中会用远程/缓存数据覆盖
let DB = (function() {
  try { const d = localStorage.getItem(DB_KEY); if (d) return JSON.parse(d); } catch(e) {}
  return getDefaultDB();
})();

// ==================== RENDER HELPERS ====================
let currentTab = 0;
let currentRouteType = 'day1';
let currentFoodCat = 'all';
let currentScenicCat = 'all';
let currentScenicId = null;
let currentDetailImgIdx = 0;

function isImageURL(str) {
  return str && (str.startsWith('http://') || str.startsWith('https://'));
}
// 图片加载失败时的全局回退函数（避免模板字符串嵌套转义问题）
window._imgFallback = function(el, h, iconSize) {
  el.outerHTML = '<div style=\"text-align:center;color:#fff;height:'+h+'px;display:flex;align-items:center;justify-content:center;\"><div style=\"font-size:'+iconSize+'px;\">🏛️</div></div>';
};

function renderScenicImage(image, size) {
  const h = size === 'detail' ? 180 : 130;
  const iconSize = size === 'detail' ? 50 : 42;
  if (isImageURL(image)) {
    return '<img src=\"' + image + '\" style=\"width:100%;height:' + h + 'px;object-fit:cover;display:block;\" alt=\"\" loading=\"lazy\" onerror=\"window._imgFallback(this,' + h + ',' + iconSize + ')\" />';
  } else {
    return '<div style=\"text-align:center;color:#fff;height:' + h + 'px;display:flex;align-items:center;justify-content:center;\"><div style=\"font-size:' + iconSize + 'px;\">' + (image || '🏛️') + '</div></div>';
  }
}

function switchTab(idx) {
  currentTab = idx;
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const secs = ['sec-home','sec-routes','sec-foods','sec-scenic','sec-my'];
  document.getElementById(secs[idx]).classList.add('active');
  document.getElementById('nav'+idx).classList.add('active');
  if (idx === 1) renderRoutes();
  if (idx === 2) renderFoods();
  if (idx === 3) { currentScenicId = null; document.getElementById('scenicList').style.display='block'; document.getElementById('scenicDetail').style.display='none'; renderScenicList(); }
  if (idx === 4) document.getElementById('myPwd').textContent = DB.password.code;
  window.scrollTo(0,0);
}

// ===== HOME =====
function updateWeather() {
  const now = new Date();
  const m = now.getMonth()+1;
  const h = now.getHours();
  let temp, desc, icon, sunrise, openTime;
  if (m>=6 && m<=8) { temp=24+Math.floor(Math.random()*10); desc=h>18?'晴转凉·适合散步':'晴·适合出游'; icon=h>18?'🌤️':'☀️'; sunrise='05:12'; openTime='08:00-17:30'; }
  else if (m>=3 && m<=5) { temp=12+Math.floor(Math.random()*12); desc='春意渐浓·适合出游'; icon='🌤️'; sunrise='06:15'; openTime='08:00-17:30'; }
  else if (m>=9 && m<=11) { temp=10+Math.floor(Math.random()*12); desc='秋高气爽·最佳旅游季'; icon='🍂'; sunrise='06:30'; openTime='08:00-17:00'; }
  else { temp=-8+Math.floor(Math.random()*10); desc='冬日暖阳·适合温泉'; icon='❄️'; sunrise='07:20'; openTime='08:30-16:30'; }
  // Use stored weather if available
  const tip = DB.dailyTip || {};
  const displayTemp = (typeof tip.temp === 'number' && !isNaN(tip.temp)) ? tip.temp : temp;
  document.getElementById('wIcon').textContent = icon;
  document.getElementById('wTemp').textContent = displayTemp + '°C';
  document.getElementById('wDesc').textContent = tip.weather || desc;
  document.getElementById('wSunrise').textContent = tip.sunrise || sunrise;
  document.getElementById('wOpenTime').textContent = tip.openTime || openTime;
  const days = ['日','一','二','三','四','五','六'];
  document.getElementById('heroDate').textContent = `${m}月${now.getDate()}日 周${days[now.getDay()]}`;
  document.getElementById('dailyTip').innerHTML = '<strong>💡 总管今日提醒：</strong>' + (tip.content || '今日山庄游人稀少，建议辰时入园~');
}

function copyToClipboard(text, successMsg, fallbackMsg) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        showToast(fallbackMsg || text);
      });
    } else {
      // Fallback for HTTP/non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position='fixed'; ta.style.left='-9999px';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); showToast(successMsg); }
      catch(e) { showToast(fallbackMsg || '📋 请手动记录: ' + text); }
      document.body.removeChild(ta);
    }
  } catch(e) {
    showToast(fallbackMsg || '📋 请手动记录: ' + text);
  }
}

function copyPassword() {
  const pwd = DB.password.code;
  copyToClipboard(pwd, '✅ 密码已复制: ' + pwd, '📋 密码: ' + pwd);
}

function copyWiFi() {
  const c = DB.config;
  const t = `WiFi: ${c.wifiName}\n密码: ${c.wifiPassword}`;
  copyToClipboard(t, '✅ WiFi信息已复制', '📋 ' + t);
}

function callHost() {
  window.location.href = 'tel:' + DB.config.hostPhone;
}

// ===== ROUTES =====
function renderRoutes() {
  const routes = DB.routes.filter(r => r.active);
  document.getElementById('routeTabs').innerHTML = routes.map(r =>
    `<button class="tab${r.type === currentRouteType ? ' active' : ''}" onclick="selectRoute('${r.type}')">${r.name}</button>`
  ).join('');
  selectRoute(currentRouteType);
}

function selectRoute(type) {
  const routes = DB.routes.filter(r => r.active);
  // BUG-003 fix: handle empty routes and missing type gracefully
  if (routes.length === 0) {
    document.getElementById('routeContent').innerHTML = '<div style="text-align:center;padding:30px;color:#999;font-size:13px;">📜 暂无可用路线<br><span style="font-size:10px;">请联系房东添加游玩路线</span></div>';
    return;
  }
  let route = routes.find(r => r.type === type);
  if (!route) {
    route = routes[0];
    type = route.type;
  }
  currentRouteType = type;
  document.querySelectorAll('#routeTabs .tab').forEach(t => t.classList.remove('active'));
  const btns = document.querySelectorAll('#routeTabs .tab');
  const idx = routes.findIndex(r => r.type === type);
  if (idx >= 0 && btns[idx]) btns[idx].classList.add('active');
  let html = '';
  route.days.forEach(day => {
    html += `<div class="day-label">📌 ${day.label}</div><div class="timeline">`;
    day.items.forEach(item => {
      html += `<div class="tl-item"><div class="tl-dot"></div>
        <div class="tl-time">⏰ ${item.time}</div>
        <div class="tl-text"><b>${item.place}</b> ${item.desc ? '— '+item.desc : ''}</div>
        ${item.tip ? `<div class="tl-note">${item.tip}</div>` : ''}
      </div>`;
    });
    html += '</div>';
  });
  document.getElementById('routeContent').innerHTML = html;
}

// ===== FOODS =====
function renderFoods() {
  const cats = [
    {key:'all', label:'全部推荐'},
    {key:'breakfast', label:'晨膳'},
    {key:'lunch', label:'正宴'},
    {key:'snack', label:'点心'}
  ];
  document.getElementById('foodTabs').innerHTML = cats.map(c =>
    `<button class="tab${currentFoodCat === c.key ? ' active' : ''}" onclick="selectFoodCat('${c.key}')">${c.label}</button>`
  ).join('');
  selectFoodCat(currentFoodCat);
}

function selectFoodCat(cat) {
  currentFoodCat = cat;
  document.querySelectorAll('#foodTabs .tab').forEach(t => t.classList.remove('active'));
  const btns = document.querySelectorAll('#foodTabs .tab');
  const cats = ['all','breakfast','lunch','snack'];
  const idx = cats.indexOf(cat);
  if (idx >= 0 && btns[idx]) btns[idx].classList.add('active');
  const foods = DB.foods.filter(f => f.active && (cat === 'all' || f.category === cat));
  foods.sort((a,b) => a.rank - b.rank);
  const rc = (r) => r===1?'':r===2?' style="background:#C0A080"':' style="background:#A0A0A0"';
  document.getElementById('foodList').innerHTML = foods.map(f => `
    <div class="food-item">
      <div class="food-rank"${rc(f.rank)}>${f.rank}</div>
      <div class="food-info">
        <div class="food-name">${f.name} <span class="food-stars">★ ${f.stars}</span><span class="food-tag">${f.tag}</span></div>
        <div class="food-meta">${f.distance} · ${f.price}</div>
        <div style="font-size:10px;color:#999;">${f.desc}</div>
      </div>
      <button class="food-nav-btn" onclick="event.stopPropagation();showToast('🗺️ 即将导航到: ${f.name}')">🧭导航</button>
    </div>
  `).join('');
}

// ===== SCENIC =====
function renderScenicList() {
  const cats = ['all','皇家园林','外八庙','奇峰异石','古迹遗址'];
  const labels = ['全部胜景','皇家园林','外八庙','奇峰异石','古迹遗址'];
  document.getElementById('scenicTabs').innerHTML = cats.map((c,i) =>
    `<button class="tab${currentScenicCat === c ? ' active' : ''}" onclick="selectScenicCat('${c}')">${labels[i]}</button>`
  ).join('');
  const search = (document.getElementById('scenicSearch')?.value || '').toLowerCase();
  let spots = DB.scenicSpots.filter(s => s.active && (currentScenicCat === 'all' || s.category === currentScenicCat));
  if (search) spots = spots.filter(s => s.name.includes(search) || s.history.includes(search) || s.location.includes(search));
  spots.sort((a,b) => a.sort - b.sort);

  const gradients = {
    '皇家园林': 'linear-gradient(135deg,#3D6B3C,#5B8C5A,#8AAF8A)',
    '外八庙': 'linear-gradient(135deg,#C9A96E,#D4B896,#E0C8A0)',
    '奇峰异石': 'linear-gradient(135deg,#6B5B4A,#8B7B6A,#A09080)',
    '古迹遗址': 'linear-gradient(135deg,#5C4A3A,#7B6B5A,#9A8A7A)'
  };
  const tagCls = (t) => t==='世界遗产'?'world':t==='5A'?'grade':'nature';

  document.getElementById('scenicCards').innerHTML = spots.map(s => `
    <div class="scenic-card" onclick="showScenicDetail('${s.id}')">
      <div class="scenic-img" style="${!isImageURL(s.images[0]) ? 'background:'+(gradients[s.category] || 'linear-gradient(135deg,#4A7A8C,#6A9AAC)')+';' : ''}">
        ${renderScenicImage(s.images[0], 'card')}
        <span class="img-count">📸 ${s.images.length}图</span>
      </div>
      <div class="scenic-body">
        <div class="scenic-title">
          <span class="scenic-name">${s.name}</span>
          ${s.tags.map(t => `<span class="scenic-tag ${tagCls(t)}">${t}</span>`).join('')}
        </div>
        <div class="scenic-location">📍 ${s.location} · ${s.distance}</div>
        <div class="scenic-desc">${s.history.replace(/\n/g,' ').slice(0,100)}...</div>
        <div class="scenic-meta">
          <span>🕐 ${s.openTime}</span><span>🎫 ${s.ticket}</span><span>⏱ ${s.duration}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function selectScenicCat(cat) {
  currentScenicCat = cat;
  renderScenicList();
}

function showScenicDetail(id) {
  currentScenicId = id;
  const s = DB.scenicSpots.find(sp => sp.id === id);
  if (!s) return;
  document.getElementById('scenicList').style.display = 'none';
  const gradients = {
    '皇家园林': 'linear-gradient(180deg,#3D6B3C,#5B8C5A,#8AAF8A)',
    '外八庙': 'linear-gradient(180deg,#C9A96E,#D4B896,#E0C8A0)',
    '奇峰异石': 'linear-gradient(180deg,#6B5B4A,#8B7B6A,#A09080)',
    '古迹遗址': 'linear-gradient(180deg,#5C4A3A,#7B6B5A,#9A8A7A)'
  };
  document.getElementById('scenicDetail').style.display = 'block';
  document.getElementById('scenicDetail').innerHTML = `
    <div class="detail-header" id="detailHeader" style="${!isImageURL(s.images[0]) ? 'background:'+(gradients[s.category] || 'linear-gradient(180deg,#4A7A8C,#6A9AAC)')+';' : 'background:#333;'} position:relative;">
      <div class="detail-back" onclick="closeScenicDetail()" style="z-index:3;">← 返回</div>
      <div id="detailImgDisplay" style="width:100%;height:180px;display:flex;align-items:center;justify-content:center;">
        ${renderScenicImage(s.images[0], 'detail')}
      </div>
      ${s.images.length > 1 ? `<div style="position:absolute;top:50%;left:8px;transform:translateY(-50%);z-index:3;background:rgba(0,0,0,0.4);color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;" onclick="navigateDetailImg(-1)">‹</div><div style="position:absolute;top:50%;right:8px;transform:translateY(-50%);z-index:3;background:rgba(0,0,0,0.4);color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;" onclick="navigateDetailImg(1)">›</div>` : ''}
      ${s.images.length > 1 ? `<div class="detail-img-dots" style="z-index:3;">${s.images.map((_,i) => `<div class="detail-img-dot${i===0?' active':''}" id="detailDot${i}" onclick="jumpDetailImg(${i})" style="cursor:pointer;"></div>`).join('')}</div>` : ''}
    </div>
    <div class="detail-body">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="font-size:18px;font-weight:900;color:#2C4A5A;">${s.name}</span>
        ${s.tags.map(t => `<span class="scenic-tag ${t==='世界遗产'?'world':t==='5A'?'grade':'nature'}">${t}</span>`).join('')}
      </div>
      <div style="font-size:10px;color:var(--gold);margin-bottom:10px;">★ ${s.rating} · ${s.reviewCount}条评价</div>
      <div class="detail-info-row">
        <div class="detail-info-item"><div class="di-label">🕐 开放时间</div><div class="di-val">${s.openTime}</div></div>
        <div class="detail-info-item"><div class="di-label">🎫 门票</div><div class="di-val">${s.ticket}</div></div>
        <div class="detail-info-item"><div class="di-label">⏱ 建议游玩</div><div class="di-val">${s.duration}</div></div>
      </div>
      <div class="detail-location">
        <span>📍</span>
        <div style="flex:1;"><div style="font-size:11px;font-weight:700;">${s.location}</div><div style="font-size:9px;color:#888;">${s.distance}</div></div>
        <div style="font-size:9px;background:var(--lake);color:#fff;padding:4px 10px;border-radius:10px;cursor:pointer;" onclick="showToast('🗺️ 即将导航到: ${s.name}')">🧭 导航</div>
      </div>
      <div class="detail-section">
        <h4>📜 历史渊源</h4>
        <p>${s.history.replace(/\n/g,'<br>')}</p>
      </div>
      <div class="detail-section">
        <h4>✨ 必看亮点</h4>
        ${s.highlights.map(h => `<div class="detail-highlight">${h}</div>`).join('')}
      </div>
      <div class="detail-tip"><strong>💡 房东游园Tips：</strong>${s.tips}</div>
    </div>
  `;
  window.scrollTo(0,0);
}

function navigateDetailImg(delta) {
  const s = DB.scenicSpots.find(sp => sp.id === currentScenicId);
  if (!s || s.images.length <= 1) return;
  currentDetailImgIdx = (currentDetailImgIdx + delta + s.images.length) % s.images.length;
  const display = document.getElementById('detailImgDisplay');
  if (display) display.innerHTML = renderScenicImage(s.images[currentDetailImgIdx], 'detail');
  s.images.forEach((_, i) => {
    const dot = document.getElementById('detailDot' + i);
    if (dot) dot.classList.toggle('active', i === currentDetailImgIdx);
  });
}
function jumpDetailImg(idx) {
  const s = DB.scenicSpots.find(sp => sp.id === currentScenicId);
  if (!s) return;
  currentDetailImgIdx = idx;
  const display = document.getElementById('detailImgDisplay');
  if (display) display.innerHTML = renderScenicImage(s.images[idx], 'detail');
  s.images.forEach((_, i) => {
    const dot = document.getElementById('detailDot' + i);
    if (dot) dot.classList.toggle('active', i === idx);
  });
}
function closeScenicDetail() {
  currentScenicId = null;
  currentDetailImgIdx = 0;
  document.getElementById('scenicList').style.display = 'block';
  document.getElementById('scenicDetail').style.display = 'none';
  // BUG-006 fix: preserve search state, don't clear search box
  renderScenicList();
  window.scrollTo(0,0);
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1800);
}

// ===== INIT =====
async function init() {
  const overlay = document.getElementById('loadingOverlay');

  try {
    // Load data (may fetch from remote)
    DB = await loadDB();
  } catch(e) {
    console.error('数据加载异常:', e);
    // 确保即使出错也有默认数据
    try { DB = getDefaultDB(); } catch(e2) {}
  }

  // 无论如何都要隐藏loading（CSS动画也会在10秒后兜底隐藏）
  if (overlay) overlay.classList.add('hidden');

  // 更新诊断横幅
  const banner = document.getElementById('diagBanner');
  if (banner) {
    banner.style.background = '#27ae60';
    banner.textContent = '✅ JS v' + APP_VERSION + ' | 数据源:' + (window._dataSource||'?') + ' | 景区:' + (DB.scenicSpots?DB.scenicSpots.length:'?') + '个 | 美食:' + (DB.foods?DB.foods.length:'?') + '个';
  }

  // Update data source indicator
  const ft = document.getElementById('dataFooter');
  if (ft) ft.style.display = 'block';
  const dot = document.getElementById('syncDot');
  const txt = document.getElementById('syncText');
  if (window._dataSource === 'remote') {
    dot.className = 'dot online';
    txt.textContent = '云端数据 · ' + (getCacheTimestamp() ? new Date(getCacheTimestamp()).toLocaleString('zh-CN') : '');
  } else if (window._dataSource === 'cache') {
    dot.className = 'dot offline';
    txt.textContent = '本地缓存 · ' + (getCacheTimestamp() ? new Date(getCacheTimestamp()).toLocaleString('zh-CN') : '');
  } else {
    dot.className = 'dot local';
    txt.textContent = '默认数据 · 请连接网络';
  }
  document.getElementById('appVersion').textContent = APP_VERSION;

  // Render UI
  document.getElementById('doorPwd').textContent = DB.password.code;
  updateWeather();
  renderRoutes();
  renderFoods();
  renderScenicList();

  // Periodically check for remote updates (every 5 minutes)
  if (REMOTE_DATA_URL && REMOTE_DATA_URL.startsWith('http')) {
    setInterval(async () => {
      try {
        const resp = await fetch(REMOTE_DATA_URL + '?t=' + Date.now());
        if (resp.ok) {
          const fresh = await resp.json();
          if (fresh && fresh.config) {
            const oldCode = DB.password.code;
            saveDB(fresh);
            setCacheTimestamp();
            DB = fresh;
            // Update visible password if changed
            if (fresh.password.code !== oldCode) {
              document.getElementById('doorPwd').textContent = fresh.password.code;
              const myPwd = document.getElementById('myPwd');
              if (myPwd) myPwd.textContent = fresh.password.code;
            }
            window._dataSource = 'remote';
            const dot = document.getElementById('syncDot');
            const txt = document.getElementById('syncText');
            if (dot) dot.className = 'dot online';
            if (txt) txt.textContent = '云端数据 · ' + new Date().toLocaleString('zh-CN');
          }
        }
      } catch(e) { /* silent refresh fail */ }
    }, 300000); // 5 min
  }
}
// 确保 init 一定会执行（处理 DOMContentLoaded 已触发的情况）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
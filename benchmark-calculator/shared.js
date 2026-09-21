/*
 * 급지표.html과 벤치마크_배율_계산기.html이 함께 쓰는 순수 함수 모음.
 * 브라우저에서는 window.SharedLib로, Node 테스트에서는 module.exports로 노출.
 */
(function(){
  function slugify(name){
    let s = String(name||'').trim().replace(/[\s()·,./\\]+/g, '-');
    s = s.replace(/-+/g, '-').replace(/^-|-$/g, '');
    return s || 'complex';
  }

  function ensureUniqueId(baseId, existingIds){
    let id = baseId, n = 2;
    while (existingIds.has(id)){ id = baseId + '-' + n; n++; }
    return id;
  }

  function toNum(v){
    if (v==null || v==='') return null;
    const n = Number(String(v).replace(/,/g,''));
    return Number.isFinite(n) ? n : null;
  }

  function parseComplexCsv(text){
    const lines = String(text||'').split(/\r?\n/);
    const rows = [];
    for (const raw of lines){
      const line = raw.trim();
      if (!line) continue;
      const cells = line.split(',');
      if (!/^\d{6}$/.test(cells[0]||'')) continue;
      const ym = parseInt(cells[0], 10);
      const mm = ym % 100;
      if (mm < 1 || mm > 12) continue;
      rows.push({
        ym,
        saleLow: toNum(cells[1]), saleMid: toNum(cells[2]), saleHigh: toNum(cells[3]),
        jeonseLow: toNum(cells[4]), jeonseMid: toNum(cells[5]), jeonseHigh: toNum(cells[6])
      });
    }
    const map = new Map();
    for (const r of rows) map.set(r.ym, r);
    return [...map.values()].sort((a,b)=>a.ym-b.ym);
  }

  function getLatestSaleMid(rows){
    if (!rows || !rows.length) return null;
    for (let i=rows.length-1; i>=0; i--){
      if (rows[i].saleMid!=null) return rows[i].saleMid;
    }
    return null;
  }

  // "갭투자금"(2026-09-22 세션) — 매매가-전세가 둘 다 있는 가장 최근 달을
  // 찾아 그 시점 기준으로 갭을 계산한다. getLatestSaleMid처럼 매매/전세를
  // 각자 따로 최신월을 찾으면 두 값이 서로 다른 달에서 온 걸 뺄 위험이
  // 있어(예: 전세만 한 달 먼저 끊긴 경우), 반드시 같은 달의 두 값만 쓴다.
  // 급지표.html·벤치마크_배율_계산기.html 두 화면이 이 값을 공유한다.
  function getLatestGapInvestment(rows){
    if (!rows || !rows.length) return null;
    for (let i=rows.length-1; i>=0; i--){
      const r = rows[i];
      if (r.saleMid!=null && r.jeonseMid!=null){
        return { gap: r.saleMid - r.jeonseMid, ym: r.ym, saleMid: r.saleMid, jeonseMid: r.jeonseMid };
      }
    }
    return null;
  }

  const FIXED_PRICE_BANDS = [
    { label: '30억 이상', min: 300000, max: Infinity },
    { label: '20~30억',   min: 200000, max: 300000 },
    { label: '15~20억',   min: 150000, max: 200000 },
    { label: '10~15억',   min: 100000, max: 150000 },
    { label: '5~10억',    min: 50000,  max: 100000 },
    { label: '5억 이하',  min: -Infinity, max: 50000 }
  ];

  function computePriceBands(entries){
    const bands = FIXED_PRICE_BANDS.map(b => ({ start: b.min, end: b.max, label: b.label, ids: [] }));
    entries.forEach(e => {
      const rows = parseComplexCsv(e.text);
      const price = getLatestSaleMid(rows);
      if (price == null) return;
      const band = bands.find(b => price >= b.start && price < b.end);
      if (band) band.ids.push(e.id);
    });
    return bands;
  }

  function ageLabel(builtYear, nowYear){
    if (builtYear==null) return '정보없음';
    const now = nowYear || new Date().getFullYear();
    return builtYear + '년 (' + (now - builtYear) + '년차)';
  }

  const api = { slugify, ensureUniqueId, parseComplexCsv, getLatestSaleMid, getLatestGapInvestment, computePriceBands, ageLabel };
  if (typeof module !== 'undefined' && module.exports){
    module.exports = api;
    if (typeof window !== 'undefined') window.SharedLib = api;
  } else {
    window.SharedLib = api;
  }
})();

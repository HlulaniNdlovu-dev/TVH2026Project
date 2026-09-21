const $ = (id) => document.getElementById(id);

async function post(path, body = {}) {
  const res = await fetch(`/api/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!data.ok) alert(data.message || 'Something went wrong');
  refresh();
  return data;
}

let lastNodeKey = '';

function fillSelect(select, nodes, keep) {
  const previous = select.value;
  select.innerHTML = nodes.map((n) => `<option value="${n.id}">${n.name} (${n.area})</option>`).join('');
  if (previous && nodes.some((n) => n.id === previous)) select.value = previous;
  else if (keep) select.value = keep;
}

function renderTree(nodes) {
  const substations = nodes.filter((n) => n.type === 'substation');
  const row = (n, label) => `
    <div class="node">
      <span class="dot ${n.powered ? '' : n.fault === 'loadshedding' ? 'ls' : 'off'}"></span>
      <span class="name">${label}${n.fault ? ` <span class="tag">${n.fault}</span>` : ''}</span>
      ${n.fault ? `<button class="small ok" data-restore="${n.id}">Restore</button>` : `<button class="small danger" data-trip="${n.id}">Trip</button>`}
    </div>`;
  $('tree').innerHTML = substations
    .map((s) => {
      const transformers = nodes.filter((n) => n.parentId === s.id);
      return `${row(s, `<strong>${s.name}</strong>`)}
        <div class="sub-node">
          ${transformers
            .map((t) => {
              const houses = nodes.filter((n) => n.parentId === t.id);
              return `${row(t, `<strong>${t.name}</strong>`)}
                <div class="sub-node houses">
                  ${houses.map((h) => row(h, `${h.meterNumber}${h.ownerName ? ` <span class="tag">${h.ownerName}</span>` : ''}`)).join('')}
                </div>`;
            })
            .join('')}
        </div>`;
    })
    .join('');
}

async function refresh() {
  let s;
  try {
    s = await (await fetch('/api/state')).json();
  } catch {
    $('status').className = 'status off';
    $('status').textContent = 'Simulator process not reachable';
    return;
  }
  $('status').className = `status ${s.connected ? 'on' : 'off'}`;
  $('status').textContent = s.connected ? `Connected to ${s.apiUrl}` : `Not connected: ${s.lastError ?? 'waiting for the API'}`;

  const off = s.nodes.filter((n) => !n.powered).length;
  $('gridSummary').textContent = `${s.nodes.length} sensors, ${off} without power, ${s.faultCount} active fault(s)`;

  const key = s.nodes.map((n) => n.id).join(',');
  if (key !== lastNodeKey) {
    lastNodeKey = key;
    fillSelect($('transformerSelect'), s.nodes.filter((n) => n.type === 'transformer'), 'TR-MAM-2');
    fillSelect($('substationSelect'), s.nodes.filter((n) => n.type === 'substation'));
    const areas = [...new Set(s.nodes.map((n) => n.area))];
    $('areaSelect').innerHTML = areas.map((a) => `<option>${a}</option>`).join('');
  }
  renderTree(s.nodes);

  $('techList').innerHTML = s.technicians
    .map((t) => `<li><span>${t.name}</span><span class="tag">${t.destination ? 'driving' : t.dutyStatus}</span></li>`)
    .join('') || '<li>No technicians yet</li>';
  $('log').innerHTML = s.log.map((l) => `<li class="${l.level}">${new Date(l.ts).toLocaleTimeString()}  ${l.message}</li>`).join('');
  if (document.activeElement !== $('speed')) $('speed').value = String(s.speedMultiplier);
  if (document.activeElement !== $('autoDrive')) $('autoDrive').checked = s.autoDrive;
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.dataset.scenario) post(`scenario/${t.dataset.scenario}`);
  if (t.dataset.trip) post('trip', { nodeId: t.dataset.trip });
  if (t.dataset.restore) post('restore', { nodeId: t.dataset.restore });
});
$('transformerBtn').onclick = () => post('scenario/transformer', { nodeId: $('transformerSelect').value });
$('substationBtn').onclick = () => post('scenario/substation', { nodeId: $('substationSelect').value });
$('lsBtn').onclick = () => post('loadshedding', { area: $('areaSelect').value, minutes: $('lsMinutes').value, overrun: $('lsOverrun').checked });
$('restoreAllBtn').onclick = () => post('restore-all');
$('resetBtn').onclick = () => confirm('Reset all backend data (accounts, incidents, notifications) to the seed state?') && post('reset-backend');
$('autoDrive').onchange = (e) => post('technicians', { autoDrive: e.target.checked });
$('speed').onchange = (e) => post('technicians', { speed: e.target.value });

refresh();
setInterval(refresh, 1500);

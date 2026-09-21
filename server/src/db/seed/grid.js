// Builds the demo grid: substations -> transformers -> houses (each house has one smart meter / sensor).
// Coordinates are approximate positions in east Tshwane.
const AREAS = [
  { name: 'Mamelodi', code: 'MAM', lat: -25.7069, lng: 28.3999, transformers: 3 },
  { name: 'Eersterust', code: 'EER', lat: -25.7099, lng: 28.3363, transformers: 3 },
  { name: 'Nellmapius', code: 'NEL', lat: -25.742, lng: 28.376, transformers: 2 },
];
const HOUSES_PER_TRANSFORMER = 6;
const STREETS = ['Tsamaya', 'Mthimkhulu', 'Sefako', 'Hans Strijdom', 'Church', 'Vlakfontein', 'Bloed', 'Sibande', 'Molefe', 'Kgosi', 'Marikana', 'Rooibos'];

const metersPerLat = 111320;
const offset = (lat, lng, northM, eastM) => ({
  lat: lat + northM / metersPerLat,
  lng: lng + eastM / (metersPerLat * Math.cos((lat * Math.PI) / 180)),
});

// Deterministic pseudo random so every fresh start looks identical.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildGrid() {
  const rand = rng(42);
  const nodes = [];
  let meterSeq = 0;
  const iso = new Date().toISOString();

  AREAS.forEach((area) => {
    const subId = `SUB-${area.code}`;
    nodes.push({
      id: subId, type: 'substation', name: `${area.name} Substation`, parentId: null, area: area.name,
      lat: area.lat, lng: area.lng, state: 'ON', watts: 0, voltage: 11000, battery: 100,
      lastHeartbeat: iso, offSince: null, graceUntil: null, offReason: null, forceConfirm: false, flickerCount: 0,
    });

    for (let t = 1; t <= area.transformers; t += 1) {
      const angle = ((t - 1) / area.transformers) * Math.PI * 2 + 0.6;
      const trPos = offset(area.lat, area.lng, Math.sin(angle) * 650, Math.cos(angle) * 650);
      const trId = `TR-${area.code}-${t}`;
      nodes.push({
        id: trId, type: 'transformer', name: `${area.name} Transformer ${t}`, parentId: subId, area: area.name,
        lat: trPos.lat, lng: trPos.lng, state: 'ON', watts: 0, voltage: 400, battery: 100,
        lastHeartbeat: iso, offSince: null, graceUntil: null, offReason: null, forceConfirm: false, flickerCount: 0,
      });

      for (let h = 1; h <= HOUSES_PER_TRANSFORMER; h += 1) {
        const hAngle = ((h - 1) / HOUSES_PER_TRANSFORMER) * Math.PI * 2 + rand() * 0.5;
        const dist = 90 + rand() * 60;
        const pos = offset(trPos.lat, trPos.lng, Math.sin(hAngle) * dist, Math.cos(hAngle) * dist);
        meterSeq += 1;
        const street = STREETS[Math.floor(rand() * STREETS.length)];
        nodes.push({
          id: `H-${area.code}-${t}-${h}`, type: 'house', name: `House ${h}`, parentId: trId, area: area.name,
          lat: pos.lat, lng: pos.lng, state: 'ON', watts: 0, voltage: 230, battery: 100,
          meterNumber: `0410${String(meterSeq).padStart(7, '0')}`,
          address: `${10 + Math.floor(rand() * 90)} ${street} Street, ${area.name}, Pretoria`,
          ownerId: null, critical: null,
          lastHeartbeat: iso, offSince: null, graceUntil: null, offReason: null, forceConfirm: false, flickerCount: 0,
        });
      }
    }
  });

  // Critical facilities raise an outage's priority.
  const critical = { 'H-MAM-1-1': 'Mamelodi Community Clinic', 'H-EER-2-3': 'Eersterust Water Pump Station' };
  nodes.forEach((n) => {
    if (critical[n.id]) {
      n.critical = critical[n.id];
      n.address = `${critical[n.id]}, ${n.area}, Pretoria`;
    }
  });

  return nodes;
}

export const AREA_NAMES = AREAS.map((a) => a.name);

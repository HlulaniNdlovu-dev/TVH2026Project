// Seeded accounts. Citizens can also register themselves; admin and technician accounts are seed-only.
const iso = () => new Date().toISOString();

function citizen(id, name, phone, email, houseIds, nodes, extra = {}) {
  const meters = houseIds.map((houseId, i) => {
    const house = nodes.find((n) => n.id === houseId);
    house.ownerId = id;
    return {
      meterNumber: house.meterNumber,
      label: i === 0 ? 'Home' : 'Rental property',
      address: house.address,
      lat: house.lat,
      lng: house.lng,
    };
  });
  return {
    id, role: 'citizen', name, phone, email, password: 'password',
    address: meters[0].address, lat: meters[0].lat, lng: meters[0].lng,
    meters, prefs: { inApp: true, sms: true }, medical: false, createdAt: iso(), ...extra,
  };
}

export function buildUsers(nodes) {
  const citizens = [
    citizen('U-1001', 'Thandi Mokoena', '0821234567', 'thandi@example.com', ['H-MAM-1-2', 'H-MAM-2-1'], nodes),
    citizen('U-1002', 'Sipho Dlamini', '0831234567', 'sipho@example.com', ['H-MAM-1-3'], nodes),
    citizen('U-1003', 'Lerato Khumalo', '0841234567', 'lerato@example.com', ['H-MAM-1-4'], nodes),
    citizen('U-1004', 'Johan Botha', '0851234567', 'johan@example.com', ['H-EER-1-1'], nodes),
    citizen('U-1005', 'Zanele Ngcobo', '0861234567', 'zanele@example.com', ['H-NEL-1-2'], nodes, { medical: true }),
  ];

  const tech = (id, employeeId, name, phone, dutyStatus, lat, lng, skills) => ({
    id, role: 'technician', name, phone, email: `${name.split(' ')[0].toLowerCase()}@powerlink.example`,
    password: 'password', employeeId,
    tech: { dutyStatus, lat, lng, skills, lastLocationAt: iso() },
    createdAt: iso(),
  });
  const technicians = [
    tech('T-101', 'PL-101', 'Thabo Maseko', '0711111111', 'available', -25.7142, 28.3921, ['house', 'transformer', 'substation']),
    tech('T-102', 'PL-102', 'Nomsa Zulu', '0722222222', 'available', -25.7112, 28.3411, ['house', 'transformer']),
    tech('T-103', 'PL-103', 'Pieter van Wyk', '0733333333', 'available', -25.7385, 28.3702, ['house', 'transformer']),
    tech('T-104', 'PL-104', 'Kagiso Molefe', '0744444444', 'unavailable', -25.7201, 28.3655, ['house']),
  ];

  const admins = [
    { id: 'A-002', role: 'admin', name: 'Martha Peter', phone: '0000000001', email: 'martha.peter@powerlink.example', password: 'test1234!', createdAt: iso() },
    { id: 'A-003', role: 'admin', name: 'Elize Koetzee', phone: '0000000011', email: 'elize.koetzee@powerlink.example', password: 'test1234!', createdAt: iso() },
  ];
  technicians.push(
    tech('T-105', 'PL-105', 'Nomsa Zwane', '0000000111', 'available', -25.7069, 28.3999, ['house', 'transformer']),
    tech('T-106', 'PL-106', 'Thabo Zulu', '0000001111', 'available', -25.7099, 28.3363, ['house', 'transformer']),
  );
  technicians.slice(-2).forEach((t) => { t.password = 'test1234!'; });

  const admin = {
    id: 'A-001', role: 'admin', name: 'Palesa Ndlovu', phone: '0700000000', email: 'admin@powerlink.example',
    password: 'admin', createdAt: iso(),
  };

  return [...citizens, ...technicians, admin, ...admins];
}

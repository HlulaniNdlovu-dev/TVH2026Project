// Prepaid electricity units (kWh) left on a smart meter. Meters that have never reported start with a believable
// balance derived from the meter number, so every house has a stable, different starting figure.
export const defaultUnits = (node) => 30 + ((Number(String(node.meterNumber ?? node.id).replace(/\D/g, '').slice(-6)) || 0) * 37) % 90;
export const unitsOf = (node) => (typeof node?.units === 'number' ? node.units : defaultUnits(node ?? {}));

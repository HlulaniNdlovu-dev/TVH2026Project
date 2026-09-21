import L from 'leaflet';

// Custom div icons avoid Leaflet's default marker images, which do not bundle cleanly with Vite.
const icon = (html, size) => L.divIcon({ className: 'pl-marker', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });

export const substationIcon = (off) => icon(`<div class="mk mk-sub ${off ? 'mk-off' : ''}">S</div>`, 30);
export const transformerIcon = (off) => icon(`<div class="mk mk-tr ${off ? 'mk-off' : ''}">T</div>`, 24);
export const incidentIcon = () => icon('<div class="mk-incident"><span></span></div>', 40);
export const siteIcon = () => icon('<div class="mk-incident"><span></span></div>', 40);
export const homeIcon = () => icon('<div class="mk mk-home">H</div>', 30);
export const technicianIcon = (name, tone = 'green') => {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return icon(`<div class="mk mk-tech mk-${tone}">${initials}</div>`, 30);
};

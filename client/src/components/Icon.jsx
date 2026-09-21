// Small stroke icon set so the app has no icon-library dependency.
const ICONS = {
  home: ['M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'],
  dashboard: ['M3 3h8v8H3z', 'M13 3h8v5h-8z', 'M13 10h8v11h-8z', 'M3 13h8v8H3z'],
  alert: ['M12 3l10 18H2z', 'M12 10v4', 'M12 17.5h.01'],
  bell: ['M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8', 'M13.7 21a2 2 0 0 1-3.4 0'],
  user: ['c:12,7,4', 'M20 21a8 8 0 0 0-16 0'],
  users: ['M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2', 'c:10,7,4', 'M21 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  tasks: ['M9 3h6v3H9z', 'M7 5H5v16h14V5h-2', 'M9 12h6', 'M9 16h4'],
  clock: ['c:12,12,9', 'M12 7v5l3 2'],
  map: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z', 'M9 4v14', 'M15 6v14'],
  bolt: ['M13 2L4 14h7l-1 8 9-12h-7z'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  chart: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 20h16'],
  sensor: ['M5 5h14v14H5z', 'M9 9h6v6H9z', 'M9 2v3', 'M15 2v3', 'M9 19v3', 'M15 19v3', 'M2 9h3', 'M2 15h3', 'M19 9h3', 'M19 15h3'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
  logout: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  check: ['M20 6L9 17l-5-5'],
  x: ['M18 6L6 18', 'M6 6l12 12'],
  plus: ['M12 5v14', 'M5 12h14'],
  pin: ['M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z', 'c:12,10,2.5'],
  navigate: ['M3 11l19-9-9 19-2-8z'],
  report: ['M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z', 'M14 3v5h5', 'M9 13h6', 'M9 17h4'],
  camera: ['M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z', 'c:12,13,4'],
  truck: ['M1 3h15v13H1z', 'M16 8h4l3 3v5h-7z', 'c:5.5,18.5,2', 'c:18.5,18.5,2'],
  refresh: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.5 9a9 9 0 0 1 14.9-3.4L23 10', 'M1 14l4.6 4.4A9 9 0 0 0 20.5 15'],
  wrench: ['M14.7 6.3a4 4 0 0 0 5 5L21 12.6 12.6 21 3 11.4 11.4 3z'],
  power: ['M12 2v10', 'M18.4 6.6a9 9 0 1 1-12.8 0'],
};

export default function Icon({ name, size = 20, className = '' }) {
  const parts = ICONS[name] ?? [];
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {parts.map((part) => {
        if (part.startsWith('c:')) {
          const [cx, cy, r] = part.slice(2).split(',');
          return <circle key={part} cx={cx} cy={cy} r={r} />;
        }
        return <path key={part} d={part} />;
      })}
    </svg>
  );
}

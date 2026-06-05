const KEY_BUILDINGS = 'campus-overrides';
const KEY_PATHS = 'campus-paths';
const KEY_ZONES = 'campus-zone-overrides';

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || fallback); }
  catch { return JSON.parse(fallback); }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const loadBuildings = () => read(KEY_BUILDINGS, '{}');
export const saveBuildings = (v) => write(KEY_BUILDINGS, v);

export const loadPaths = () => read(KEY_PATHS, '[]');
export const savePaths = (v) => write(KEY_PATHS, v);

export const loadZones = () => read(KEY_ZONES, '{}');
export const saveZones = (v) => write(KEY_ZONES, v);

export function exportAll() {
  return {
    buildings: loadBuildings(),
    paths: loadPaths(),
    zones: loadZones(),
  };
}
export function resetAll() {
  localStorage.removeItem(KEY_BUILDINGS);
  localStorage.removeItem(KEY_PATHS);
  localStorage.removeItem(KEY_ZONES);
}

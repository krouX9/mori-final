// ============================================================================
//  File-based overrides — baseline transforms loaded from a JSON file
// ----------------------------------------------------------------------------
//  Drop a `corrected.json` at src/data/ (the Export overrides button in dev
//  mode produces this exact format). On boot, its `buildings` map is merged
//  *underneath* the user's live localStorage overrides — so the file is the
//  baked-in baseline and any new dev tweaks persist on top.
//
//  Reset overrides in dev mode only clears localStorage; it does NOT clear
//  the file. Edit src/data/corrected.json directly to change the baseline.
// ============================================================================

// import.meta.glob with eager:true makes the import optional — if the file
// doesn't exist yet, the map is empty and we just return defaults.
const fileGlob = import.meta.glob('./corrected.json', { eager: true });
const file = Object.values(fileGlob)[0]?.default ?? null;

export function getFileBuildingOverrides() {
  return file?.buildings ?? {};
}
export function getFilePathOverrides() {
  return Array.isArray(file?.paths) ? file.paths : [];
}
export function getFileZoneOverrides() {
  return Array.isArray(file?.zones) ? file.zones : [];
}
export function hasFileOverrides() {
  return !!file;
}

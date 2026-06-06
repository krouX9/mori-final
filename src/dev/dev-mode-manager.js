export class DevModeManager {
  constructor({ transformEditor, pathEditor, zoneEditor, zoneDrawEditor, onModeChange }) {
    this.transformEditor = transformEditor;
    this.pathEditor = pathEditor;
    this.zoneEditor = zoneEditor;
    this.zoneDrawEditor = zoneDrawEditor;
    this.onModeChange = onModeChange;
    this.mode = 'buildings';
    this.pathType = 'pedestrian';
    this.zoneType = 'garden';
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.exitMode(this.mode);
    this.mode = mode;
    this.enterMode(mode);
    if (this.onModeChange) this.onModeChange(mode);
  }

  exitMode(mode) {
    if (mode === 'buildings') this.transformEditor?.deselect();
    else if (mode === 'draw-path') this.pathEditor?.deactivate();
    else if (mode === 'edit-zones') this.zoneEditor?.deactivate();
    else if (mode === 'draw-zone')  this.zoneDrawEditor?.deactivate();
  }

  enterMode(mode) {
    if (mode === 'draw-path') this.pathEditor?.activate(this.pathType);
    else if (mode === 'edit-zones') this.zoneEditor?.activate();
    else if (mode === 'draw-zone')  this.zoneDrawEditor?.activate(this.zoneType);
  }

  setPathType(type) {
    this.pathType = type;
    if (this.mode === 'draw-path') this.pathEditor?.setType(type);
  }

  setZoneType(type) {
    this.zoneType = type;
    if (this.mode === 'draw-zone') this.zoneDrawEditor?.setType(type);
  }

  getMode() { return this.mode; }
}

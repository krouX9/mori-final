export class DevModeManager {
  constructor({ transformEditor, pathEditor, zoneEditor, onModeChange }) {
    this.transformEditor = transformEditor;
    this.pathEditor = pathEditor;
    this.zoneEditor = zoneEditor;
    this.onModeChange = onModeChange;
    this.mode = 'buildings';
    this.pathType = 'pedestrian';
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
  }

  enterMode(mode) {
    if (mode === 'draw-path') this.pathEditor?.activate(this.pathType);
    else if (mode === 'edit-zones') this.zoneEditor?.activate();
  }

  setPathType(type) {
    this.pathType = type;
    if (this.mode === 'draw-path') this.pathEditor?.setType(type);
  }

  getMode() { return this.mode; }
}

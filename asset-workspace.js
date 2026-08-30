export class AssetWorkspaceState {
  constructor() {
    this.asset = {
      id: 'CR-02',
      name: 'Walk-in cold room CR-02',
      location: 'Isla Verde Hotel · Kitchen level',
      temperatureC: 8.0,
      condenserFan: 'Intermittent noise',
      compressor: 'Running'
    };
    this.inspectionFocus = '';
    this.preparedNote = '';
    this.savedNote = '';
    this.savedAt = null;
  }

  readAssetContext() {
    return {
      asset: { ...this.asset },
      inspectionFocus: this.inspectionFocus || null,
      preparedNote: this.preparedNote || null,
      lastSavedNote: this.savedNote || null,
      noteIsSaved: Boolean(this.preparedNote && this.preparedNote === this.savedNote),
      savedAt: this.savedAt
    };
  }

  setInspectionFocus(focus) {
    const clean = String(focus).trim().slice(0, 240);
    if (!clean) throw new Error('Inspection focus cannot be empty.');
    this.inspectionFocus = clean;
    return { ok: true, focus: clean };
  }

  prepareInspectionNote(note) {
    const clean = String(note).trim();
    if (!clean) throw new Error('Inspection note cannot be empty.');
    if (clean.length > 1200) throw new Error('Inspection note cannot exceed 1200 characters.');
    this.preparedNote = clean;
    return { ok: true, draft: clean, saved: false };
  }

  syncPreparedNote(note) {
    const value = String(note ?? '');
    if (value.length > 1200) throw new Error('Inspection note cannot exceed 1200 characters.');
    this.preparedNote = value;
    return this.readAssetContext();
  }

  saveInspectionNote(note, savedAt = Date.now()) {
    const clean = String(note).trim();
    if (!clean) throw new Error('Inspection note cannot be empty.');
    if (clean.length > 1200) throw new Error('Inspection note cannot exceed 1200 characters.');
    this.preparedNote = clean;
    this.savedNote = clean;
    this.savedAt = savedAt;
    return { ok: true, saved: true, note: clean, savedAt };
  }

  clearPreparedNote() {
    this.preparedNote = '';
    return this.readAssetContext();
  }
}

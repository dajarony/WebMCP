import test from 'node:test';
import assert from 'node:assert/strict';
import { AssetWorkspaceState } from '../asset-workspace.js';

test('asset note is unsaved while only prepared', () => {
  const workspace = new AssetWorkspaceState();
  workspace.prepareInspectionNote('Check fan guard clearance.');

  const context = workspace.readAssetContext();
  assert.equal(context.preparedNote, 'Check fan guard clearance.');
  assert.equal(context.lastSavedNote, null);
  assert.equal(context.noteIsSaved, false);
});

test('asset note reports saved after explicit human save', () => {
  const workspace = new AssetWorkspaceState();
  workspace.prepareInspectionNote('Check fan guard clearance.');
  workspace.saveInspectionNote('Check fan guard clearance.', 1234);

  const context = workspace.readAssetContext();
  assert.equal(context.noteIsSaved, true);
  assert.equal(context.lastSavedNote, 'Check fan guard clearance.');
  assert.equal(context.savedAt, 1234);
});

test('new draft does not masquerade as the previously saved note', () => {
  const workspace = new AssetWorkspaceState();
  workspace.saveInspectionNote('First note.', 1234);
  workspace.prepareInspectionNote('Revised unsaved note.');

  const context = workspace.readAssetContext();
  assert.equal(context.noteIsSaved, false);
  assert.equal(context.preparedNote, 'Revised unsaved note.');
  assert.equal(context.lastSavedNote, 'First note.');
});

test('clearing the form clears only the current draft, not saved history', () => {
  const workspace = new AssetWorkspaceState();
  workspace.saveInspectionNote('Saved observation.', 1234);
  workspace.clearPreparedNote();

  const context = workspace.readAssetContext();
  assert.equal(context.preparedNote, null);
  assert.equal(context.lastSavedNote, 'Saved observation.');
  assert.equal(context.noteIsSaved, false);
});

test('human typing synchronizes the current draft without marking it saved', () => {
  const workspace = new AssetWorkspaceState();
  workspace.saveInspectionNote('Saved observation.', 1234);
  workspace.syncPreparedNote('Human unsaved revision.');

  const context = workspace.readAssetContext();
  assert.equal(context.preparedNote, 'Human unsaved revision.');
  assert.equal(context.lastSavedNote, 'Saved observation.');
  assert.equal(context.noteIsSaved, false);
});

test('inspection note runtime state rejects content beyond the declared bound', () => {
  const workspace = new AssetWorkspaceState();
  assert.throws(() => workspace.prepareInspectionNote('x'.repeat(1201)), /cannot exceed 1200/);
  assert.throws(() => workspace.syncPreparedNote('x'.repeat(1201)), /cannot exceed 1200/);
  assert.throws(() => workspace.saveInspectionNote('x'.repeat(1201)), /cannot exceed 1200/);
});

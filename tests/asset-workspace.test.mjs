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

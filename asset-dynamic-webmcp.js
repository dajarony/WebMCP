function json(value) {
  return JSON.stringify(value, null, 2);
}

export const ASSET_COMPONENT_IDS = Object.freeze([
  'condenser-fan',
  'compressor'
]);

export function createAssetDynamicWebMCPTools(assetApi, selectedComponent) {
  if (!selectedComponent) return [];
  if (!ASSET_COMPONENT_IDS.includes(selectedComponent)) {
    throw new Error(`Unsupported asset component: ${selectedComponent}`);
  }

  return [
    {
      name: 'read_selected_component',
      description: 'Read detailed telemetry and diagnostic context for the component currently selected in the shared Asset Inspector page.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true
      },
      execute: async () => json(assetApi.readSelectedComponent())
    },
    {
      name: 'prepare_component_test',
      description: 'Prepare a safe inspection checklist for the currently selected component. This only updates the shared page and performs no physical or external action.',
      inputSchema: {
        type: 'object',
        properties: {
          test: {
            type: 'string',
            enum: ['visual-check', 'sound-check', 'temperature-check'],
            description: 'Inspection checklist to prepare for the selected component.'
          }
        },
        required: ['test'],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: true
      },
      execute: async ({ test }) => json(assetApi.prepareComponentTest(test))
    }
  ];
}

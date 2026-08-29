function json(value) {
  return JSON.stringify(value, null, 2);
}

export async function registerAssetWebMCPTools(assetApi) {
  const tools = [
    {
      name: 'read_asset_context',
      description: 'Read the current asset telemetry, inspection focus and prepared inspection note from the Asset Inspector page.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true
      },
      execute: async () => json(assetApi.readAssetContext())
    },
    {
      name: 'set_inspection_focus',
      description: 'Set the inspection focus shown in the shared Asset Inspector workspace. This prepares the human inspection and performs no external action.',
      inputSchema: {
        type: 'object',
        properties: {
          focus: {
            type: 'string',
            minLength: 1,
            maxLength: 240,
            description: 'Specific component or diagnostic question the human should inspect next.'
          }
        },
        required: ['focus'],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: true
      },
      execute: async ({ focus }) => json(assetApi.setInspectionFocus(focus))
    },
    {
      name: 'prepare_inspection_note',
      description: 'Prepare text inside the visible inspection-note form for human review. This tool does not submit or finalize the note.',
      inputSchema: {
        type: 'object',
        properties: {
          note: {
            type: 'string',
            minLength: 1,
            maxLength: 1200,
            description: 'Inspection note draft to place in the page form.'
          }
        },
        required: ['note'],
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: true
      },
      execute: async ({ note }) => json(assetApi.prepareInspectionNote(note))
    }
  ];

  for (const tool of tools) {
    await document.modelContext.registerTool(tool);
  }

  return tools.map((tool) => tool.name);
}

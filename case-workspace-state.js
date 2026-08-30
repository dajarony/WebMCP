export function normalizeWorkPlanSteps(steps) {
  if (!Array.isArray(steps) || steps.length < 1 || steps.length > 8) {
    throw new Error('A work plan requires between 1 and 8 steps.');
  }

  return steps.map((step) => {
    if (typeof step !== 'string') throw new Error('Each work-plan step must be text.');
    const clean = step.trim();
    if (!clean) throw new Error('Work-plan steps cannot be empty.');
    if (clean.length > 240) throw new Error('Work-plan steps cannot exceed 240 characters.');
    return clean;
  });
}

// Centralized logic for sourcing tutorial videos for a task/process.

export function getTaskVideoQuery(taskTitle: string) {
  return taskTitle ? `how to complete ${taskTitle}` : '';
}

export function getPrimaryMaterialPrepQuery(primaryMaterial: string, taskTitle: string) {
  return primaryMaterial && taskTitle
    ? `how to prepare ${primaryMaterial} for ${taskTitle}`
    : '';
}

// Backward-compatible aliases used by older callers.
export function getRepairVideoQuery(taskTitle: string) {
  return getTaskVideoQuery(taskTitle);
}

export function getMainPartPrepQuery(mainPart: string, taskTitle: string) {
  return getPrimaryMaterialPrepQuery(mainPart, taskTitle);
}

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
export function getProjectVideoQuery(projectTitle: string) {
  return getTaskVideoQuery(projectTitle);
}

export function getBaseMaterialPrepQuery(baseMaterial: string, projectTitle: string) {
  return getPrimaryMaterialPrepQuery(baseMaterial, projectTitle);
}

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
export function getShipmentVideoQuery(routeTitle: string) {
  return getTaskVideoQuery(routeTitle);
}

export function getMainItemPrepQuery(mainItem: string, routeTitle: string) {
  return getPrimaryMaterialPrepQuery(mainItem, routeTitle);
}

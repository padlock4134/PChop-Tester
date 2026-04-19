// Centralized logic for sourcing tutorial videos for a task/process.

export function getTaskVideoQuery(taskTitle: string) {
  return taskTitle ? `HVAC how to ${taskTitle}` : '';
}

export function getPrimaryMaterialPrepQuery(primaryMaterial: string, taskTitle: string) {
  return primaryMaterial && taskTitle
    ? `HVAC ${primaryMaterial} for ${taskTitle} tutorial`
    : '';
}

// Backward-compatible aliases used by older callers.
export function getMealVideoQuery(recipeTitle: string) {
  return getTaskVideoQuery(recipeTitle);
}

export function getMainIngredientPrepQuery(mainIngredient: string, recipeTitle: string) {
  return getPrimaryMaterialPrepQuery(mainIngredient, recipeTitle);
}

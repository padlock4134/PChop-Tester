export function isAdminRole(name: string) {
  // Should match the Admin "name" field, i.e. "app:<app_domain_name>:admin"
  return /^app:.*:admin$/.test(name);
}

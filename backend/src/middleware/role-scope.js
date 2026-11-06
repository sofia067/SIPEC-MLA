export const DEFAULT_AREA_MANAGER_AREA = 'Subgerencia de Logística y Control Patrimonial';

export function getAreaScope(user) {
  if (user.role !== 'area_manager') return null;
  const configuredArea = user.areaName?.trim();
  if (!configuredArea) return DEFAULT_AREA_MANAGER_AREA;
  const normalizedArea = configuredArea.toLocaleLowerCase('es').replace(/^(subgerencia|gerencia) de\s+/, '');
  if (normalizedArea.includes('log') && normalizedArea.includes('control patrimonial')) {
    return DEFAULT_AREA_MANAGER_AREA;
  }
  return configuredArea;
}

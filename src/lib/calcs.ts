import type { Episode } from '@/types';

/**
 * NOTA: Los cálculos de precios, ajustes y montos finales son ahora responsabilidad del backend
 * o se ingresan manualmente por el equipo de Finanzas. Este archivo mantiene solo funciones
 * de utilidad para validaciones.
 */

/**
 * Verifica si un episodio tiene los campos mínimos requeridos para exportación
 */
export function isReady(ep: Episode): boolean {
  return !!(
    ep.validado &&
    ep.centro &&
    ep.folio &&
    ep.episodio &&
    ep.rut &&
    ep.nombre
  );
}

/**
 * Verifica si un episodio tiene la información financiera completa
 */
export function hasCompleteFinancialData(ep: Episode): boolean {
  return !!(
    ep.estadoRN &&
    ep.at !== undefined &&
    ep.montoRN !== undefined &&
    ep.valorGRD !== undefined &&
    ep.montoFinal !== undefined
  );
}

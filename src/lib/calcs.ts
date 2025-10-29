import type { Episode } from '@/types';

/**
 * Calcula los valores derivados de un episodio
 */
export function computeValores(ep: Episode, preciosTramo: Map<string, number>, atPrecios: Map<string, number>) {
  const base = preciosTramo.get(ep.grdCodigo || '') || 0;
  const at = ep.at ? (atPrecios.get(ep.atDetalle || '') || 0) : 0;
  const valorGRD = (ep.peso || 0) * base;
  const pagoOutlierSup = ep.inlierOutlier === 'Outlier' ? valorGRD * 0.1 : 0; // Ejemplo
  const pagoDemora = ep.diasDemoraRescate ? ep.diasDemoraRescate * 1000 : 0; // Ejemplo
  const montoFinal = valorGRD + at + pagoOutlierSup + pagoDemora;

  return {
    base,
    at,
    valorGRD,
    pagoOutlierSup,
    pagoDemora,
    montoFinal
  };
}

/**
 * Verifica si un episodio está listo para exportación
 */
export function isReady(ep: Episode): boolean {
  return !!(
    ep.validado &&
    ep.centro &&
    ep.folio &&
    ep.estadoRN &&
    ep.at !== undefined &&
    ep.diasDemoraRescate !== undefined
  );
}

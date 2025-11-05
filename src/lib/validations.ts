import type { Episode } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valida los campos de cálculo y pre-facturación de un episodio
 */
export function validateFinanzasFields(episodio: Episode): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar montos positivos
  if (episodio.montoRN !== undefined && episodio.montoRN < 0) {
    errors.push('El monto RN debe ser positivo');
  }

  if (episodio.pagoDemora !== undefined && episodio.pagoDemora !== null && episodio.pagoDemora < 0) {
    errors.push('El pago por demora debe ser positivo');
  }

  if (episodio.pagoOutlierSup !== undefined && episodio.pagoOutlierSup !== null && episodio.pagoOutlierSup < 0) {
    errors.push('El pago por outlier superior debe ser positivo');
  }

  if (episodio.precioBaseTramo !== undefined && episodio.precioBaseTramo < 0) {
    errors.push('El precio base por tramo debe ser positivo');
  }

  if (episodio.valorGRD !== undefined && episodio.valorGRD < 0) {
    errors.push('El valor GRD debe ser positivo');
  }

  if (episodio.montoFinal !== undefined && episodio.montoFinal < 0) {
    errors.push('El monto final debe ser positivo');
  }

  // Validar consistencia de cálculos
  if (episodio.peso && episodio.precioBaseTramo && episodio.valorGRD) {
    const valorCalculado = episodio.peso * episodio.precioBaseTramo;
    const diferencia = Math.abs(valorCalculado - episodio.valorGRD);
    if (diferencia > 0.01) { // Tolerancia de 1 centavo
      warnings.push(`El valor GRD (${episodio.valorGRD}) no coincide con el cálculo (${valorCalculado})`);
    }
  }

  // Validar estado RN
  if (episodio.estadoRN && !['Aprobado', 'Pendiente', 'Rechazado'].includes(episodio.estadoRN)) {
    errors.push('El estado RN debe ser: Aprobado, Pendiente o Rechazado');
  }

  // Validar días de demora
  if (episodio.diasDemoraRescate !== undefined && episodio.diasDemoraRescate < 0) {
    errors.push('Los días de demora rescate no pueden ser negativos');
  }

  if (episodio.diasDemoraRescate !== undefined && episodio.diasDemoraRescate > 365) {
    warnings.push('Los días de demora rescate son muy altos (>365 días)');
  }

  // Validar montos excesivos
  if (episodio.montoFinal && episodio.montoFinal > 10000000) { // 10 millones
    warnings.push('El monto final es muy alto (>$10,000,000)');
  }

  if (episodio.montoRN && episodio.montoRN > 10000000) {
    warnings.push('El monto RN es muy alto (>$10,000,000)');
  }

  // Validar consistencia de outlier
  if (episodio.inlierOutlier === 'Outlier' && episodio.pagoOutlierSup === 0) {
    warnings.push('Episodio marcado como Outlier pero sin pago por outlier superior');
  }

  if (episodio.inlierOutlier !== 'Outlier' && episodio.pagoOutlierSup && episodio.pagoOutlierSup > 0) {
    warnings.push('Episodio no es Outlier pero tiene pago por outlier superior');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Valida un valor específico según su tipo de campo
 */
export function validateFieldValue(field: string, value: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar campos numéricos
  if (field.includes('monto') || field.includes('pago') || field.includes('precio') || field.includes('valor')) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      errors.push('El valor debe ser un número válido');
    } else if (numValue < 0) {
      errors.push('El valor debe ser positivo');
    } else if (numValue > 10000000) {
      warnings.push('El valor es muy alto (>$10,000,000)');
    }
  }

  // Validar días
  if (field === 'diasDemoraRescate') {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      errors.push('Los días deben ser un número entero válido');
    } else if (numValue < 0) {
      errors.push('Los días no pueden ser negativos');
    } else if (numValue > 365) {
      warnings.push('Los días son muy altos (>365)');
    }
  }

  // Validar estado RN
  if (field === 'estadoRN') {
    // Permitir vacío (se enviará como null)
    if (value && value !== '' && !['Aprobado', 'Pendiente', 'Rechazado'].includes(value)) {
      errors.push('Estado inválido. Use: Aprobado, Pendiente o Rechazado');
    }
  }

  // Validar campo validado
  if (field === 'validado') {
    if (value !== '' && value !== 'true' && value !== 'false') {
      errors.push('Valor inválido. Use: Aprobar o Rechazar');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Formatea un valor para mostrar en la UI
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formatea un número para mostrar en la UI
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Calcula el precio base para un GRD específico desde el catálogo
 */
export function getPrecioBase(grdCodigo: string, preciosBase: any[]): number {
  const precio = preciosBase.find(p => p.grdCodigo === grdCodigo);
  return precio?.precio || 0;
}

/**
 * Calcula el precio AT para un código específico desde el catálogo
 */
export function getPrecioAT(atCodigo: string, atCatalog: any[]): number {
  const at = atCatalog.find(a => a.codigo === atCodigo);
  return at?.precio || 0;
}

/**
 * Calcula el valor GRD (peso * precio base)
 */
export function calcularValorGRD(peso: number, precioBase: number): number {
  return peso * precioBase;
}

/**
 * Calcula el pago por outlier superior
 */
export function calcularPagoOutlier(inlierOutlier: string, valorGRD: number): number {
  if (inlierOutlier === 'Outlier' || inlierOutlier === 'Outliers Superiores') {
    return valorGRD * 0.1; // 10% del valor GRD
  }
  return 0;
}

/**
 * Calcula el pago por demora
 */
export function calcularPagoDemora(diasDemora: number): number {
  return diasDemora * 1000; // $1,000 por día de demora
}

/**
 * Calcula el monto final
 */
export function calcularMontoFinal(
  valorGRD: number,
  montoAT: number,
  pagoOutlier: number,
  pagoDemora: number
): number {
  return valorGRD + montoAT + pagoOutlier + pagoDemora;
}

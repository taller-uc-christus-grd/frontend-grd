// src/lib/planilla.config.ts
export type ManualField =
  | 'validado'
  | 'at'
  | 'atDetalle'
  | 'diasDemoraRescate'
  | 'pagoDemora'
  | 'documentacion';

/**
 * Columnas finales de la planilla exportable / visible
 * [Header visible, key del campo en FinalRow, editable?]
 */
export const FINAL_COLUMNS = [
  ['VALIDADO', 'validado', true], // editable solo para gestión
  ['Centro', 'centro', false], // viene de BD, ya no manual
  ['N° Folio', 'folio', false], // BD codificación
  ['Episodio', 'episodio', false],
  ['Rut Paciente', 'rut', false],
  ['Nombre Paciente', 'nombre', false],
  ['TIPO EPISODIO', 'tipoEpisodio', false], // viene del extracto (no editable)
  ['Fecha de ingreso', 'fechaIngreso', false],
  ['Fecha Alta', 'fechaAlta', false],
  ['Servicios de alta', 'servicioAlta', false],
  ['ESTADO RN', 'estadoRN', true], // editable solo para finanzas
  ['AT (S/N)', 'at', true],
  ['AT detalle', 'atDetalle', true],
  ['Monto AT', 'montoAT', false], // calculado por backend
  ['Tipo de Alta', 'motivoEgreso', false],
  ['IR - GRD', 'grdCodigo', false],
  ['PESO', 'peso', false],
  ['MONTO RN', 'montoRN', true], // editable solo para finanzas
  ['Días de demora rescate', 'diasDemoraRescate', true],
  ['Pago demora rescate', 'pagoDemora', true], // ahora editable manualmente
  ['Pago por outlier superior', 'pagoOutlierSup', true], // editable solo para finanzas
  ['DOCUMENTACIÓN NECESARIA', 'documentacion', true], // texto libre
  ['Inlier/Outlier', 'inlierOutlier', false],
  ['Grupo dentro de norma S/N', 'grupoDentroNorma', false],
  ['Días de Estada', 'diasEstada', false],
  ['Precio Base por tramo correspondiente', 'precioBaseTramo', true], // editable solo para finanzas
  ['Valor GRD', 'valorGRD', true], // editable solo para finanzas
  ['Monto Final', 'montoFinal', true], // editable solo para finanzas
] as const;

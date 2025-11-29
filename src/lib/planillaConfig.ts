// src/lib/planilla.config.ts
export type ManualField =
  | 'validado'
  | 'at'
  | 'atDetalle'
  | 'montoAT'
  | 'estadoRN'
  | 'montoRN'
  | 'diasDemoraRescate'
  | 'pagoDemora'
  | 'pagoOutlierSup'
  | 'precioBaseTramo'
  | 'montoFinal'
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
  ['Convenio', 'convenio', false], // viene del archivo maestro (Convenios (cod))
  ['TIPO EPISODIO', 'tipoEpisodio', false], // viene del extracto (no editable)
  ['Fecha de ingreso', 'fechaIngreso', false],
  ['Fecha Alta', 'fechaAlta', false],
  ['Servicios de alta', 'servicioAlta', false],
  ['ESTADO RN', 'estadoRN', true], // editable solo para finanzas
  ['AT (S/N)', 'at', true],
  ['AT detalle', 'atDetalle', true],
  ['Monto AT', 'montoAT', true], // EDITABLE - ingreso manual por finanzas
  ['Tipo de Alta', 'motivoEgreso', false],
  ['IR - GRD', 'grdCodigo', false],
  ['PESO GRD', 'pesoGrd', false], // "Peso GRD Medio (Todos)" del archivo maestro
  ['MONTO RN', 'montoRN', true], // editable solo para finanzas
  ['Días de demora rescate', 'diasDemoraRescate', true],
  ['Pago demora rescate', 'pagoDemora', true], // ahora editable manualmente
  ['Pago por outlier superior', 'pagoOutlierSup', true], // editable solo para finanzas
  ['DOCUMENTACIÓN NECESARIA', 'documentacion', true], // texto libre
  ['Inlier/Outlier', 'inlierOutlier', false],
  ['Grupo dentro de norma S/N', 'grupoDentroNorma', false],
  ['Días de Estada', 'diasEstada', false],
  ['Precio Base por tramo correspondiente', 'precioBaseTramo', false], // NO EDITABLE - calculado automáticamente desde precios convenios
  ['Valor GRD', 'valorGRD', false], // CALCULADO: peso * precioBaseTramo (no editable)
  ['Monto Final', 'montoFinal', true], // editable solo para finanzas
] as const;

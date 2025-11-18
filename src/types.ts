// === Roles y usuario (lo tuyo, igual) ===
export type Role = 'codificador' | 'finanzas' | 'gestion' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  token: string;
}

// === Estados (lo tuyo, con un pequeño ajuste en Inlier) ===
export type EstadoRN = 'Aprobado' | 'Pendiente' | 'Rechazado' | null;
// En la fuente aparece "Outliers Superiores" e incluso "-".
// Dejamos compatibilidad con "Outlier" por si aparece en algún dataset.
export type InlierFlag = 'Inlier' | 'Outliers Superiores' | 'Outlier' | '-' | null;

// === Episodio base (tu tipo original, lo mantengo) ===
export interface Episode {
  // Base desde SIGESA (solo lectura en UI)
  episodio: string;              // "Episodio CMBD"
  rut?: string;                  // "RUT"
  nombre?: string;               // "Nombre"
  convenio?: string | null;       // "Convenio"
  fechaIngreso?: string;         // "Fecha Ingreso completa" (YYYY-MM-DD)
  fechaAlta?: string;            // "Fecha Completa" (YYYY-MM-DD)
  servicioAlta?: string;         // "Servicio Egreso (Descripción)"
  motivoEgreso?: string;         // "Motivo Egreso (Descripción)"
  grdCodigo?: string;            // "IR GRD (Código)"
  peso?: number;                 // "Peso Medio [Norma IR]"
  inlierOutlier?: InlierFlag;    // "IR Alta Inlier / Outlier"
  estanciaReal?: number;         // "Estancia real del episodio"

  // Campos manuales / auxiliares de la app
  validado?: boolean;
  centro?: string;
  folio?: string;
  tipoEpisodio?: string;         // 'Hospitalario' | 'Ambulatorio' (libre por ahora)
  estadoRN?: EstadoRN;

  // Ajustes/Reglas
  diasDemoraRescate?: number;
  at?: boolean;                  // AT (S/N) — lo dejamos boolean
  atDetalle?: string;
  montoAT?: number;              // desde catálogo AT

  // Precios y cálculos
  precioBase?: number;           // desde tabla por tramo (por GRD)
  valorGRD?: number;             // peso * precioBase
  pagoOutlierSup?: number | null; // TBD: null = pendiente regla
  pagoDemora?: number | null;     // TBD: null = pendiente regla
  montoFinal?: number;           // valorGRD + montoAT + pagos (si no null)
  montoRN?: number;              // Facturación Total del episodio
  precioBaseTramo?: number;      // Precio base por tramo correspondiente
  grupoDentroNorma?: boolean;    // Grupo dentro de norma S/N
  diasEstada?: number;           // Días de Estada
  documentacion?: string;        // Documentación necesaria

  // Documentos requeridos (estado)
  docs: {
    epicrisis?: boolean;
    protocolo?: boolean;
    certDefuncion?: boolean;
  };

  // Estado para export
  completeness?: 'incompleto' | 'ready';

  // Campos de gestión
  comentariosGestion?: string;
  fechaRevision?: string;
  revisadoPor?: string;
}

// === NUEVO: fila consolidada para la planilla final (lo que se lista/edita/exporta) ===
// Nota: Campos calculados/BD son solo lectura en el front; manuales se pueden parchar.
export interface FinalRow {
  id: string;                    // id interno (puede ser episodio o uuid)
  // Manuales
  validado: boolean;
  at: boolean;                   // AT (S/N)
  atDetalle: string | null;
  diasDemoraRescate: number | null;
  pagoDemora: number | null;
  documentacion?: string | null; // PENDIENTE PARA CARGA DE ARCHIVOS

  // Desde Base (solo lectura)
  centro: string;                // Hospital (Descripción)
  folio: string;                 // ID Derivación
  episodio: string;              // Episodio CMBD
  rut: string;                   // RUT
  nombre: string;                // Nombre
  convenio: string | null;        // Convenio
  tipoEpisodio: string;          // Tipo Actividad
  fechaIngreso: string;          // Fecha Ingreso completa
  fechaAlta: string;             // Fecha Completa
  servicioAlta: string;          // Servicio Egreso (Descripción)
  estadoRN: EstadoRN;            // (si no existe, backend puede devolver null)
  motivoEgreso: string;          // Motivo Egreso (Descripción)
  grdCodigo: string;             // IR GRD (Código)
  peso: number;                  // Peso Medio [Norma IR]
  montoRN: number | null;        // Facturación Total del episodio
  inlierOutlier: InlierFlag;     // IR Alta Inlier / Outlier
  grupoDentroNorma: boolean;     // calculado (S/N)
  diasEstada: number;            // Estancia del Episodio

  // Derivados de catálogos (solo lectura)
  precioBaseTramo: number | null; // por GRD + tramo (convenio)
  valorGRD: number | null;        // peso * precio base
  pagoOutlierSup: number | null;  // según regla de convenio/outliers
  montoAT: number | null;         // desde catálogo AT por atDetalle
  montoFinal: number | null;      // suma final
}

// === NUEVO: qué campos son editables en el front (para validar/parchear) ===
export type EditableField =
  | 'validado'
  | 'at'
  | 'atDetalle'
  | 'diasDemoraRescate'
  | 'pagoDemora'
  | 'documentacion'; // si usas texto libre para checklist

// === NUEVO: meta de episodios para la HU de reemplazo ===
export interface EpisodeMeta {
  count: number;
  lastImportedAt?: string;
}

// === (Opcional) tipos de respuesta genéricos para uploads de catálogos ===
export interface CatalogImportResult {
  ok: boolean;
  version?: number | string;
  items?: number;
  message?: string;
}

export interface ImportResult {
  ok: boolean;
  jobId?: string;
  rows?: number;
  errors?: number;
  message?: string;
}

// === Exportaciones ===
export type FiltroExportacion = 'validados' | 'no-validados' | 'pendientes';

export interface DescargaExportacion {
  fecha: string;
  usuario: string;
}

export interface Exportacion {
  id: string;
  fechaGeneracion: string;
  usuarioGeneracion: string;
  cantidadEpisodios: number;
  filtros: FiltroExportacion[];
  descargas: DescargaExportacion[];
  datosExcel: Blob;
}

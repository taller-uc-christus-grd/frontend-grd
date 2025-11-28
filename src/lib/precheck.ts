// src/lib/precheck.ts
export const REQUIRED_HEADERS = [
  'Hospital (Descripción)',
  'Episodio CMBD',
  'RUT',
  'Nombre',
  'Tipo Actividad',
  'Fecha Ingreso completa',
  'Fecha Completa',
  'Servicio Egreso (Descripción)',
  'Motivo Egreso (Descripción)',
  'IR GRD (Código)',
  'Peso Medio [Norma IR]',
  'Peso GRD Medio (Todos)',
  'IR Alta Inlier / Outlier',
  'Estancia real del episodio',
] as const;

export type PrecheckIssue = {
  type: 'missing_header' | 'duplicate' | 'empty' | 'invalid';
  rowIndex?: number;
  column?: string;
  message: string;
};

export type PrecheckResult = {
  ok: boolean;
  headers: string[];
  rows: any[];
  issues: PrecheckIssue[];
};

export function normalizeHeader(h: string) {
  return (h || '').trim();
}

export function detectDuplicates(values: any[]) {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const v of values) {
    const key = String(v ?? '').trim();
    if (!key) continue;
    if (seen.has(key)) dup.add(key);
    else seen.add(key);
  }
  return dup;
}

// Números que validamos en precheck
const NUMERIC_HEADERS = new Set<string>([
  'Peso Medio [Norma IR]',
  'Peso GRD Medio (Todos)',
  'Estancia real del episodio',
]);

function toNumberLoose(v: any) {
  if (v === null || v === undefined) return NaN;
  const s = String(v).trim();
  if (!s) return NaN;
  const norm = s
    .replace(/\s/g, '')
    .replace(/(?<=\d)[.](?=\d{3}\b)/g, '') // quita separadores de miles puntuales
    .replace(/,(?=\d{2,})/g, '.')          // coma decimal a punto
    .replace(/(?<=\d)\.(?=\d{3}\b)/g, ''); // punto de miles en algunos casos
  const n = Number(norm);
  return Number.isFinite(n) ? n : NaN;
}

/** Validaciones mínimas para poder calcular luego la planilla final */
export function validateRows(headers: string[], rows: any[]): PrecheckIssue[] {
  const issues: PrecheckIssue[] = [];

  // 1) Cabeceras faltantes
  for (const h of REQUIRED_HEADERS) {
    if (!headers.includes(h)) {
      issues.push({ type: 'missing_header', message: `Falta la columna: ${h}` });
    }
  }

  // Si faltan cabeceras críticas, no seguimos con filas
  if (issues.some(i => i.type === 'missing_header')) return issues;

  // 2) Duplicados por episodio
  const epiCol = 'Episodio CMBD';
  const dupKeys = detectDuplicates(rows.map(r => r[epiCol]));
  if (dupKeys.size > 0) {
    rows.forEach((r, idx) => {
      const key = String(r[epiCol] ?? '').trim();
      if (dupKeys.has(key)) {
        issues.push({
          type: 'duplicate',
          rowIndex: idx,
          column: epiCol,
          message: `Episodio duplicado: ${key}`,
        });
      }
    });
  }

  // 3) Campos vacíos críticos
  const mustHave = [
    'Episodio CMBD',
    'RUT',
    'Nombre',
    'Fecha Ingreso completa',
    'Fecha Completa',
    'Servicio Egreso (Descripción)',
    'IR GRD (Código)',
  ];
  rows.forEach((r, idx) => {
    for (const c of mustHave) {
      const v = (r[c] ?? '').toString().trim();
      if (!v) {
        issues.push({
          type: 'empty',
          rowIndex: idx,
          column: c,
          message: `Fila ${idx + 2}: ${c} vacío`,
        });
      }
    }
  });

  // 4) Tipos/dominios básicos
  rows.forEach((r, idx) => {
    const peso = toNumberLoose(r['Peso Medio [Norma IR]']);
    if (Number.isNaN(peso)) {
      issues.push({
        type: 'invalid',
        rowIndex: idx,
        column: 'Peso Medio [Norma IR]',
        message: `Fila ${idx + 2}: Peso inválido`,
      });
    }
    const pesoGrd = toNumberLoose(r['Peso GRD Medio (Todos)']);
    if (Number.isNaN(pesoGrd)) {
      issues.push({
        type: 'invalid',
        rowIndex: idx,
        column: 'Peso GRD Medio (Todos)',
        message: `Fila ${idx + 2}: Peso GRD inválido`,
      });
    }
    const estReal = toNumberLoose(r['Estancia real del episodio']);
    if (Number.isNaN(estReal)) {
      issues.push({
        type: 'invalid',
        rowIndex: idx,
        column: 'Estancia real del episodio',
        message: `Fila ${idx + 2}: Estancia inválida`,
      });
    }
  });

  return issues;
}

/** Aplica cambios del usuario a la grilla (edición inline) */
export function applyCellEdit(rows: any[], rowIndex: number, column: string, value: string | number) {
  const copy = rows.slice();
  const r = { ...copy[rowIndex] };
  r[column] = value;
  copy[rowIndex] = r;
  return copy;
}
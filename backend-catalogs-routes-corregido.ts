/**
 * CORRECCIONES PARA: backend-grd/src/routes/catalogs.routes.ts
 * 
 * Este archivo muestra las correcciones necesarias para cargar los percentiles
 * desde la norma minsal. Busca las secciones marcadas con "// CORRECCIÓN:" 
 * y aplica los cambios en tu archivo original.
 */

// ... (todo el código anterior hasta la sección de procesamiento de filas) ...

// ========== CORRECCIÓN: Agregar búsqueda de percentiles ==========
// Buscar en la función que procesa cada fila, después de buscar puntoCorteInf y puntoCorteSup:

// Buscar percentil 25
const p25 = parseDecimal(getColumnValue([
  'Percentil 25',
  'Percentil25',
  'P25',
  'PERCENTIL 25',
  'percentil 25',
  'Percentil 25 (días)'
]));

// Buscar percentil 50 - CRÍTICO para cálculo de outlier superior
const p50 = parseDecimal(getColumnValue([
  'Percentil 50',
  'Percentil50',
  'P50',
  'PERCENTIL 50',
  'percentil 50',
  'Percentil 50 (días)',
  'Mediana',
  'MEDIANA',
  'Mediana (días)'
]));

// Buscar percentil 75
const p75 = parseDecimal(getColumnValue([
  'Percentil 75',
  'Percentil75',
  'P75',
  'PERCENTIL 75',
  'percentil 75',
  'Percentil 75 (días)'
]));

// Log para los primeros 5 registros para verificar que se están encontrando los valores
if (index < 5) {
  console.log(`📊 Procesando fila ${index + 1} - GRD: ${codigo}`, {
    peso,
    pci,
    pcs,
    p25,
    p50,
    p75,
    tienePeso: peso > 0,
    tienePCI: pci > 0 || pci !== 0,
    tienePCS: pcs > 0 || pcs !== 0,
    tieneP50: p50 > 0 || p50 !== 0,
    tieneP75: p75 > 0 || p75 !== 0,
    rowKeys: Object.keys(row).slice(0, 10),
  });
}

// ========== CORRECCIÓN: Actualizar dataToUpsert para incluir percentiles ==========
// Reemplazar el objeto dataToUpsert con:

const dataToUpsert: Prisma.GrdUncheckedCreateInput = {
  codigo: codigo,
  descripcion: `Descripción de ${codigo}`,
  peso: peso,
  puntoCorteInf: pci,
  puntoCorteSup: pcs,
  percentil25: p25,    // NUEVO
  percentil50: p50,   // NUEVO - CRÍTICO para outlier
  percentil75: p75,   // NUEVO
  precioBaseTramo: precioBaseEjemplo,
};

// ========== CORRECCIÓN: Actualizar successRecords para incluir percentiles ==========
// En el bloque de successRecords.push, agregar:

successRecords.push({
  fila: index + 1,
  codigo: codigo,
  peso: peso,
  puntoCorteInf: pci,
  puntoCorteSup: pcs,
  percentil25: p25,    // NUEVO
  percentil50: p50,   // NUEVO
  percentil75: p75,   // NUEVO
});

// ========== CORRECCIÓN: Actualizar verificación de valores guardados ==========
// En la sección de verificación (después del procesamiento), actualizar:

const grdVerificado = await prisma.grd.findUnique({
  where: { codigo: record.codigo },
  select: {
    codigo: true,
    puntoCorteInf: true,
    puntoCorteSup: true,
    peso: true,
    percentil25: true,   // NUEVO
    percentil50: true,  // NUEVO
    percentil75: true,  // NUEVO
  },
});

if (grdVerificado) {
  console.log(`✅ GRD ${record.codigo} verificado en BD:`, {
    puntoCorteInf: grdVerificado.puntoCorteInf,
    puntoCorteSup: grdVerificado.puntoCorteSup,
    peso: grdVerificado.peso,
    percentil25: grdVerificado.percentil25,   // NUEVO
    percentil50: grdVerificado.percentil50,  // NUEVO
    percentil75: grdVerificado.percentil75,  // NUEVO
  });
}


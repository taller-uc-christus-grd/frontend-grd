# Correcciones para Cálculos de Pago Outlier Superior y Demora Rescate

## Problema Identificado

El cálculo de `pagoOutlierSuperior` requiere el **percentil 50**, pero actualmente:
1. El percentil 50 no se está cargando desde la norma minsal
2. El código intenta obtenerlo de `ConfiguracionSistema`, que puede no estar configurado
3. El schema de Prisma no tiene campos para almacenar percentiles en la tabla `Grd`

## Soluciones Requeridas

### 1. Actualizar Schema de Prisma

Agregar campos para percentiles en la tabla `Grd`:

```prisma
model Grd {
  id Int @id @default(autoincrement())
  codigo String @unique
  descripcion String?
  peso Decimal? @db.Decimal(10, 4)
  precioBaseTramo Decimal? @db.Decimal(14, 2)
  puntoCorteInf Decimal?
  puntoCorteSup Decimal?
  percentil25 Decimal? @db.Decimal(10, 2)  // NUEVO
  percentil50 Decimal? @db.Decimal(10, 2)  // NUEVO - CRÍTICO para outlier
  percentil75 Decimal? @db.Decimal(10, 2)  // NUEVO
  createdAt DateTime @default(now())
  episodios Episodio[]
}
```

**Ejecutar migración:**
```bash
npx prisma migrate dev --name add_percentiles_to_grd
```

### 2. Actualizar Código de Carga de Norma Minsal

En `backend-grd/src/routes/catalogs.routes.ts`, modificar la función de procesamiento para incluir los percentiles:

```typescript
// Buscar percentil 25
const p25 = parseDecimal(getColumnValue([
  'Percentil 25',
  'Percentil25',
  'P25',
  'PERCENTIL 25',
  'percentil 25'
]));

// Buscar percentil 50 - CRÍTICO
const p50 = parseDecimal(getColumnValue([
  'Percentil 50',
  'Percentil50',
  'P50',
  'PERCENTIL 50',
  'percentil 50',
  'Mediana',
  'MEDIANA'
]));

// Buscar percentil 75
const p75 = parseDecimal(getColumnValue([
  'Percentil 75',
  'Percentil75',
  'P75',
  'PERCENTIL 75',
  'percentil 75'
]));

// En el objeto dataToUpsert, agregar:
const dataToUpsert: Prisma.GrdUncheckedCreateInput = {
  codigo: codigo,
  descripcion: `Descripción de ${codigo}`,
  peso: peso,
  puntoCorteInf: pci,
  puntoCorteSup: pcs,
  percentil25: p25,    // NUEVO
  percentil50: p50,   // NUEVO - CRÍTICO
  percentil75: p75,   // NUEVO
  precioBaseTramo: precioBaseEjemplo,
};
```

### 3. Corregir Función calcularPagoOutlierSuperior

En `backend-grd/src/routes/episodios.routes.ts`, reemplazar la función `calcularPagoOutlierSuperior`:

```typescript
/**
 * Calcula el pago por outlier superior (US-11) - SOLO para FNS012
 * 
 * Fórmula:
 * Pago Outlier = (Días post carencia × Peso GRD × Precio Base) / Días percentil 75
 * 
 * Donde:
 * - Período de carencia = Punto corte superior + Percentil 50
 * - Días post carencia = Estancia total - Período de carencia
 * - Días percentil 75 = Grd.percentil75 (o puntoCorteSup como fallback)
 */
async function calcularPagoOutlierSuperior(params: {
  convenio?: string | null;
  diasEstada?: number | null;
  pesoGrd?: number | null;
  precioBase?: number | null;
  grdId?: number | null;
  inlierOutlier?: string | null;  // Cambiar de esFueraDeNorma a inlierOutlier
}): Promise<number> {
  const { convenio, diasEstada, pesoGrd, precioBase, grdId, inlierOutlier } = params;
  
  const conv = (convenio || '').toString().trim().toUpperCase();
  
  // Solo aplicar para FNS012
  if (conv !== 'FNS012') {
    return 0;
  }
  
  // Determinar si es outlier superior basándose en inlierOutlier
  const esOutlierSuperior = inlierOutlier === 'Outlier Superior';
  
  console.log(`🔍 calcularPagoOutlierSuperior - Verificando condiciones:`, {
    convenio: conv,
    esFNS012: conv === 'FNS012',
    esOutlierSuperior,
    inlierOutlier,
    diasEstada,
    pesoGrd,
    precioBase,
    grdId
  });
  
  if (!esOutlierSuperior) {
    console.log(`ℹ️ FNS012: No se calcula pago outlier porque inlierOutlier = ${inlierOutlier} (no es "Outlier Superior")`);
    return 0;
  }
  
  try {
    // Obtener datos del GRD
    let puntoCorteSuperior: number | null = null;
    let percentil50: number | null = null;
    let percentil75: number | null = null;
    
    if (grdId) {
      const grd = await prisma.grd.findUnique({ where: { id: grdId } });
      if (grd) {
        if (grd.puntoCorteSup) puntoCorteSuperior = Number(grd.puntoCorteSup);
        if (grd.percentil50) percentil50 = Number(grd.percentil50);  // Obtener desde GRD
        if (grd.percentil75) percentil75 = Number(grd.percentil75);  // Obtener desde GRD
        
        console.log(`📊 GRD encontrado:`, {
          puntoCorteSup: puntoCorteSuperior,
          percentil50: percentil50,
          percentil75: percentil75,
          puntoCorteInf: grd.puntoCorteInf
        });
      }
    }
    
    // Fallback: Si no hay percentil50 en GRD, intentar desde ConfiguracionSistema
    if (percentil50 === null || percentil50 <= 0) {
      const cfgP50 = await prisma.configuracionSistema.findUnique({
        where: { clave: 'percentil50' }
      });
      if (cfgP50 && cfgP50.valor) {
        percentil50 = parseFloat(cfgP50.valor);
        console.log(`✅ Percentil 50 obtenido de ConfiguracionSistema: ${percentil50}`);
      }
    }
    
    // Fallback: Si no hay percentil75 en GRD, usar puntoCorteSup
    if (percentil75 === null || percentil75 <= 0) {
      if (puntoCorteSuperior && puntoCorteSuperior > 0) {
        percentil75 = puntoCorteSuperior;
        console.log(`ℹ️ Usando puntoCorteSup como percentil75: ${percentil75}`);
      } else {
        // Último fallback: ConfiguracionSistema
        const cfgP75 = await prisma.configuracionSistema.findUnique({
          where: { clave: 'diasPercentil75' }
        });
        if (cfgP75 && cfgP75.valor) {
          percentil75 = parseFloat(cfgP75.valor);
        }
      }
    }
    
    // Si faltan valores críticos, retornar 0
    if (puntoCorteSuperior === null || puntoCorteSuperior <= 0) {
      console.warn('⚠️ FNS012: puntoCorteSuperior no disponible');
      return 0;
    }
    
    if (percentil50 === null || percentil50 <= 0) {
      console.warn('⚠️ FNS012: percentil50 no disponible - no se puede calcular pago outlier');
      return 0;
    }
    
    if (percentil75 === null || percentil75 <= 0) {
      console.warn('⚠️ FNS012: percentil75 no disponible, usando 1');
      percentil75 = 1;
    }
    
    // Validar parámetros
    const dias = typeof diasEstada === 'number' && diasEstada > 0 ? diasEstada : 0;
    const peso = typeof pesoGrd === 'number' && pesoGrd > 0 ? pesoGrd : 0;
    const precio = typeof precioBase === 'number' && precioBase > 0 ? precioBase : 0;
    
    // Si no hay días, peso o precio, retornar 0
    if (dias === 0 || peso === 0 || precio === 0) {
      console.log(`ℹ️ FNS012 Outlier: Retornando 0 (días: ${dias}, peso: ${peso}, precio: ${precio})`);
      return 0;
    }
    
    // Calcular período de carencia
    const periodoCarencia = puntoCorteSuperior + percentil50;
    console.log(`📊 FNS012 Outlier - Período de carencia: ${puntoCorteSuperior} + ${percentil50} = ${periodoCarencia}`);
    
    // Calcular días post carencia
    const diasPostCarencia = Math.max(0, dias - periodoCarencia);
    
    if (diasPostCarencia <= 0) {
      console.log(`ℹ️ FNS012 Outlier: Episodio dentro del período de carencia (${dias} ≤ ${periodoCarencia}). Retornando 0.`);
      return 0;
    }
    
    // Aplicar fórmula: (Días post carencia × Peso GRD × Precio Base) / Días percentil 75
    const pagoOutlier = (diasPostCarencia * peso * precio) / percentil75;
    
    console.log(`✅ FNS012 Outlier: (${diasPostCarencia} × ${peso} × ${precio}) / ${percentil75} = ${pagoOutlier}`);
    
    return pagoOutlier;
  } catch (err) {
    console.error('calcularPagoOutlierSuperior - error:', err);
    return 0;
  }
}
```

### 4. Actualizar Llamadas a calcularPagoOutlierSuperior

Buscar todas las llamadas a `calcularPagoOutlierSuperior` y cambiar el parámetro `esFueraDeNorma` por `inlierOutlier`:

**ANTES:**
```typescript
const pagoOutlier = await calcularPagoOutlierSuperior({
  convenio: episodio.convenio,
  diasEstada: episodio.diasEstada,
  pesoGrd: Number(episodio.pesoGrd),
  precioBase: Number(episodio.precioBaseTramo),
  grdId: episodio.grdId,
  esFueraDeNorma: episodio.grupoEnNorma === false  // ❌ INCORRECTO
});
```

**DESPUÉS:**
```typescript
const pagoOutlier = await calcularPagoOutlierSuperior({
  convenio: episodio.convenio,
  diasEstada: episodio.diasEstada,
  pesoGrd: Number(episodio.pesoGrd),
  precioBase: Number(episodio.precioBaseTramo),
  grdId: episodio.grdId,
  inlierOutlier: episodio.inlierOutlier  // ✅ CORRECTO
});
```

### 5. Corregir Función calcularPagoDemoraRescate (Mejora)

La función ya está bien implementada, pero asegurar que use `percentil75` desde GRD cuando esté disponible:

```typescript
// En calcularPagoDemoraRescate, mejorar la obtención de diasP75:
if (grdId) {
  const grd = await prisma.grd.findUnique({ where: { id: grdId } });
  if (grd) {
    // Priorizar percentil75 si está disponible
    if (grd.percentil75) {
      diasP75 = Number(grd.percentil75);
    } else if (grd.puntoCorteSup) {
      diasP75 = Number(grd.puntoCorteSup);
    }
  }
}
```

## Resumen de Cambios

1. ✅ Agregar campos `percentil25`, `percentil50`, `percentil75` al schema de Prisma
2. ✅ Actualizar código de carga para leer y guardar percentiles desde la norma minsal
3. ✅ Modificar `calcularPagoOutlierSuperior` para usar `percentil50` desde GRD
4. ✅ Cambiar parámetro `esFueraDeNorma` por `inlierOutlier` en la función
5. ✅ Mejorar obtención de `percentil75` en `calcularPagoDemoraRescate`

## Notas Importantes

- El **percentil 50** es crítico para el cálculo de pago outlier superior
- Si el percentil 50 no está en la norma minsal, se puede usar `ConfiguracionSistema` como fallback
- El campo `inlierOutlier` debe tener el valor `'Outlier Superior'` para que se calcule el pago
- Asegurar que la norma minsal tenga las columnas: `Percentil 25`, `Percentil 50`, `Percentil 75`


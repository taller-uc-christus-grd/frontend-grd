# Verificación: ¿Por qué no se renderiza precioBaseTramo?

## 🔍 Diagnóstico del Problema

El campo `precioBaseTramo` no se está mostrando en la planilla de episodios aunque el backend ya tiene la documentación para calcularlo automáticamente.

## ✅ Verificaciones en el Frontend

El frontend **SÍ está configurado correctamente** para mostrar `precioBaseTramo`:

1. **✅ Campo definido en `planillaConfig.ts`** (línea 46):
   ```typescript
   ['Precio Base por tramo correspondiente', 'precioBaseTramo', true]
   ```

2. **✅ Renderizado implementado en `Episodios.tsx`** (línea 985):
   ```typescript
   case 'precioBaseTramo':
     const formattedValue = value ? formatCurrency(value) : '-';
     return (
       <div className="flex items-center gap-1">
         <span>{formattedValue}</span>
       </div>
     );
   ```

3. **✅ Tipo definido en `types.ts`** (línea 53):
   ```typescript
   precioBaseTramo?: number;
   ```

## ⚠️ Posibles Causas del Problema

### 1. El backend NO está devolviendo `precioBaseTramo` en las respuestas

**Verificar:**
- ¿El backend está incluyendo `precioBaseTramo` en el `select` o respuesta de `GET /api/episodios/final`?
- ¿El campo existe en el modelo Prisma `Episodio`?

**Cómo verificar:**
1. Abrir las herramientas de desarrollador del navegador (F12)
2. Ir a la pestaña "Network" (Red)
3. Recargar la página de Episodios
4. Buscar la petición a `/api/episodios/final`
5. Ver la respuesta JSON y verificar si incluye el campo `precioBaseTramo`

### 2. El backend NO está calculando `precioBaseTramo` automáticamente

**Verificar:**
- ¿El backend implementó la función de cálculo automático según `PROMPT_BACKEND_PRECIO_BASE_TRAMO.md`?
- ¿El backend está calculando `precioBaseTramo` al importar episodios?
- ¿El backend está recalculando `precioBaseTramo` en `GET /api/episodios/final` si es `null`?

**Requisitos según la documentación:**
- El backend debe calcular `precioBaseTramo` basándose en:
  - **Convenio del episodio** (FNS012, FNS026, FNS019, o CH0041)
  - **Peso GRD** (campo `peso`) para determinar el tramo (T1, T2, T3)
  - **Tabla `precios_convenios`** para obtener el precio base

### 3. El backend NO tiene datos en la tabla `precios_convenios`

**Verificar:**
- ¿Existen registros en la tabla `precios_convenios` para los convenios FNS012, FNS026, FNS019, y CH0041?
- ¿Los registros tienen los tramos correctos (T1, T2, T3) para FNS012 y FNS026?
- ¿Los registros tienen el campo `precio` con valores válidos?

### 4. El backend NO puede determinar el convenio del episodio

**Verificar:**
- ¿Cómo se determina el convenio del episodio? (Esta es la pregunta crítica del documento)
- ¿El campo `convenio` existe en el modelo `Episodio`?
- ¿El convenio se determina desde otro campo (ej: `folio`)?

## 📋 Checklist para el Backend

- [ ] Verificar que `precioBaseTramo` existe en el modelo Prisma `Episodio`
- [ ] Verificar que `precioBaseTramo` está incluido en el `select` de `GET /api/episodios/final`
- [ ] Verificar que existe la función de cálculo automático de `precioBaseTramo`
- [ ] Verificar que la función se ejecuta al importar episodios (`POST /api/episodios/import`)
- [ ] Verificar que la función se ejecuta en `GET /api/episodios/final` si `precioBaseTramo` es `null`
- [ ] Verificar que existen registros en `precios_convenios` para los convenios requeridos
- [ ] Verificar cómo se determina el convenio del episodio (campo, relación, o lógica)
- [ ] Verificar que el cálculo de tramo (T1/T2/T3) funciona correctamente para FNS012 y FNS026
- [ ] Verificar que el precio único funciona correctamente para FNS019 y CH0041

## 🔧 Cómo Diagnosticar desde el Frontend

### Opción 1: Usar la Consola del Navegador

1. Abrir la página de Episodios
2. Abrir las herramientas de desarrollador (F12)
3. Ir a la pestaña "Console" (Consola)
4. Buscar los logs que muestran la estructura de los episodios
5. Verificar si `precioBaseTramo` aparece en el objeto del episodio

### Opción 2: Usar la Pestaña Network

1. Abrir la página de Episodios
2. Abrir las herramientas de desarrollador (F12)
3. Ir a la pestaña "Network" (Red)
4. Recargar la página
5. Buscar la petición a `/api/episodios/final`
6. Hacer clic en la petición
7. Ir a la pestaña "Response" o "Preview"
8. Buscar si `precioBaseTramo` está presente en el JSON de respuesta

**Si `precioBaseTramo` es `null` o `undefined` en la respuesta:** El backend no está calculándolo o no lo está devolviendo.

**Si `precioBaseTramo` tiene un valor pero no se muestra:** Hay un problema en el renderizado del frontend (menos probable).

## 📝 Logs Temporales en el Frontend

He agregado logs temporales en `src/pages/Episodios.tsx` para ayudar a diagnosticar:

```typescript
console.log('🔍 PRIMER EPISODIO - precioBaseTramo:', {
  episodio: episodiosData[0]?.episodio,
  precioBaseTramo: episodiosData[0]?.precioBaseTramo,
  tipo: typeof episodiosData[0]?.precioBaseTramo,
  todasLasKeys: Object.keys(episodiosData[0] || {}),
  tienePrecioBaseTramo: 'precioBaseTramo' in (episodiosData[0] || {})
});
```

Estos logs aparecerán en la consola cuando se carguen los episodios.

## 🚀 Próximos Pasos

1. **Verificar en el navegador** usando la pestaña Network si el backend está devolviendo `precioBaseTramo`
2. **Compartir con el backend** el resultado de la verificación
3. **Si `precioBaseTramo` es `null` o `undefined`:**
   - El backend necesita implementar el cálculo automático según `PROMPT_BACKEND_PRECIO_BASE_TRAMO.md`
   - El backend necesita asegurarse de incluir `precioBaseTramo` en las respuestas
4. **Si `precioBaseTramo` tiene un valor pero no se muestra:**
   - Revisar los logs de la consola para ver si hay errores de renderizado
   - Verificar que el campo se está mapeando correctamente desde la respuesta del backend

## 📄 Documentos de Referencia

- `PROMPT_BACKEND_PRECIO_BASE_TRAMO.md` - Documentación completa del cálculo automático
- `RESUMEN_BACKEND_PRECIO_BASE_TRAMO.md` - Resumen conciso del cálculo automático


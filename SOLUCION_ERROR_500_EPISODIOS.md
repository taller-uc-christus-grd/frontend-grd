# Solución: Error 500 al Modificar Episodios

## 🔴 Problema

Al intentar modificar un episodio desde el frontend, se obtiene un error 500 (Internal Server Error) con el siguiente mensaje del backend:

```
PrismaClientKnownRequestError:
Invalid `prisma.episodio.findFirst()` invocation in
C:\Users\nicol\OneDrive\Desktop\backend-grd\src\routes\episodios.routes.ts:1005:40

The column `existe` does not exist in the current database.
```

## 📋 Causa del Error

El error ocurre en el backend cuando intenta buscar un episodio. Específicamente:

1. **Ubicación**: `src/routes/episodios.routes.ts`, línea 1005
2. **Problema**: El código intenta usar una columna llamada `existe` que no existe en la base de datos
3. **Método**: `prisma.episodio.findFirst()`

## ✅ Solución en el Backend

Necesitas corregir el código del backend. Tienes dos opciones:

### Opción 1: Remover la referencia a la columna `existe` (Recomendado)

Si la columna `existe` no es necesaria, remueve la referencia en el query de Prisma:

```typescript
// ❌ Código incorrecto (línea 1005)
episodio = await prisma.episodio.findFirst({
  where: {
    // ... otras condiciones
    existe: true  // ❌ Esta columna no existe
  }
});

// ✅ Código correcto
episodio = await prisma.episodio.findFirst({
  where: {
    // ... otras condiciones sin 'existe'
  }
});
```

### Opción 2: Agregar la columna a la base de datos (Si es necesaria)

Si la columna `existe` es necesaria, agrega una migración de Prisma:

1. Edita el schema de Prisma (`prisma/schema.prisma`):
```prisma
model Episodio {
  // ... otros campos
  existe Boolean? @default(true)
}
```

2. Crea y ejecuta la migración:
```bash
npx prisma migrate dev --name add_existe_column
```

3. Regenera el cliente de Prisma:
```bash
npx prisma generate
```

## 🔍 Verificación del Código del Backend

Revisa el archivo `src/routes/episodios.routes.ts` alrededor de la línea 1005:

```typescript
// Buscar código similar a esto:
if (!episodio) {
  episodio = await prisma.episodio.findFirst({
    where: {
      episodioCmdb: episodeId,
      existe: true  // ⚠️ Esta es probablemente la línea problemática
    }
  });
}
```

**Solución**: Remover `existe: true` del `where` o ajustar según sea necesario.

## 📝 Mejoras en el Frontend

He mejorado el manejo de errores en el frontend (`src/pages/Episodios.tsx`) para:

1. ✅ Mostrar mensajes de error más descriptivos cuando hay errores 500
2. ✅ Detectar errores relacionados con Prisma/base de datos
3. ✅ Mostrar información útil al usuario
4. ✅ No interrumpir el flujo de edición cuando hay errores del servidor

Ahora verás mensajes como:
- `"Error en la base de datos: The column 'existe' does not exist..."` cuando hay errores de Prisma
- `"Error del servidor: [mensaje del backend]"` para otros errores 500

## 🧪 Cómo Verificar la Solución

1. **Corrige el código del backend** (remover o agregar la columna `existe`)
2. **Reinicia el servidor del backend**
3. **Intenta modificar un episodio desde el frontend**
4. **Verifica que no aparezca el error 500**

## 📊 Información de Debugging

Si el error persiste, verifica:

1. **Consola del backend**: Verifica los logs completos del error
2. **Base de datos**: Verifica el schema actual de la tabla `episodio`:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'episodio';
   ```
3. **Schema de Prisma**: Verifica que el schema coincida con la base de datos
4. **Migraciones**: Verifica que todas las migraciones estén aplicadas:
   ```bash
   npx prisma migrate status
   ```

## 🔗 Archivos Relacionados

- **Backend**: `backend-grd/src/routes/episodios.routes.ts` (línea ~1005)
- **Frontend**: `frontend-grd/src/pages/Episodios.tsx` (mejorado para mejor manejo de errores)
- **Schema Prisma**: `backend-grd/prisma/schema.prisma`

## ⚠️ Nota Importante

Este es un error del **backend**, no del frontend. El frontend está enviando los datos correctamente, pero el backend tiene un problema al procesar la petición debido a la referencia a una columna inexistente.


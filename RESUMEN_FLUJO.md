# 📋 Resumen del Flujo - Ingreso Manual de Valores por Finanzas

## ✅ Flujo Correcto (SIN Catálogos)

### 1️⃣ Finanzas Ingresa Valores MANUALMENTE
El equipo de Finanzas ingresa **todos los valores directamente** en la UI:

| Campo | Tipo | Ejemplo |
|-------|------|---------|
| `estadoRN` | Select | "Aprobado" |
| `montoRN` | Número | 150000 |
| `at` | Boolean | true |
| `atDetalle` | Texto libre | "BASTON-ADULTO" |
| `montoAT` | Número | 18000 |
| `precioBaseTramo` | Número | 125000 |
| `valorGRD` | Número | 150000 |
| `pagoOutlierSup` | Número | 0 |
| `pagoDemora` | Número | 0 |
| `diasDemoraRescate` | Número | 0 |
| `documentacion` | Texto libre | "Epicrisis completa" |

⚠️ **IMPORTANTE**: NO hay catálogos. Finanzas ingresa los valores directamente.

### 2️⃣ Frontend Envía al Backend
```typescript
// Ejemplo: Finanzas edita montoAT
PATCH /api/episodes/EP001
{
  "montoAT": 18000
}

// O edita múltiples campos a la vez
PATCH /api/episodes/EP001
{
  "montoAT": 18000,
  "precioBaseTramo": 125000,
  "valorGRD": 150000
}
```

### 3️⃣ Backend Aplica REGLAS y Calcula
El backend:
1. Recibe los valores manuales
2. Aplica sus **reglas de negocio** (NO catálogos)
3. Calcula el `montoFinal`:

```python
# Ejemplo de regla en backend
montoFinal = valorGRD + montoAT + pagoOutlierSup + pagoDemora
montoFinal = 150000 + 18000 + 0 + 0 = 168000
```

### 4️⃣ Backend Devuelve Episodio Completo
```typescript
{
  "episodio": "EP001",
  "montoAT": 18000,          // Valor que Finanzas ingresó
  "precioBaseTramo": 125000, // Valor que Finanzas ingresó
  "valorGRD": 150000,        // Valor que Finanzas ingresó
  "montoFinal": 168000,      // ← CALCULADO por backend
  // ... resto de campos ...
}
```

### 5️⃣ Frontend Muestra los Valores
- Los valores ingresados manualmente se muestran tal cual
- El `montoFinal` calculado se muestra automáticamente
- Los cambios se reflejan en:
  - ✅ Tabla de episodios (`Episodios.tsx`)
  - ✅ Detalle de episodio (`EpisodioDetalle.tsx`)

## 🔄 Sincronización entre Vistas

```
Finanzas edita en Tabla → Backend calcula → Actualiza Tabla
                                         → Si va a Detalle, ve el cambio

Finanzas edita en Detalle → Backend calcula → Actualiza Detalle
                                            → Si vuelve a Tabla, puede recargar
```

## ❌ Lo que NO existe

- ❌ NO hay catálogos de Ajustes por Tecnología (AT)
- ❌ NO hay catálogos de Precios Base por GRD
- ❌ NO hay búsqueda en catálogos
- ❌ NO hay mapeo automático de códigos a valores
- ❌ El módulo `Catalogos.tsx` SOLO se usa para Norma MINSAL (no para AT ni Precios Base)

## ✅ Lo que SÍ existe

- ✅ Ingreso manual de TODOS los valores por Finanzas
- ✅ Validación de tipos en frontend (número, texto, etc.)
- ✅ Envío de valores al backend mediante PATCH
- ✅ Backend aplica REGLAS para calcular `montoFinal`
- ✅ Sincronización automática entre vistas
- ✅ Feedback visual (mensajes de confirmación/error)

## 🎯 Campos que Finanzas Puede Editar

### En ambas vistas (Tabla y Detalle):
- ✏️ **Estado RN** (ingreso manual)
- ✏️ **AT (S/N)** (ingreso manual)
- ✏️ **AT Detalle** (texto libre, ingreso manual)
- ✏️ **Monto AT** (ingreso manual - ⭐ AHORA EDITABLE)
- ✏️ **Monto RN** (ingreso manual)
- ✏️ **Días Demora Rescate** (ingreso manual)
- ✏️ **Pago Demora Rescate** (ingreso manual)
- ✏️ **Pago Outlier Superior** (ingreso manual)
- ✏️ **Precio Base por Tramo** (ingreso manual)
- ✏️ **Valor GRD** (ingreso manual)
- ✏️ **Documentación** (texto libre, ingreso manual)

### Campo calculado por backend:
- 🔢 Monto Final (backend lo calcula con la regla: valorGRD + montoAT + pagoOutlierSup + pagoDemora)

## 📊 Ejemplo Completo

```
1. Finanzas abre episodio EP001 en la vista de Detalle

2. Ve los campos actuales:
   - montoAT: 0
   - valorGRD: 0
   - montoFinal: 0

3. Finanzas hace clic en "Editar" en campo "Monto AT"
   - Ingresa: 18000
   - Hace clic en guardar (✓)

4. Frontend envía: PATCH /api/episodes/EP001 { "montoAT": 18000 }

5. Backend:
   - Guarda montoAT = 18000
   - Calcula: montoFinal = 0 + 18000 + 0 + 0 = 18000
   - Devuelve episodio completo

6. Frontend muestra:
   - montoAT: $18,000 ✅
   - valorGRD: $0
   - montoFinal: $18,000 ✅ (calculado por backend)

7. Finanzas edita "Valor GRD" → ingresa 150000

8. Backend calcula nuevamente:
   - montoFinal = 150000 + 18000 + 0 + 0 = 168000

9. Frontend muestra:
   - montoAT: $18,000
   - valorGRD: $150,000 ✅
   - montoFinal: $168,000 ✅ (recalculado por backend)
```

## 🚀 Listo para Usar

El frontend está **100% listo** para:
- ✅ Permitir ingreso manual de valores por Finanzas
- ✅ Enviar valores al backend mediante PATCH
- ✅ Recibir el episodio completo con montoFinal calculado
- ✅ Mostrar los cambios en ambas vistas
- ✅ Sin errores de linting o TypeScript

**El backend solo necesita**:
- Implementar el endpoint `PATCH /api/episodes/:id`
- Aplicar las reglas para calcular `montoFinal`
- Devolver el episodio completo actualizado


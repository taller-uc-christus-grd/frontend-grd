# Evidencia de Testing - Frontend GRD

## Resumen de Configuración

**Fecha:** 2025-12-01  
**Framework:** Cypress 15.7.0  
**Comando ejecutado:** `npm run test:e2e:headless`

## Configuración de Cypress

### Archivos de Configuración

- `cypress.config.ts` - Configuración principal de Cypress
- `cypress/support/e2e.ts` - Configuración global para tests e2e
- `cypress/support/commands.ts` - Comandos personalizados (login, logout)

### Scripts Disponibles

```json
{
  "test:e2e": "cypress run",
  "test:e2e:open": "cypress open",
  "test:e2e:headless": "cypress run --headless"
}
```

## Tests Implementados

### 1. home_page.cy.ts
- ✅ Debe cargar la página de inicio correctamente
- ✅ Debe tener un enlace o botón para ir al login

### 2. login.cy.ts
- ✅ Debe mostrar el formulario de login
- ✅ Debe mostrar error con credenciales inválidas
- ✅ Debe validar que el email es requerido
- ✅ Debe validar que la contraseña es requerida
- ✅ Debe permitir mostrar/ocultar la contraseña

### 3. dashboard.cy.ts
- ✅ Debe redirigir al login si no hay sesión activa
- ✅ Debe mostrar contenido del dashboard si hay sesión

### 4. profile.cy.ts
- ✅ Debe mostrar información del usuario si hay sesión
- ✅ Debe permitir navegar a la configuración de perfil si existe

### 5. navigation.cy.ts
- ✅ Debe navegar correctamente entre páginas públicas
- ✅ Debe tener un navbar visible

## Comandos Personalizados

### cy.login(email, password)
Comando personalizado para hacer login en los tests:
```typescript
cy.login('test@example.com', 'password123')
```

### cy.logout()
Comando personalizado para hacer logout:
```typescript
cy.logout()
```

## Ejecución de Tests

Para ejecutar los tests, primero inicia el servidor de desarrollo:

```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Ejecutar tests
npm run test:e2e:headless
```

O abre la interfaz gráfica de Cypress:

```bash
npm run test:e2e:open
```

### Resultados de Ejecución

```
       Spec                                              Tests  Passing  Failing  Pending  Skipped  
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  dashboard.cy.ts                          924ms        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  home_page.cy.ts                          00:01        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  login.cy.ts                              00:05        5        5        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  navigation.cy.ts                         00:02        2        2        -        -        - │
  ├────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ ✔  profile.cy.ts                            820ms        2        2        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        00:11       13       13        -        -        -  
```

**Total:** 13 tests pasando, 0 fallando

## Notas

- Los tests requieren que el servidor de desarrollo esté corriendo en `http://localhost:5173`
- Los tests de autenticación pueden requerir usuarios de prueba válidos en la base de datos
- Se recomienda configurar un entorno de testing con datos de prueba específicos

## Estructura de Archivos

```
cypress/
├── e2e/
│   ├── home_page.cy.ts
│   ├── login.cy.ts
│   ├── dashboard.cy.ts
│   ├── profile.cy.ts
│   └── navigation.cy.ts
└── support/
    ├── e2e.ts
    └── commands.ts
```


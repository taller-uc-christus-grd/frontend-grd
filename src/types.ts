export type Role='codificador'|'finanzas'|'gestion'|'admin'; export interface User{ id:string; email:string; role:Role; token:string; }

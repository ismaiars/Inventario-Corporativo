import { z } from 'zod';
export enum EstadoEquipo { EnUso = 'enUso', Obsoleta = 'obsoleta', Mantenimiento = 'mantenimiento' }
export const Departamentos = ['Sistemas', 'Óptica', 'Certificaciones', 'Ventas', 'Marketing'] as const;
export const Ubicaciones = ['Optica', 'Oficinas-Optica', 'Oficinas', 'Prestamo'] as const;
export const TiposDispositivo = ['Laptop', 'Desktop', 'Chromebook', 'Impresora', 'Otro'] as const;
export const TiposEmpleado = ['Jovenes Construyendo el Futuro', 'Becarios', 'Contratados'] as const;
export const EspecificacionesSchema = z.object({
  cpu: z.string().optional().nullable(),
  ram: z.string().optional().nullable(),
  disco: z.string().optional().nullable(),
  so: z.string().optional().nullable(),
});
export type Especificaciones = z.infer<typeof EspecificacionesSchema>;
export const DetallesSchema = z.object({
  tipoDispositivo: z.enum(TiposDispositivo).optional().nullable(),
  mouse: z.string().optional().nullable(),
  cargador: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});
export type Detalles = z.infer<typeof DetallesSchema>;
export const EquipoSchema = z.object({
  id: z.string(), 
  fotoUrl: z.string().optional().nullable(),
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  serial: z.string().min(1, 'El serial es requerido'),
  modelo: z.string().optional().nullable(),
  marca: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  especificaciones: EspecificacionesSchema.optional(),
  estado: z.nativeEnum(EstadoEquipo, { errorMap: () => ({ message: "Estado inválido" }) }),
  usuarioId: z.string().optional().nullable(), 
  ubicacion: z.enum(Ubicaciones, { errorMap: () => ({ message: "Ubicación inválida" }) }),
  detalles: DetallesSchema.optional(), 
  tieneGarantia: z.boolean().default(false),
  detallesGarantia: z.string().optional().nullable(), 
});
export type Equipo = z.infer<typeof EquipoSchema>;
export const UsuarioSchema = z.object({
  id: z.string(), 
  nombreCompleto: z.string().min(1, 'El nombre completo es requerido'),
  departamento: z.enum(Departamentos, { errorMap: () => ({ message: "Departamento inválido" }) }),
  tipoEmpleado: z.enum(TiposEmpleado, { errorMap: () => ({ message: "Tipo de empleado inválido" }) }),
  fotoUrl: z.string().optional().nullable(),
});
export type Usuario = z.infer<typeof UsuarioSchema>;
export type EquipoData = Omit<Equipo, 'tieneGarantia' | 'detallesGarantia'> & {
    tieneGarantia?: boolean;
    detallesGarantia?: string | null;
};
export type UsuarioData = Usuario;
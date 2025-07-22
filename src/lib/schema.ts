import { z } from 'zod';
import { TiposDispositivo } from '@/types';

export const InventoryFormSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido." }),
  serial: z.string().min(1, { message: "El número de serie es requerido." }),
  modelo: z.string().min(1, { message: "El modelo es requerido." }),
  marca: z.string().min(1, { message: "La marca es requerida." }),
  tipo: z.string().min(1, { message: "El tipo es requerido." }),
  estado: z.string().min(1, { message: "El estado es requerido." }),
  ubicacion: z.string().min(1, { message: "La ubicación es requerida." }),
  usuarioId: z.string().optional(),
  tieneGarantia: z.boolean().optional(),
  detallesGarantia: z.string().optional(),
  foto: z.any().optional(),
  // Especificaciones técnicas
  cpu: z.string().optional(),
  ram: z.string().optional(),
  disco: z.string().optional(),
  so: z.string().optional(),
  // Detalles adicionales
  tipoDispositivo: z.enum(TiposDispositivo).optional(),
  mouse: z.string().optional(),
  cargador: z.string().optional(),
  notas: z.string().optional(),
});

export const UserFormSchema = z.object({
  id: z.string().optional(),
  nombreCompleto: z.string().min(1, { message: "El nombre completo es requerido." }),
  departamento: z.string().min(1, { message: "El departamento es requerido." }),
  tipoEmpleado: z.string().min(1, { message: "El tipo de empleado es requerido." }),
  fotoUrl: z.string().optional().nullable(),
});

export const UsuarioFormSchema = UserFormSchema;

export type UsuarioFormData = z.infer<typeof UsuarioFormSchema>;
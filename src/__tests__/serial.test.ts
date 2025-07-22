import { describe, it, expect } from 'vitest';
import { generarNuevoSerialEquipo } from '@/lib/inventoryService';
import { Departamentos, Equipo } from '@/types';

describe('generarNuevoSerialEquipo', () => {
  it('genera serial inicial por departamento', () => {
    const serial = generarNuevoSerialEquipo('Ventas', [] as Equipo[]);
    expect(serial).toBe('Ventas 1');
  });

  it('incrementa número para departamento existente', () => {
    const inv: Equipo[] = [
      { id: '1', nombre: 'PC', serial: 'Ventas 1', marca: '', modelo: '', tipo: '', especificaciones: {}, estado: undefined as any, usuarioId: null, ubicacion: 'Optica', detalles: {}, tieneGarantia: false },
    ];
    const serial = generarNuevoSerialEquipo('Ventas', inv);
    expect(serial).toBe('Ventas 2');
  });

  it('convierte prefijo antiguo', () => {
    const inv: Equipo[] = [
      { id: '1', nombre: 'PC', serial: 'VEN-01', marca: '', modelo: '', tipo: '', especificaciones: {}, estado: undefined as any, usuarioId: null, ubicacion: 'Optica', detalles: {}, tieneGarantia: false },
    ];
    const serial = generarNuevoSerialEquipo('Ventas', inv);
    expect(serial).toBe('Ventas 2');
  });
}); 
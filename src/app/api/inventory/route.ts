import { NextResponse } from 'next/server';
import { getAllInventory, addInventoryItem, saveImage } from '@/lib/inventoryService';
import { EquipoSchema, Equipo } from '@/types';
import { ZodError } from 'zod';
import fs from 'fs/promises';
import path from 'path';
// Tamaño por defecto por página
const DEFAULT_PAGE_SIZE = 20;
const UNASSIGNED_VALUE = "__NONE__"; 
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const pageParam = url.searchParams.get('page');
        const pageSizeParam = url.searchParams.get('pageSize');
        const page = pageParam ? parseInt(pageParam) : null;
        const pageSize = pageSizeParam ? parseInt(pageSizeParam) : DEFAULT_PAGE_SIZE;
        const inventory = await getAllInventory();
        const cacheHeaders = { 'Cache-Control': 's-maxage=60, stale-while-revalidate=59' } as const;
        if (!Array.isArray(inventory)) {
             return NextResponse.json({ message: 'Error interno al obtener el inventario (formato inválido)' }, { status: 500, headers: cacheHeaders });
         }
        if (page && page > 0) {
            const total = inventory.length;
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const data = inventory.slice(start, end);
            return NextResponse.json({ data, total, page, pageSize }, { headers: cacheHeaders });
        }
        // Sin paginación
        return NextResponse.json(inventory, { headers: cacheHeaders });
    } catch (error) {
        return NextResponse.json({ message: 'Error al obtener el inventario' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error inesperado en el servidor de inventario' }, { status: 500 });
}
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const itemData: Record<string, any> = {};
        let imageFile: File | null = null;
        for (const [key, value] of formData.entries()) {
             if (value instanceof File) {
                 console.log(`  ${key}: [File: ${value.name}, Size: ${value.size}]`);
             } else {
                 console.log(`  ${key}: ${value}`);
             }
         }
        formData.forEach((value, key) => {
            if (key === 'foto') {
                if (value instanceof File && value.size > 0) {
                    imageFile = value;
                }
            }
            else if (key === 'especificaciones' || key === 'detalles') {
                try {
                    if (value && typeof value === 'string') {
                        itemData[key] = JSON.parse(value);
                    } else {
                        itemData[key] = {}; 
                    }
                } catch(e) {
                    console.warn(`API POST: Error parseando JSON para ${key}:`, e);
                    itemData[key] = {}; 
                }
            }
            else if (key === 'tieneGarantia') {
                itemData[key] = value === 'true';
            }
            else if (key === 'detallesGarantia') {
                itemData[key] = (value === null || value === '') ? null : String(value).trim();
            }
            else if (key === 'usuarioId') {
                itemData[key] = value === UNASSIGNED_VALUE ? null : value;
            }
            else if (key !== 'serial') {
                 itemData[key] = value; 
            }
        });
        if (itemData.tieneGarantia === false) {
            itemData.detallesGarantia = null;
        }
        if (imageFile) {
            itemData.fotoUrl = await saveImage(imageFile); 
        } else {
            if (!itemData.hasOwnProperty('fotoUrl')) {
                itemData.fotoUrl = null;
            }
        }
        const validationResult = EquipoSchema.omit({ id: true, serial: true }).safeParse(itemData);
        if (!validationResult.success) {
            return NextResponse.json({ message: 'Datos inválidos', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
        }
        if (Object.keys(validationResult.data).length === 0 && Object.keys(itemData).length > 1) { 
             return NextResponse.json({ message: 'Error interno al procesar datos validados' }, { status: 500 });
        }
        const newItem = await addInventoryItem(validationResult.data as Omit<Equipo, 'id' | 'serial'>);
        return NextResponse.json(newItem, { status: 201 });

    } catch (error) {
        console.error("API POST /api/inventory Error General:", error);
         if (error instanceof ZodError) {
             return NextResponse.json({ message: 'Error de Validación Inesperado', errors: error.flatten().fieldErrors }, { status: 400 });
         }
        return NextResponse.json({ message: 'Error al crear el equipo' }, { status: 500 });
    }
return NextResponse.json({ message: 'Error inesperado en el servidor al crear equipo' }, { status: 500 });
}

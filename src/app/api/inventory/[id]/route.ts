// Importa las dependencias necesarias para el manejo de rutas y utilidades
import { NextResponse } from 'next/server';
import { getInventoryById, updateInventoryItem, deleteInventoryItem, saveImage } from '@/lib/inventoryService';
import { EquipoSchema, Equipo } from '@/types';
import { ZodError } from 'zod';
import path from 'path';
import fs from 'fs/promises';

// Valor constante para identificar un usuario no asignado
const UNASSIGNED_VALUE = "__NONE__";

// Interfaz para los parámetros de la ruta
interface RouteParams {
    params: {
        id: string;
    };
}

// Maneja la petición GET para obtener un equipo por su ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = params;
        // Busca el equipo por ID
        const item = await getInventoryById(id);
        if (!item) {
            // Si no se encuentra, retorna error 404
            return NextResponse.json({ message: 'Equipo no encontrado' }, { status: 404 });
        }
        // Retorna el equipo encontrado
        return NextResponse.json(item);
    } catch (error) {
        // Manejo de error general
        return NextResponse.json({ message: 'Error al obtener el equipo' }, { status: 500 });
    }
}

// Maneja la petición PUT para actualizar un equipo existente
export async function PUT(request: Request, { params }: RouteParams) {
     try {
        const { id } = params;
        // Obtiene los datos enviados en el formulario
        const formData = await request.formData();
        const itemData: Record<string, any> = {};
        let imageFile: File | null = null;
        let deleteImageFlag = false;
        // Obtiene el equipo actual
        const currentItem = await getInventoryById(id);
        if (!currentItem) {
             // Si no existe, retorna error 404
             return NextResponse.json({ message: 'Equipo no encontrado para actualizar' }, { status: 404 });
        }
        const currentFotoUrl = currentItem?.fotoUrl;
        // Procesa cada campo del formulario
        formData.forEach((value, key) => {
            // Si es una imagen nueva
            if (key === 'foto') { if (value instanceof File && value.size > 0) { imageFile = value; itemData.fotoUrl = undefined; } }
            // Si es un campo JSON
            else if (key === 'especificaciones' || key === 'detalles') { try { if (value) { itemData[key] = JSON.parse(value as string); } else { itemData[key] = {}; } } catch(e) { itemData[key] = {}; } }
            // Si es un booleano
            else if (key === 'tieneGarantia') { itemData[key] = value === 'true'; } 
            // Si es un string o nulo
            else if (key === 'detallesGarantia') { itemData[key] = value ? String(value) : null; }
            // Si se elimina la imagen
            else if (key === 'fotoUrl') { if (value === '' || value === 'null') { itemData[key] = null; deleteImageFlag = true; } else { if (!imageFile) { itemData[key] = value; } } }
            // Si el usuario no está asignado
            else if (key === 'usuarioId') { itemData[key] = value === UNASSIGNED_VALUE ? null : value; }
            // Otros campos
            else { itemData[key] = value; }
        });
        // Lógica para el manejo de la garantía
         if (formData.has('tieneGarantia') && itemData.tieneGarantia === false) {
             itemData.detallesGarantia = null;
         } else if (!formData.has('tieneGarantia') && currentItem.tieneGarantia === false) {
              itemData.detallesGarantia = null;
         } else if (!formData.has('tieneGarantia') && currentItem.tieneGarantia === true && !itemData.hasOwnProperty('detallesGarantia')) {
              itemData.detallesGarantia = currentItem.detallesGarantia;
         }
        // Manejo de la imagen: guardar, eliminar o mantener
        if (imageFile) {
            const newFotoUrl = await saveImage(imageFile);
            itemData.fotoUrl = newFotoUrl;
            // Elimina la imagen anterior si es diferente
            if (currentFotoUrl && currentFotoUrl !== newFotoUrl) { try { await fs.unlink(path.join(process.cwd(), 'public', currentFotoUrl)); } catch (e: any) { if (e.code !== 'ENOENT') console.error("Error unlink old PUT:", e); } }
        } else if (deleteImageFlag && currentFotoUrl) {
             try { await fs.unlink(path.join(process.cwd(), 'public', currentFotoUrl)); } catch (e: any) { if (e.code !== 'ENOENT') console.error("Error unlink delete PUT:", e); }
             itemData.fotoUrl = null;
        } else if (!imageFile && itemData.fotoUrl === undefined && currentFotoUrl) {
             itemData.fotoUrl = currentFotoUrl;
        }
        // Valida los datos usando el esquema de Equipo
        const validationResult = EquipoSchema.omit({ id: true }).partial().safeParse(itemData);
        if (!validationResult.success) {
            // Si hay errores de validación, retorna error 400
            return NextResponse.json({ message: 'Datos inválidos', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
        }
        const dataToUpdate = validationResult.data as Partial<Omit<Equipo, 'id'>>;
        // Si no hay cambios, retorna el equipo actual
        if (Object.keys(dataToUpdate).length === 0) {
            return NextResponse.json(currentItem);
        }
        // Actualiza el equipo
        const updatedItem = await updateInventoryItem(id, dataToUpdate);
        if (!updatedItem) {
             return NextResponse.json({ message: 'Equipo no encontrado después de intentar actualizar' }, { status: 404 });
        }
        // Retorna el equipo actualizado
        return NextResponse.json(updatedItem);

    } catch (error) {
         // Manejo de errores de validación y otros
         if (error instanceof ZodError) { return NextResponse.json({ message: 'Error de Validación Inesperado', errors: error.flatten().fieldErrors }, { status: 400 }); }
        return NextResponse.json({ message: 'Error interno al actualizar el equipo' }, { status: 500 });
    }
}

// Maneja la petición DELETE para eliminar un equipo por su ID
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = params;
        // Busca el equipo a eliminar
        const itemToDelete = await getInventoryById(id);
        if (!itemToDelete) {
            // Si no existe, retorna error 404
            return NextResponse.json({ message: 'Equipo no encontrado para eliminar' }, { status: 404 });
        }
        // Elimina el equipo del inventario
        const success = await deleteInventoryItem(id);
        if (!success) {
            return NextResponse.json({ message: 'Error al eliminar el equipo del archivo' }, { status: 500 });
        }
        // Si el equipo tiene imagen, intenta eliminarla del sistema de archivos
        if (itemToDelete.fotoUrl) {
          try {
            const imagePath = path.join(process.cwd(), 'public', itemToDelete.fotoUrl);
            await fs.unlink(imagePath);
          } catch (unlinkError: any) {
             if (unlinkError.code !== 'ENOENT') { 
             } else {
             }
          }
        } else {
        }
        // Retorna mensaje de éxito
        return NextResponse.json({ message: 'Equipo eliminado correctamente' }, { status: 200 });

    } catch (error) {
        // Manejo de error general
        return NextResponse.json({ message: 'Error interno al eliminar el equipo' }, { status: 500 });
    }
}

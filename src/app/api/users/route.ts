import { NextResponse } from 'next/server';
import { getAllUsers, addUser, saveImage } from '@/lib/userService';
import { UsuarioFormSchema } from '@/lib/schema'; 
import { Usuario } from '@/types';
import { ZodError } from 'zod';
export async function GET(request: Request) {
    try {
        const users = await getAllUsers();
        const cacheHeaders = { 'Cache-Control': 's-maxage=60, stale-while-revalidate=59' } as const;
        if (!Array.isArray(users)) {
            return NextResponse.json({ message: 'Error interno al obtener la lista de usuarios (formato inesperado)' }, { status: 500, headers: cacheHeaders });
        }
        return NextResponse.json(users, { headers: cacheHeaders }); 
    } catch (error) {
        return NextResponse.json({ message: 'Error interno al obtener los usuarios' }, { status: 500 });
    }
}
export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const userData: Record<string, any> = {};
        let imageFile: File | null = null;
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                 if (key === 'foto' && value.size > 0) {
                     imageFile = value;
                 }
            } else {
                 userData[key] = value;
            }
        }
        if (imageFile) {
            try {
                const fotoUrl = await saveImage(imageFile); 
                userData.fotoUrl = fotoUrl; 
            } catch (imgError) {
                 return NextResponse.json({ message: 'Error al guardar la imagen de perfil' }, { status: 500 });
            }
        } else {
            userData.fotoUrl = null;
        }
        const validationResult = UsuarioFormSchema.omit({ id: true }).safeParse(userData);
        if (!validationResult.success) {
            return NextResponse.json({
                message: 'Datos inválidos para el usuario',
                errors: validationResult.error.flatten().fieldErrors
            }, { status: 400 });
        }
        const newUser = await addUser(validationResult.data as Omit<Usuario, 'id'>);
        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
         if (error instanceof ZodError) {
             return NextResponse.json({ message: 'Error de Validación Inesperado (Usuario)', errors: error.flatten().fieldErrors }, { status: 400 });
         }
         if (error instanceof Error) {
              return NextResponse.json({ message: error.message || 'Error interno al crear el usuario' }, { status: 500 });
         }
        return NextResponse.json({ message: 'Error desconocido al crear el usuario' }, { status: 500 });
    }
}

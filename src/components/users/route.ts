import { NextResponse } from 'next/server';
import { getAllUsers, addUser, saveImage } from '@/lib/userService';
import { UsuarioFormSchema } from '@/lib/schema';
import { Usuario } from '@/types';
import { ZodError } from 'zod';
export async function GET(request: Request) {
        try {
            const users = await getAllUsers(); 
            if (!Array.isArray(users)) {
                return NextResponse.json({ message: 'Error interno al obtener la lista de usuarios' }, { status: 500 });
            }
            return NextResponse.json(users);
        } catch (error) {
            return NextResponse.json({ message: 'Error al obtener los usuarios' }, { status: 500 });
        }
    }
    export async function POST(request: Request) {
        try {
            const formData = await request.formData();
            const userData: Record<string, any> = {};
            let imageFile: File | null = null;
            formData.forEach((value, key) => {
                if (value instanceof File) { if (key === 'foto' && value.size > 0) { imageFile = value; } }
                else { userData[key] = value; }
            });
            if (imageFile) { userData.fotoUrl = await saveImage(imageFile); }
            else { userData.fotoUrl = null; }
            const validationResult = UsuarioFormSchema.omit({ id: true }).safeParse(userData);
            if (!validationResult.success) { return NextResponse.json({ message: 'Datos inválidos', errors: validationResult.error.flatten().fieldErrors }, { status: 400 }); }
            const newUser = await addUser(validationResult.data as Omit<Usuario, 'id'>);
            return NextResponse.json(newUser, { status: 201 });
        } catch (error) {
            if (error instanceof ZodError) { return NextResponse.json({ message: 'Error de Validación', errors: error.flatten().fieldErrors }, { status: 400 }); }
            return NextResponse.json({ message: 'Error al crear el usuario' }, { status: 500 });
        }
    }
    
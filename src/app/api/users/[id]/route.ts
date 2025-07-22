import { NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser } from '@/lib/userService';
import { UsuarioFormSchema } from '@/lib/schema';
import { Usuario } from '@/types';
import { ZodError } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

// Obtener usuario por ID (opcional)
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'ID de usuario faltante en la ruta' }, { status: 400 });
  }
  try {
    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: 'Error interno al obtener el usuario' }, { status: 500 });
  }
}

// Actualizar usuario
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'ID de usuario faltante en la ruta' }, { status: 400 });
  }
  try {
    const formData = await request.formData();
    const userData: Record<string, any> = {};
    let imageFile: File | null = null;
    let deleteImageFlag = false;

    formData.forEach((value, key) => {
      if (value instanceof File) {
        if (key === 'foto' && value.size > 0) {
          imageFile = value;
        }
      } else {
        if (key === 'fotoUrl' && (value === '' || value === 'null')) {
          deleteImageFlag = true;
        } else {
          userData[key] = value;
        }
      }
    });

    const validationResult = UsuarioFormSchema.omit({ id: true }).partial().safeParse(userData);
    if (!validationResult.success) {
      return NextResponse.json({
        message: 'Datos inválidos',
        errors: validationResult.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const updatedUser = await updateUser(id, validationResult.data as Partial<Omit<Usuario, 'id'>>, imageFile, deleteImageFlag);
    if (!updatedUser) {
      return NextResponse.json({ message: 'Usuario no encontrado o error al actualizar' }, { status: 404 });
    }
    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ message: 'Error de Validación (Usuario)', errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Error interno al actualizar el usuario' }, { status: 500 });
  }
}

// Eliminar usuario
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: 'ID de usuario faltante en la ruta' }, { status: 400 });
  }
  try {
    const success = await deleteUser(id);
    if (!success) {
      return NextResponse.json({ message: 'Usuario no encontrado o error al eliminar' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Usuario eliminado correctamente' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error interno al eliminar el usuario' }, { status: 500 });
  }
} 
'use client';
import React from 'react';
import Image from 'next/image';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Usuario } from '@/types';
interface UserListModalProps {
    users: Usuario[];
    isOpen: boolean;
    onClose: () => void;
    isLoading?: boolean;
    onDelete?: (id: string) => void;
    isDeleting?: boolean;
}
export function UserListModal({
    users,
    isOpen,
    onClose,
    isLoading = false,
    onDelete,
    isDeleting = false,
}: UserListModalProps) {
    const getInitials = (name: string | undefined | null): string => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length === 0) return '?';
        if (names.length === 1) return names[0][0]?.toUpperCase() || '?';
        return (names[0][0]?.toUpperCase() || '') + (names[names.length - 1][0]?.toUpperCase() || '');
    };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Lista de Usuarios</DialogTitle>
                    <DialogDescription>
                        Usuarios registrados en el sistema.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                    {isLoading ? (
                        <p className="text-center text-muted-foreground">Cargando usuarios...</p>
                    ) : !users || users.length === 0 ? (
                        <p className="text-center text-muted-foreground">No hay usuarios para mostrar.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">Foto</TableHead>
                                    <TableHead>Nombre Completo</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Departamento</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    {onDelete && <TableHead>Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    user && user.id && (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.fotoUrl ?? undefined} alt={user.nombreCompleto} />
                                                    <AvatarFallback>{getInitials(user.nombreCompleto)}</AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium">{user.nombreCompleto}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{user.id}</TableCell>
                                            <TableCell>{user.departamento}</TableCell>
                                            <TableCell>{user.tipoEmpleado}</TableCell>
                                            {onDelete && (
                                                <TableCell>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={isDeleting}
                                                        onClick={() => onDelete(user.id)}
                                                    >
                                                        Dar de baja
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
                <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button variant="outline">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}